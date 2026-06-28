// src/components/CensusDataDrawer.tsx
import React, { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { getCensusTractSummary } from "../../services/demographics";
import type { CensusTractDemographic } from "../../types/demographic";
import CensusTractInfo from "./CensusTractInfo";
import GenderDistributionChart from "../charts/GenderDistributionChart";
import AgeDistributionChart from "../charts/AgeDistributionChart";
import AgeHistogramChart from "../charts/AgeHistogramChart";
import RaceDistributionChart from "../charts/RaceDistributionChart";
import { formatCensusTractId } from "../../utils/census";

interface CensusDataDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  geoid: string | null;
}

const CensusDataDrawer: React.FC<CensusDataDrawerProps> = ({
  isOpen,
  onOpenChange,
  geoid,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [censusData, setCensusData] = useState<CensusTractDemographic | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("overview");
  const isMounted = useRef(true);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to ensure drawer animation completes before resetting state
      const timer = setTimeout(() => {
        if (isMounted.current) {
          setActiveTab("overview");
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!geoid || !isOpen) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getCensusTractSummary(geoid);

        // Only update state if component is still mounted
        if (isMounted.current) {
          setCensusData(data);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred while fetching data"
          );
          console.error(err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [geoid, isOpen]);

  // Safe state update function
  const handleTabChange = (key: string) => {
    if (isMounted.current) {
      setActiveTab(key);
    }
  };

  // Reset data when drawer closes
  useEffect(() => {
    if (!isOpen) {
      // Wait for drawer to close before resetting data
      const timer = setTimeout(() => {
        if (isMounted.current) {
          // Only reset error, keep the data for smoother reopening
          setError(null);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 bg-background p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-xl font-bold text-foreground">
            {censusData
              ? `Census Tract ${formatCensusTractId(
                  censusData.census_tract_info.geoid
                )} Demographics`
              : "Census Tract Demographics"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Census tract demographic breakdown
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <h3 className="font-semibold">Error Loading Data</h3>
              <p>{error}</p>
            </div>
          ) : censusData ? (
            <div className="space-y-6">
              {/* Census Tract Info */}
              <CensusTractInfo tractInfo={censusData.census_tract_info} />

              {/* Tabs for different views */}
              <Tabs
                value={activeTab}
                onValueChange={(key) => handleTabChange(key as string)}
                className="w-full"
              >
                <TabsList className="mx-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="age">Age Details</TabsTrigger>
                  <TabsTrigger value="race">Race Details</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <div className="space-y-8 mt-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Gender Distribution
                          </h3>
                          <GenderDistributionChart
                            genderData={censusData.gender_distribution}
                          />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Age Groups
                          </h3>
                          <AgeDistributionChart
                            ageGroups={censusData.age_groups}
                          />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Race Distribution
                          </h3>
                          <RaceDistributionChart
                            raceData={censusData.race_distribution}
                          />
                        </div>
                  </div>
                </TabsContent>

                <TabsContent value="age">
                      <div className="space-y-8 mt-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Age Distribution by Group
                          </h3>
                          <AgeDistributionChart
                            ageGroups={censusData.age_groups}
                          />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Detailed Age Histogram
                          </h3>
                          <AgeHistogramChart
                            ageDistribution={censusData.age_distribution}
                          />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Age Statistics
                          </h3>

                          <Table
                            aria-label="Age statistics table"
                            className="mt-2"
                          >
                            <TableHeader>
                              <TableRow>
                                <TableHead>METRIC</TableHead>
                                <TableHead>VALUE</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>Median Age</TableCell>
                                <TableCell>
                                  {censusData.census_tract_info.median_age}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Age Dependency Ratio</TableCell>
                                <TableCell>
                                  {
                                    censusData.census_tract_info
                                      .age_dependency_ratio
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Children (0-18)</TableCell>
                                <TableCell>
                                  {censusData.age_groups.children.toLocaleString()}{" "}
                                  people (
                                  {(
                                    (censusData.age_groups.children /
                                      censusData.census_tract_info
                                        .total_population) *
                                    100
                                  ).toFixed(1)}
                                  %)
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Adults (19-64)</TableCell>
                                <TableCell>
                                  {censusData.age_groups.adults.toLocaleString()}{" "}
                                  people (
                                  {(
                                    (censusData.age_groups.adults /
                                      censusData.census_tract_info
                                        .total_population) *
                                    100
                                  ).toFixed(1)}
                                  %)
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Seniors (65+)</TableCell>
                                <TableCell>
                                  {censusData.age_groups.seniors.toLocaleString()}{" "}
                                  people (
                                  {(
                                    (censusData.age_groups.seniors /
                                      censusData.census_tract_info
                                        .total_population) *
                                    100
                                  ).toFixed(1)}
                                  %)
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                  </div>
                </TabsContent>

                <TabsContent value="race">
                      <div className="space-y-8 mt-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Race Distribution
                          </h3>
                          <RaceDistributionChart
                            raceData={censusData.race_distribution}
                          />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Race Statistics
                          </h3>

                          <Table
                            aria-label="Race statistics table"
                            className="mt-2"
                          >
                            <TableHeader>
                              <TableRow>
                                <TableHead>RACE/ETHNICITY</TableHead>
                                <TableHead>POPULATION</TableHead>
                                <TableHead>PERCENTAGE</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(censusData.race_distribution).map(
                                ([race, count]) => (
                                  <TableRow key={race}>
                                    <TableCell>{race}</TableCell>
                                    <TableCell>
                                      {count.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      {(
                                        (count /
                                          censusData.census_tract_info
                                            .total_population) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              No census tract selected
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => {
              // Reset to overview tab before closing
              setActiveTab("overview");
              onOpenChange(false);
            }}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CensusDataDrawer;

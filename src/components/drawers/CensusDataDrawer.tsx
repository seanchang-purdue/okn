// src/components/CensusDataDrawer.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Spinner,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
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
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      classNames={{
        base: "transition-opacity",
      }}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              {censusData ? (
                <h1 className="text-xl font-bold">
                  Census Tract{" "}
                  {formatCensusTractId(censusData.census_tract_info.geoid)}{" "}
                  Demographics
                </h1>
              ) : (
                <h1 className="text-xl font-bold">Census Tract Demographics</h1>
              )}
            </DrawerHeader>

            <DrawerBody>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  <h3 className="font-semibold">Error Loading Data</h3>
                  <p>{error}</p>
                </div>
              ) : censusData ? (
                <div className="space-y-6">
                  {/* Census Tract Info */}
                  <CensusTractInfo tractInfo={censusData.census_tract_info} />

                  {/* Tabs for different views */}
                  <Tabs
                    selectedKey={activeTab}
                    onSelectionChange={(key) => handleTabChange(key as string)}
                    className="w-full flex items-center justify-center"
                    disableAnimation={true}
                  >
                    <Tab key="overview" title="Overview">
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
                    </Tab>

                    <Tab key="age" title="Age Details">
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
                              <TableColumn>METRIC</TableColumn>
                              <TableColumn>VALUE</TableColumn>
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
                    </Tab>

                    <Tab key="race" title="Race Details">
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
                              <TableColumn>RACE/ETHNICITY</TableColumn>
                              <TableColumn>POPULATION</TableColumn>
                              <TableColumn>PERCENTAGE</TableColumn>
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
                    </Tab>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center text-gray-500 p-8">
                  No census tract selected
                </div>
              )}
            </DrawerBody>

            <DrawerFooter>
              <Button
                color="danger"
                variant="light"
                onPress={() => {
                  // Reset to overview tab before closing
                  setActiveTab("overview");
                  onClose();
                }}
              >
                Close
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CensusDataDrawer;

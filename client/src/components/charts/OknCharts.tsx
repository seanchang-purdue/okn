import { useState, useEffect } from "react";
import OknLineChart from "./OknLineChart";
import OknDemographicChart from "./OknDemographicChart";
import type {
  LineChartDataType,
  LineChartRawDataObject,
  DemographicChartDataType,
  DemographicChartRawDataObject,
} from "../../../types/chart";

type OknChartsProps = {
  censusBlock: string[] | undefined;
};

const OknCharts = ({ censusBlock }: OknChartsProps) => {
  const [lineChartData, setLineChartData] = useState<LineChartDataType[]>([]);
  const [demographicChartData, setDemographicChartData] = useState<{
    [key: string]: DemographicChartDataType[];
  }>({});

  useEffect(() => {
    fetchData();
  }, [censusBlock]);

  const fetchData = async () => {
    try {
      // Fetch line chart data (unchanged)
      const response = await fetch("http://127.0.0.1:12345/line-chart-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_date: "2023-01-01",
          end_date: "2023-12-31",
          census_block: JSON.stringify(censusBlock?.map((b) => parseInt(b))),
        }),
      });
      const data: LineChartRawDataObject = await response.json();
      const chartData = Object.keys(data).map((dateKey) => {
        return { date: dateKey, counts: data[dateKey] } as LineChartDataType;
      });
      setLineChartData(chartData);

      // Fetch demographic chart data for multiple features
      const demographicResponse = await fetch(
        "http://127.0.0.1:12345/demographic-chart-data",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            demographic_features: ["sex", "race", "age", "wound", "latino", "fatal"],
            start_date: "2023-01-01",
            end_date: "2023-12-31",
            census_block: JSON.stringify(censusBlock?.map((b) => parseInt(b))),
          }),
        },
      );
      const demographicData: { [key: string]: DemographicChartRawDataObject } =
        await demographicResponse.json();

      const processedDemographicData: { [key: string]: DemographicChartDataType[] } = {};
      
      for (const [feature, data] of Object.entries(demographicData)) {
        processedDemographicData[feature] = Object.keys(data).map((key) => {
          return { feature: key, counts: data[key] };
        });
      }

      setDemographicChartData(processedDemographicData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  return (
    <div className="w-full p-4">
      {lineChartData.length === 0 && Object.keys(demographicChartData).length === 0 && (
        <div className="text-lg text-gray-500 mt-4">
          No data available for this census block.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <OknLineChart title="Trend" data={lineChartData} />
        </div>
        {Object.entries(demographicChartData).map(([feature, data]) => (
          <div key={feature}>
            <OknDemographicChart title={feature} data={data} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OknCharts;

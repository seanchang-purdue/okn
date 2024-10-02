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
  // const [showCharts, setShowCharts] = useState(false);
  const [lineChartData, setLineChartData] = useState<LineChartDataType[]>([]);
  const [demographicChartData, setDemographicChartData] = useState<
    DemographicChartDataType[]
  >([]);

  useEffect(() => {
    fetchData();
  }, [censusBlock]);

  const fetchData = async () => {
    // try to fetch data
    try {
      // Fetch line chart data
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
      // Convert the object into an array of objects for the chart
      const chartData = Object.keys(data).map((dateKey) => {
        return { date: dateKey, counts: data[dateKey] } as LineChartDataType;
      });
      setLineChartData(chartData);

      // Fetch demographic chart data
      const demographicResponse = await fetch(
        "http://127.0.0.1:12345/demographic-chart-data",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            demographic_feature: "sex",
            start_date: "2023-01-01",
            end_date: "2023-12-31",
            census_block: JSON.stringify(censusBlock?.map((b) => parseInt(b))),
          }),
        },
      );
      const demographicData: DemographicChartRawDataObject =
        await demographicResponse.json();

      const demographicChartData = Object.keys(demographicData).map((key) => {
        return { feature: key, counts: demographicData[key] };
      });

      setDemographicChartData(demographicChartData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  return (
    <div className="w-screen flex flex-col items-center justify-center mt-4">
      <div className="w-full flex flex-row items-center justify-center">
        {lineChartData.length === 0 && demographicChartData.length === 0 && (
          <div className="text-lg text-gray-500 mt-4">
            No data available for this census block.
          </div>
        )}
        <OknLineChart data={lineChartData} />
        <OknDemographicChart data={demographicChartData} />
      </div>
    </div>
  );
};

export default OknCharts;

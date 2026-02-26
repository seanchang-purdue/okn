// src/components/CensusTractInfo.tsx
import React from "react";
import type { CensusTractInfo as CensusTractInfoType } from "../../types/demographic";

interface CensusTractInfoProps {
  tractInfo: CensusTractInfoType;
}

const CensusTractInfo: React.FC<CensusTractInfoProps> = ({ tractInfo }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-3 rounded-lg">
          <p className="text-gray-600 text-sm">Total Population</p>
          <p className="text-2xl font-bold">
            {tractInfo.total_population.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-100 p-3 rounded-lg">
          <p className="text-gray-600 text-sm">Median Age</p>
          <p className="text-2xl font-bold">{tractInfo.median_age}</p>
        </div>

        <div className="bg-gray-100 p-3 rounded-lg">
          <p className="text-gray-600 text-sm">Sex Ratio</p>
          <p className="text-2xl font-bold">{tractInfo.sex_ratio}</p>
          <p className="text-xs text-gray-500">Males per 100 females</p>
        </div>

        <div className="bg-gray-100 p-3 rounded-lg">
          <p className="text-gray-600 text-sm">Age Dependency Ratio</p>
          <p className="text-2xl font-bold">{tractInfo.age_dependency_ratio}</p>
        </div>
      </div>
    </div>
  );
};

export default CensusTractInfo;

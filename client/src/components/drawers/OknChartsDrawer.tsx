import { useState, useRef, useEffect } from "react";
import { Tabs, Tab, Switch } from "@heroui/react";
import OknLineChart from "../charts/OknLineChart";
import OknDemographicChart from "../charts/OknDemographicChart";
import ChartIcon from "../../icons/chart";
import CloseIcon from "../../icons/close";
import SortIcon from "../../icons/sort";
import NoDataIcon from "../../icons/no-data";
import WarningIcon from "../../icons/warning";
import type {
  LineChartDataType,
  DemographicChartDataType,
} from "../../types/chart";

interface OknChartsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lineChartData: LineChartDataType[];
  demographicChartData: {
    [key: string]: DemographicChartDataType[];
  };
  error: string | null;
  isLoading: boolean;
}

const OknChartsDrawer = ({
  isOpen,
  onClose,
  lineChartData,
  demographicChartData,
  error,
  isLoading,
}: OknChartsDrawerProps) => {
  const [drawerHeight, setDrawerHeight] = useState(isOpen ? "50vh" : "0");
  const [activeTab, setActiveTab] = useState("trend");
  const [sortEnabled, setSortEnabled] = useState(true);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const initialHeight = useRef<number | null>(null);

  // Handle drawer open/close
  useEffect(() => {
    setDrawerHeight(isOpen ? "50vh" : "0");
  }, [isOpen]);

  // Handle drag to resize
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e 
      ? e.touches[0].clientY 
      : e.clientY;
    
    startY.current = clientY;
    initialHeight.current = drawerRef.current?.clientHeight || 0;
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (startY.current === null || initialHeight.current === null) return;
    
    const clientY = 'touches' in e 
      ? e.touches[0].clientY 
      : e.clientY;
    
    const deltaY = startY.current - clientY;
    const newHeight = initialHeight.current + deltaY;
    
    // Limit height between 30vh and 90vh
    const windowHeight = window.innerHeight;
    const minHeight = windowHeight * 0.3;
    const maxHeight = windowHeight * 0.9;
    
    if (newHeight >= minHeight && newHeight <= maxHeight) {
      setDrawerHeight(`${newHeight}px`);
    }
  };

  const handleDragEnd = () => {
    startY.current = null;
    initialHeight.current = null;
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchend', handleDragEnd);
  };

  // Get available demographic tabs
  const demographicTabs = Object.keys(demographicChartData);
  
  // Create array of all tab keys
  const allTabs = ["trend", ...demographicTabs];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-xl shadow-lg transform transition-all duration-300 ease-in-out z-50 border-t border-gray-200 dark:border-gray-700`}
      style={{ 
        height: drawerHeight, 
        maxHeight: "90vh",
        boxShadow: "0px -2px 8px rgba(0, 0, 0, 0.1)"
      }}
      ref={drawerRef}
    >
      {/* Drag handle */}
      <div 
        className="h-1.5 w-12 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-3 cursor-ns-resize"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      ></div>
      
      {/* Header */}
      <div className="px-6 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <span className="text-blue-500 dark:text-blue-400 mr-3">
            <ChartIcon />
          </span>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Incident Analytics</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close"
        >
          <span className="text-gray-500 dark:text-gray-400">
            <CloseIcon />
          </span>
        </button>
      </div>
      
      {/* Content */}
      <div className="h-full overflow-y-auto">
        {/* Error state */}
        {error && (
          <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded">
            <div className="flex items-center">
              <span className="mr-2 text-red-500 dark:text-red-400">
                <WarningIcon />
              </span>
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center h-48">
            <div className="relative">
              <div className="w-12 h-12 rounded-full absolute border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-blue-500 border-t-transparent"></div>
            </div>
          </div>
        )}
        
        {/* No data state */}
        {!isLoading && !error && lineChartData.length === 0 && demographicTabs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <span className="mb-4">
              <NoDataIcon />
            </span>
            <p className="text-center">No data available for the selected area</p>
            <p className="text-sm text-center mt-2">Try selecting a different area or adjusting your filters</p>
          </div>
        )}
        
        {/* HeroUI Tabs with Sort Toggle */}
        {(lineChartData.length > 0 || demographicTabs.length > 0) && (
          <div className="px-6 pt-4">
            {/* Modified this container to better center the tabs and sort toggle */}
            <div className="flex items-center justify-around mb-2">
                <Tabs 
                  selectedKey={activeTab}
                  onSelectionChange={setActiveTab as any}
                  aria-label="Incident analytics tabs"
                  color="primary"
                  radius="full"
                >
                  <Tab 
                    key="trend" 
                    title={
                      <div className="flex items-center space-x-2">
                        <span>Trend Analysis</span>
                      </div>
                    }
                  />
                  
                  {demographicTabs.map((tab) => (
                    <Tab 
                      key={tab} 
                      title={
                        <div className="flex items-center space-x-2">
                          <span>{tab.charAt(0).toUpperCase() + tab.slice(1)} Distribution</span>
                        </div>
                      }
                    />
                  ))}
                </Tabs>
              
              {/* Sort Toggle - Fixed width container to maintain consistent spacing */}
              <div className="flex items-center space-x-2 ml-4 min-w-[100px] justify-end">
                <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                  <SortIcon />
                  <span className="ml-1">Sort</span>
                </span>
                <Switch
                  size="sm"
                  color="primary"
                  isSelected={sortEnabled}
                  onValueChange={setSortEnabled}
                  aria-label="Sort data"
                />
              </div>
            </div>
            
            {/* Tab content */}
            <div className="mt-4">
              {activeTab === "trend" && lineChartData.length > 0 && (
                <OknLineChart 
                  title="Incident Trend Over Time" 
                  data={lineChartData} 
                  sortEnabled={sortEnabled}
                />
              )}
              
              {demographicTabs.includes(activeTab) && (
                <OknDemographicChart 
                  title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
                  data={demographicChartData[activeTab]} 
                  sortEnabled={sortEnabled}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OknChartsDrawer;

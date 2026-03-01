import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Tabs, Tab, Switch } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@nanostores/react";
import OknLineChart from "./OknLineChart";
import OknDemographicChart from "./OknDemographicChart";
import ChartIcon from "../../icons/chart";
import CloseIcon from "../../icons/close";
import SortIcon from "../../icons/sort";
import NoDataIcon from "../../icons/no-data";
import WarningIcon from "../../icons/warning";
import type {
  LineChartDataType,
  DemographicChartDataType,
} from "../../types/chart";
import ChartCard from "./ChartCard";
import type { DataMode, IntervalMode } from "../../types/filters";
import { floatingDockEdgeStore } from "../../stores/chatLayoutStore";

interface OknChartsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lineChartData: LineChartDataType[];
  demographicChartData: {
    [key: string]: DemographicChartDataType[];
  };
  error: string | null;
  isLoading: boolean;
  dataMode: DataMode;
  interval: IntervalMode;
  chatMode: string;
  topInset?: number;
  variant?: "floating" | "inline";
  showCloseButton?: boolean;
  className?: string;
}

const OknChartsPanel = ({
  isOpen,
  onClose,
  lineChartData,
  demographicChartData,
  error,
  isLoading,
  dataMode,
  interval,
  chatMode,
  topInset = 64,
  variant = "floating",
  showCloseButton = true,
  className = "",
}: OknChartsPanelProps) => {
  const [activeTab, setActiveTab] = useState("trend");
  const [sortEnabled, setSortEnabled] = useState(true);
  const [percentageMode, setPercentageMode] = useState(false);
  const floatingDockEdge = useStore(floatingDockEdgeStore);
  const isFloating = variant === "floating";

  const demographicTabs = useMemo(
    () => Object.keys(demographicChartData),
    [demographicChartData]
  );

  useEffect(() => {
    if (activeTab !== "trend" && !demographicTabs.includes(activeTab)) {
      setActiveTab("trend");
    }
  }, [activeTab, demographicTabs]);

  const panelPlacementClass = useMemo(() => {
    if (chatMode === "sidebar") {
      return "md:left-auto md:right-[430px] md:top-auto md:bottom-20";
    }
    if (chatMode !== "floating") {
      return "md:left-auto md:right-4 md:top-auto md:bottom-20";
    }

    if (floatingDockEdge === "right") {
      return "md:left-4 md:right-auto md:top-auto md:bottom-20";
    }
    if (floatingDockEdge === "left") {
      return "md:left-auto md:right-4 md:top-auto md:bottom-20";
    }
    if (floatingDockEdge === "bottom") {
      return "md:left-auto md:right-4 md:[top:var(--charts-top-offset)] md:bottom-auto";
    }
    return "md:left-auto md:right-4 md:top-auto md:bottom-20";
  }, [chatMode, floatingDockEdge]);

  const topOffset = Math.max(12, Math.round(topInset + 12));
  const bottomMaxHeight = `calc(100vh - ${topOffset + 88}px)`;
  const topMaxHeight = `calc(100vh - ${topOffset + 24}px)`;
  const isTopAnchored = chatMode === "floating" && floatingDockEdge === "bottom";
  const panelStyle: CSSProperties = isTopAnchored
    ? ({
        maxHeight: topMaxHeight,
        "--charts-top-offset": `${topOffset}px`,
      } as CSSProperties)
    : { maxHeight: bottomMaxHeight };

  if (!isOpen) return null;

  const panelBody = (
    <>
      <header className="flex items-center justify-between border-b border-[var(--chat-border)] bg-[color:var(--chat-panel-strong)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--chat-accent)]">
            <ChartIcon />
          </span>
          <h3 className="text-sm font-semibold text-[var(--chat-title)]">
            Analytics
          </h3>
          <span className="apple-notion-pill rounded-full px-2 py-0.5 text-[10px] font-medium text-[var(--chat-muted)]">
            Toggle panel
          </span>
        </div>

        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="apple-notion-icon-btn"
            aria-label="Close analytics panel"
          >
            <CloseIcon />
          </button>
        )}
      </header>

      <div className="h-[calc(100%-57px)] overflow-y-auto px-4 pb-4 pt-3">
        {error && (
          <div className="mb-3 rounded-xl border border-red-300/50 bg-red-50/85 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center gap-2">
              <WarningIcon />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--chat-accent)] border-t-transparent" />
          </div>
        )}

        {!isLoading &&
          !error &&
          lineChartData.length === 0 &&
          demographicTabs.length === 0 && (
            <div className="flex h-40 flex-col items-center justify-center text-[var(--chat-muted)]">
              <NoDataIcon />
              <p className="mt-2 text-sm">No chart data for current filters.</p>
            </div>
          )}

        {(lineChartData.length > 0 || demographicTabs.length > 0) && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(String(key))}
                aria-label="Analytics tabs"
                radius="full"
                color="primary"
                size="sm"
              >
                <Tab key="trend" title="Trend" />
                {demographicTabs.map((tab) => (
                  <Tab
                    key={tab}
                    title={tab.charAt(0).toUpperCase() + tab.slice(1)}
                  />
                ))}
              </Tabs>

              <div className="ml-auto flex items-center gap-3 rounded-full border border-[var(--chat-border)] bg-[var(--apple-notion-pill)] px-3 py-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--chat-muted)]">
                  <SortIcon />
                  Sort
                </span>
                <Switch
                  size="sm"
                  color="primary"
                  isSelected={sortEnabled}
                  onValueChange={setSortEnabled}
                  aria-label="Sort chart series"
                />
                {activeTab !== "trend" && (
                  <>
                    <span className="text-[11px] text-[var(--chat-muted)]">
                      Percent
                    </span>
                    <Switch
                      size="sm"
                      color="secondary"
                      isSelected={percentageMode}
                      onValueChange={setPercentageMode}
                      aria-label="Show chart as percentage"
                    />
                  </>
                )}
              </div>
            </div>

            {activeTab === "trend" && lineChartData.length > 0 && (
              <ChartCard
                title={`${
                  dataMode === "victims" ? "Victim" : "Incident"
                } Trend Over Time`}
              >
                <OknLineChart
                  title="Incident Trend Over Time"
                  data={lineChartData}
                  sortEnabled={sortEnabled}
                  dataMode={dataMode}
                  interval={interval}
                />
              </ChartCard>
            )}

            {demographicTabs.includes(activeTab) && (
              <ChartCard
                title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Distribution`}
                subtitle={
                  percentageMode
                    ? "Share of total incidents"
                    : "Incident counts"
                }
              >
                <OknDemographicChart
                  title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  data={demographicChartData[activeTab] ?? []}
                  sortEnabled={sortEnabled}
                  percentageMode={percentageMode}
                />
              </ChartCard>
            )}
          </>
        )}
      </div>
    </>
  );

  if (!isFloating) {
    return (
      <section
        className={`apple-notion-surface h-[min(58vh,36rem)] overflow-hidden rounded-xl ${className}`.trim()}
      >
        {panelBody}
      </section>
    );
  }

  return (
    <AnimatePresence>
      <motion.section
        className={`apple-notion-surface fixed bottom-20 left-3 right-3 z-40 h-[70vh] overflow-hidden rounded-2xl md:h-[min(72vh,44rem)] md:w-[min(48rem,calc(100vw-2rem))] ${panelPlacementClass} ${className}`.trim()}
        style={panelStyle}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.985 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {panelBody}
      </motion.section>
    </AnimatePresence>
  );
};

export default OknChartsPanel;

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import useChat from "../../hooks/useChat";
import InsightPanel from "../insight/InsightPanel";
import { MAX_CHARACTERS, MAX_QUESTIONS } from "../../types/chat";
import { wsState } from "../../stores/websocketStore";
import { insightState } from "../../stores/insightStore";
import { filtersStore, dateRangeStore } from "../../stores/filterStore";
import { selectedCensusBlocks } from "../../stores/censusStore";
import ChatModeToggle from "./ChatModeToggle";
import AgentStepsPanel from "../status/AgentStepsPanel";

interface ChatBoxProps {
  selectedQuestion: string;
  onQuestionSent: () => void;
  setShowQuestions: React.Dispatch<React.SetStateAction<boolean>>;
  onChatStateChange?: (isEmpty: boolean) => void;
  onResetChat?: (resetFn: () => void) => void;
}

type ContextSuggestion = {
  label: string;
  query: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const humanizeTaxonomy = (value: string) =>
  value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const extractDateToken = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    const token = value.toString().trim();
    if (token && token !== "[object Object]") {
      return token;
    }
  }
  return null;
};

const buildDateLabel = (dateRangeValue: unknown) => {
  if (!dateRangeValue || typeof dateRangeValue !== "object") {
    return "Default date range";
  }

  const rawRange = dateRangeValue as Record<string, unknown>;
  const start = extractDateToken(rawRange.start);
  const end = extractDateToken(rawRange.end);

  if (start && end) {
    const startYear = start.slice(0, 4);
    const endYear = end.slice(0, 4);
    if (/^\d{4}$/.test(startYear) && /^\d{4}$/.test(endYear)) {
      return `${startYear}-${endYear}`;
    }
    return `${start} to ${end}`;
  }
  return "Default date range";
};

const buildTaxonomyLabel = (taxonomyValue: unknown) => {
  if (!Array.isArray(taxonomyValue)) {
    return "All incident types";
  }

  const normalized = taxonomyValue
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);

  if (normalized.length === 0) {
    return "All incident types";
  }

  if (normalized.length === 1) {
    return humanizeTaxonomy(normalized[0]);
  }

  const [first, second] = normalized;
  const extra = normalized.length - 2;
  if (extra <= 0) {
    return `${humanizeTaxonomy(first)}, ${humanizeTaxonomy(second)}`;
  }
  return `${humanizeTaxonomy(first)}, ${humanizeTaxonomy(second)} +${extra}`;
};

const buildContextSuggestions = ({
  geography,
  taxonomyValue,
  selectedTracts,
}: {
  geography: string | null;
  taxonomyValue: unknown;
  selectedTracts: number;
}): ContextSuggestion[] => {
  if (selectedTracts > 0) {
    return [
      {
        label: "Compare selected tracts",
        query: `Compare the selected ${selectedTracts} census tract${selectedTracts === 1 ? "" : "s"} and summarize key incident differences.`,
      },
      {
        label: "Show 5-year trend",
        query: "Show the 5-year incident trend for the selected census tracts.",
      },
      {
        label: "Analyze demographics",
        query: "Analyze demographic context and incident patterns for the selected census tracts.",
      },
    ];
  }

  if (isNonEmptyString(geography)) {
    return [
      {
        label: "Explain local trend",
        query: `Explain the recent incident trend in ${geography}.`,
      },
      {
        label: "Compare to city average",
        query: `Compare incident patterns in ${geography} to the city-wide average.`,
      },
      {
        label: "Demographic context",
        query: `Analyze demographic context and incident patterns in ${geography}.`,
      },
    ];
  }

  const taxonomy = Array.isArray(taxonomyValue)
    ? taxonomyValue
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
    : [];

  if (taxonomy.length > 0) {
    const firstCategory = humanizeTaxonomy(taxonomy[0]);
    return [
      {
        label: "Trend by time",
        query: `How has ${firstCategory.toLowerCase()} changed over time in the current scope?`,
      },
      {
        label: "Map concentration",
        query: `Where are ${firstCategory.toLowerCase()} incidents most concentrated?`,
      },
      {
        label: "Compare neighborhoods",
        query: `Compare ${firstCategory.toLowerCase()} across neighborhoods and highlight outliers.`,
      },
    ];
  }

  return [
    {
      label: "Hotspots overview",
      query: "Where are incident hotspots over the last 3 years?",
    },
    {
      label: "Trend by neighborhood",
      query: "Compare incident trends by neighborhood for the current date range.",
    },
  ];
};

const ChatBox = ({
  selectedQuestion,
  onQuestionSent,
  setShowQuestions,
  onChatStateChange,
  onResetChat,
}: ChatBoxProps) => {
  const {
    streamingMessages,
    sendMessage,
    isConnected,
    loading,
    error,
    remainingQuestions,
    resetChat,
    currentStatus,
  } = useChat();

  const wsSnapshot = useStore(wsState);
  const { blocks } = useStore(insightState);
  const filtersValue = useStore(filtersStore);
  const dateRangeValue = useStore(dateRangeStore);
  const censusBlocks = useStore(selectedCensusBlocks);

  const [draft, setDraft] = useState("");

  const handleSendMessage = useCallback(
    (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || remainingQuestions <= 0) return;
      sendMessage(trimmedMessage);
      setDraft("");
      setShowQuestions(false);
    },
    [remainingQuestions, sendMessage, setShowQuestions]
  );

  const handleSuggestionClick = useCallback(
    (question: string) => {
      setDraft(question);
      handleSendMessage(question);
    },
    [handleSendMessage]
  );

  const hasActiveContent = blocks.length > 0 || streamingMessages.size > 0;
  // needs_clarification means the backend is waiting for the user to rephrase,
  // not that a query is in flight — keep the input enabled in that state.
  const isProcessing =
    loading || (currentStatus !== null && currentStatus.stage !== "needs_clarification");
  const geographyLabel = isNonEmptyString(filtersValue.geography)
    ? filtersValue.geography
    : isNonEmptyString(filtersValue.city)
      ? filtersValue.city
      : null;
  const contextLabel = useMemo(() => {
    const location = geographyLabel ?? "All geography";
    const date = buildDateLabel(dateRangeValue);
    const taxonomy = buildTaxonomyLabel(filtersValue.incidentTaxonomy);
    const tractSelection =
      censusBlocks.length > 0
        ? `${censusBlocks.length} tract${censusBlocks.length === 1 ? "" : "s"} selected`
        : null;

    return [location, date, taxonomy, tractSelection]
      .filter((part): part is string => Boolean(part))
      .join(" | ");
  }, [
    geographyLabel,
    dateRangeValue,
    filtersValue.incidentTaxonomy,
    censusBlocks.length,
  ]);
  const contextualSuggestions = useMemo(
    () =>
      buildContextSuggestions({
        geography: geographyLabel,
        taxonomyValue: filtersValue.incidentTaxonomy,
        selectedTracts: censusBlocks.length,
      }),
    [geographyLabel, filtersValue.incidentTaxonomy, censusBlocks.length]
  );
  const connectionState = useMemo<"connected" | "reconnecting" | "offline">(() => {
    if (isConnected) return "connected";
    if (error.trim().length > 0 && wsSnapshot.retryable === false) {
      return "offline";
    }
    return "reconnecting";
  }, [error, isConnected, wsSnapshot.retryable]);
  const connectionLabel =
    connectionState === "connected"
      ? "Connected"
      : connectionState === "offline"
        ? "Offline"
        : "Reconnecting...";
  const connectionDotClass =
    connectionState === "connected"
      ? "bg-emerald-500"
      : connectionState === "offline"
        ? "bg-slate-400"
        : "bg-amber-500";
  const displayContextLabel = contextLabel.split(" | ").join(" · ");

  useEffect(() => {
    if (!selectedQuestion) return;
    setDraft(selectedQuestion);
    handleSendMessage(selectedQuestion);
    onQuestionSent();
  }, [selectedQuestion, handleSendMessage, onQuestionSent]);

  useEffect(() => {
    setShowQuestions(!hasActiveContent);
  }, [hasActiveContent, setShowQuestions]);

  useEffect(() => {
    if (onChatStateChange) {
      onChatStateChange(!hasActiveContent);
    }
  }, [hasActiveContent, onChatStateChange]);

  useEffect(() => {
    if (onResetChat) {
      onResetChat(resetChat);
    }
  }, [resetChat, onResetChat]);

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <header className="relative z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            OKN AI
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className={`h-2 w-2 rounded-full ${connectionDotClass}`} />
            <span>{connectionLabel}</span>
          </div>
        </div>
        <ChatModeToggle />
      </header>

      <div className="relative z-10 flex h-11 items-center border-b border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="truncate text-[13px] text-slate-600 dark:text-slate-300">
          {displayContextLabel}
        </p>
      </div>

      <AgentStepsPanel />

      <div className="relative z-10 min-h-0 flex-1">
        <InsightPanel
          draft={draft}
          onDraftChange={setDraft}
          onSendMessage={handleSendMessage}
          disabled={!isConnected || isProcessing}
          loading={isProcessing}
          maxCharacters={MAX_CHARACTERS}
          remainingQuestions={remainingQuestions}
          maxQuestions={MAX_QUESTIONS}
          connectionState={connectionState}
          contextLabel={contextLabel}
          contextualSuggestions={contextualSuggestions}
          onSelectContextSuggestion={handleSuggestionClick}
        />
      </div>
    </section>
  );
};

export default ChatBox;

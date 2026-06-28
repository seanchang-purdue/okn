"use client";

// src/components/status/AgentStepsPanel.tsx
// Inline panel inside the chat sidebar that shows agent tool-call steps
// in real time while the backend agent loop is running.

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { wsCurrentStatus } from "../../stores/websocketStore";
import { isAgentPipeline, reduceAgentStep } from "../../utils/pipeline";
import AgentStepTracker, { type AgentStep } from "./AgentStepTracker";

// How long (ms) the panel lingers after the pipeline finishes before hiding
const LINGER_MS = 1800;

const AgentStepsPanel = () => {
  const currentStatus = useStore(wsCurrentStatus);

  const stepsRef = useRef<AgentStep[]>([]);
  const lastStatusRef = useRef<typeof currentStatus>(null);
  const [, setStepVersion] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Total elapsed timer
  const panelStartRef = useRef<number | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalElapsedMs, setFinalElapsedMs] = useState<number | null>(null);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }, []);

  const startElapsedTimer = useCallback(() => {
    stopElapsedTimer();
    panelStartRef.current = Date.now();
    setFinalElapsedMs(null);
    setElapsedMs(0);
    elapsedIntervalRef.current = setInterval(() => {
      if (panelStartRef.current) {
        setElapsedMs(Date.now() - panelStartRef.current);
      }
    }, 100);
  }, [stopElapsedTimer]);

  // Clean up elapsed interval on unmount
  useEffect(() => {
    return () => stopElapsedTimer();
  }, [stopElapsedTimer]);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const isDone =
      !currentStatus ||
      currentStatus.stage === "complete" ||
      currentStatus.stage === "generating_map";

    if (isDone) {
      // Capture final elapsed and stop ticking
      if (panelStartRef.current) {
        setFinalElapsedMs(Date.now() - panelStartRef.current);
      }
      stopElapsedTimer();

      hideTimerRef.current = setTimeout(() => {
        stepsRef.current = [];
        lastStatusRef.current = null;
        panelStartRef.current = null;
        setStepVersion(0);
        setVisible(false);
        setElapsedMs(0);
        setFinalElapsedMs(null);
      }, LINGER_MS);
      return;
    }

    // Skip if we already processed this exact status object (avoids duplicates
    // when the effect re-fires due to `visible` changing in the same render cycle)
    if (currentStatus === lastStatusRef.current) return;
    lastStatusRef.current = currentStatus;

    const prev = stepsRef.current;
    const next = reduceAgentStep(prev, currentStatus);
    if (next !== prev) {
      // Start elapsed timer when first step arrives
      if (prev.length === 0 && next.length > 0) {
        startElapsedTimer();
      }
      stepsRef.current = next;
      setStepVersion((v) => v + 1);
      if (next.length > 0 && !visible) {
        setVisible(true);
      }
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [currentStatus, visible, startElapsedTimer, stopElapsedTimer]);

  const agentPi =
    currentStatus && isAgentPipeline(currentStatus.phaseInfo)
      ? currentStatus.phaseInfo
      : null;

  const steps = stepsRef.current;
  const isLive = !!agentPi;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="agent-steps-panel"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden border-b border-border bg-muted"
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setIsExpanded((e) => !e)}
          className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-accent"
        >
          {/* Icon */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
            </svg>
          </span>

          {/* Title */}
          <span className="flex-1 text-xs font-semibold text-foreground">
            Agent Research
          </span>

          {/* Step counter or done badge */}
          {agentPi && (
            <Badge variant="secondary" className="tabular-nums">
              {agentPi.step}/{agentPi.maxSteps}
            </Badge>
          )}
          {!isLive && steps.length > 0 && (
            <Badge
              variant="secondary"
              className="tabular-nums text-emerald-600 dark:text-emerald-500"
            >
              Done · {steps.length} tool{steps.length === 1 ? "" : "s"}
              {finalElapsedMs != null && ` · ${(finalElapsedMs / 1000).toFixed(1)}s`}
            </Badge>
          )}
          {/* Live elapsed counter */}
          {isLive && elapsedMs > 0 && (
            <span className="tabular-nums text-xs text-muted-foreground">
              {(elapsedMs / 1000).toFixed(1)}s
            </span>
          )}

          {/* Live pulse */}
          {isLive && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          )}

          {/* Chevron */}
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isExpanded ? "" : "-rotate-90"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expandable step list */}
        <AnimatePresence initial={false}>
          {isExpanded && steps.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="max-h-[180px] overflow-y-auto px-4 pb-3 pt-1">
                <AgentStepTracker
                  steps={steps}
                  currentStep={agentPi?.step ?? steps.length}
                  maxSteps={agentPi?.maxSteps ?? 8}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentStepsPanel;

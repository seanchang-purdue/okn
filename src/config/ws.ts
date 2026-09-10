export const MODEL_CONFIGS = {
  CHAT: "/chat",
  SPARQL: "/sparql",
  AGENT: "/agent",
} as const;

export const AGENT_ENABLED = process.env.NEXT_PUBLIC_AGENT_ENABLED === "true";

export type ModelType = keyof typeof MODEL_CONFIGS;

export const getWsUrl = (model: ModelType) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_CHATBOT_URL || "ws://localhost:8000/api/v1/ws";
  return `${baseUrl.replace(/\/+$/, "")}${MODEL_CONFIGS[model]}`;
};

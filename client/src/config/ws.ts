export const MODEL_CONFIGS = {
  Chat: "/chat",
  SPARQL: "/sparql",
} as const;

export type ModelType = keyof typeof MODEL_CONFIGS;

export const getWsUrl = (model: ModelType) => {
  const baseUrl = import.meta.env.PUBLIC_CHATBOT_URL || "ws://localhost:8000";
  return `${baseUrl}${MODEL_CONFIGS[model]}`;
};

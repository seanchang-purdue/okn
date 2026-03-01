const DEFAULT_BASE = "/api/v1";

const resolveBase = (value?: string): string => {
  if (!value) return DEFAULT_BASE;
  // Strip trailing slashes so apiUrl("/foo") doesn't produce double slashes
  return value.replace(/\/+$/, "") || DEFAULT_BASE;
};

export const API_BASE_URL = resolveBase(process.env.NEXT_PUBLIC_SERVER_URL);

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

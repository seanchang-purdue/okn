// src/services/datacubeService.ts
import { apiUrl } from "../config/api";
import type {
  DatacubeSchemaResponse,
  DatacubeQueryRequest,
  DatacubeQueryResponse,
} from "../types/datacube";

export class ValidationError extends Error {
  constructor(public detail: string) {
    super(detail);
    this.name = "ValidationError";
  }
}

export class QueryError extends Error {
  constructor(public detail: string) {
    super(detail);
    this.name = "QueryError";
  }
}

export async function fetchSchema(): Promise<DatacubeSchemaResponse> {
  const resp = await fetch(apiUrl("/datacube/schema"));
  if (!resp.ok) throw new Error("Failed to load datacube schema");
  return resp.json();
}

export async function queryDatacube(
  req: DatacubeQueryRequest
): Promise<DatacubeQueryResponse> {
  const resp = await fetch(apiUrl("/datacube/query"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (resp.status === 422) {
    const err = await resp.json();
    throw new ValidationError(err.detail ?? "Invalid selection");
  }
  if (resp.status === 400) {
    const err = await resp.json();
    throw new QueryError(
      err.detail ?? "Too many results — add more filters to narrow the data."
    );
  }
  if (!resp.ok) throw new Error("Server error");
  return resp.json();
}

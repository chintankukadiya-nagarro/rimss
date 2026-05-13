/** Shared API contracts (expand in Phase 1 search DTO). */
export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface ReadyResponse extends HealthResponse {
  database: "up" | "down";
  redis: "up" | "skipped" | "down";
}

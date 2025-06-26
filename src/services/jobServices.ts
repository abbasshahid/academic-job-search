import type { Job } from "../types/job";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function fetchJobs(keywords: string[]): Promise<Job[]> {
  const params = new URLSearchParams();
  params.append("keywords", keywords.join(","));
  const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`, {
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

"use client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private async request<T>(method: string, path: string, body?: any, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}/api${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
      });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data.error || "Request failed", res.status, data);
    }
    return data;
  }

  get<T>(path: string, params?: Record<string, string>) {
    return this.request<T>("GET", path, undefined, params);
  }

  post<T>(path: string, body?: any) {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: any) {
    return this.request<T>("PUT", path, body);
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const url = new URL(`${BASE_URL}/api${path}`, window.location.origin);
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data.error || "Upload failed", res.status, data);
    }
    return data;
  }
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = new ApiClient();
export default api;

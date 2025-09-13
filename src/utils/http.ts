export type ServerErrorPayload = {
  error?: string | { code?: string | number; message?: string };
  message?: string;
  status_code?: number;
  detail?: string;
};

export type SafeFetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NETWORK_ERROR";
  }
}

export class ServerError extends Error {
  public status: number;
  public payload?: ServerErrorPayload;

  constructor(status: number, payload?: ServerErrorPayload) {
    const msg =
      (payload &&
        (typeof payload.error === "string"
          ? payload.error
          : payload?.error?.message)) ||
      payload?.message ||
      `Server error (${status})`;
    super(msg);
    this.name = "SERVER_ERROR";
    this.status = status;
    this.payload = payload;
  }
}

export async function safeFetchJSON<T>(url: string, options: SafeFetchOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, signal } = options;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    if (!res.ok) {
      let payload: any = {};
      try {
        payload = isJson ? await res.json() : { text: await res.text() };
      } catch {
        // ignore
      }
      throw new ServerError(res.status, payload as ServerErrorPayload);
    }

    const data = isJson ? await res.json() : ((await res.text()) as unknown as T);
    return data as T;
  } catch (err: unknown) {
    if (err instanceof ServerError) {
      // 서버 에러
      console.error("[SERVER_ERROR]", url, err.status, err.payload);
      throw err;
    }
    // 네트워크/기타 에러
    const e = err as Error;
    console.error("[NETWORK_ERROR]", url, e?.message || String(err));
    throw new NetworkError(e?.message || "Network error");
  }
}

// 요청/응답 타입 (백엔드 스키마용)
export type ChatRequestBody = {
  message: string;
  user_id?: string;
  chat_id?: string;
};

export type ChatResponseBody = {
  response?: string;
  service_used?: string;
  confidence?: number;
  session_id?: string;
  artifacts?: unknown;
};



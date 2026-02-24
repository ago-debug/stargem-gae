import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let errorData: any = { message: text || res.statusText };
    
    // Try to parse JSON error response
    try {
      errorData = JSON.parse(text);
    } catch {
      // Not JSON, use text as message
    }
    
    // Create error with additional data
    const error: any = new Error(errorData.message || `${res.status}: ${text}`);
    error.status = res.status;
    if (errorData.conflictWith) {
      error.conflictWith = errorData.conflictWith;
    }
    throw error;
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    let errorData: any = { message: text || res.statusText };
    
    try {
      errorData = JSON.parse(text);
    } catch {
      // Not JSON, use text as message
    }
    
    const error: any = new Error(errorData.message || `${res.status}: ${text}`);
    error.status = res.status;
    if (errorData.conflictWith) {
      error.conflictWith = errorData.conflictWith;
    }
    throw error;
  }

  // Parse and return JSON response
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  return {} as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

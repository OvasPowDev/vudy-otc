import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function fetchData<TData>({ queryKey }: { queryKey: readonly unknown[] }): Promise<TData> {
  const url = queryKey[0] as string;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: fetchData as QueryFunction,
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiRequest<TData = unknown>(
  url: string,
  method: RequestMethod = "GET",
  data?: unknown,
): Promise<TData> {
  const options: RequestInit = {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  };

  const res = await fetch(url, options);

  if (!res.ok) {
    let errorMessage = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

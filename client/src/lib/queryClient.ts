import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error: ${res.status} - ${text}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`Making ${method} request to ${url} from ${window.location.hostname}`);
    const token = await auth.currentUser?.getIdToken(true); // Force token refresh
    console.log('Token status:', token ? 'Token obtained' : 'No token available');

    if (!token) {
      console.error('No authentication token available - user might not be logged in');
      throw new Error("No authentication token available");
    }

    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Authorization": `Bearer ${token}`,
    };

    console.log('Request details:', { 
      url,
      method,
      hasContentType: !!data,
      hasAuthorization: !!headers.Authorization,
      host: window.location.hostname
    });

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      cache: "no-store", // Prevent caching
    });

    if (res.status === 401) {
      console.error('Authentication failed:', {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        host: window.location.hostname
      });
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      console.log('Executing query:', queryKey[0], 'from', window.location.hostname);
      const token = await auth.currentUser?.getIdToken(true); // Force token refresh
      console.log('Query token status:', token ? 'Token obtained' : 'No token available');

      if (!token) {
        if (unauthorizedBehavior === "returnNull") {
          console.log('No token available, returning null as configured');
          return null;
        }
        console.error('No authentication token available for query');
        throw new Error("No authentication token available");
      }

      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
      };

      console.log('Query details:', {
        url: queryKey[0],
        hasAuthorization: !!headers.Authorization,
        host: window.location.hostname
      });

      const res = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        console.error('Query authentication failed:', {
          status: res.status,
          statusText: res.statusText,
          url: res.url,
          host: window.location.hostname
        });
        if (unauthorizedBehavior === "returnNull") {
          console.log('Received 401, returning null as configured');
          return null;
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Query failed:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 0,
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof Error && error.message.startsWith("401:")) {
          console.log('Not retrying 401 error');
          return false;
        }
        console.log(`Retrying query (attempt ${failureCount + 1}/3)`);
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
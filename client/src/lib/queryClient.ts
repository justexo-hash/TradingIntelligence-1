import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error: ${res.status} - ${text}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthToken(forceRefresh = false): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in, returning null token');
      return null;
    }

    const token = await user.getIdToken(forceRefresh);
    console.log('Token obtained:', {
      success: !!token,
      uid: user.uid,
      tokenLength: token?.length,
      host: window.location.hostname
    });
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isDevelopment = !import.meta.env.PROD;
  try {
    console.log(`Making ${method} request to ${url}`, {
      host: window.location.hostname,
      isDevelopment
    });

    // First try without force refresh
    let token = await getAuthToken(false);

    if (!token && !isDevelopment) {
      console.error('No authentication token available');
      throw new Error("Authentication required");
    }

    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };

    console.log('Initial request details:', { 
      url,
      method,
      hasToken: !!token,
      host: window.location.hostname
    });

    let res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      cache: "no-store",
    });

    // If unauthorized, try one more time with forced token refresh
    if (res.status === 401) {
      console.log('Request failed with 401, attempting token refresh');
      token = await getAuthToken(true);

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('Retrying request with new token');

        res = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
          cache: "no-store",
        });
      }
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
}

export const getQueryFn: <T>(options: {
  on401: "returnNull" | "throw";
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const isDevelopment = !import.meta.env.PROD;
    try {
      console.log('Executing query:', {
        key: queryKey[0],
        host: window.location.hostname,
        isDevelopment
      });

      // First try without force refresh
      let token = await getAuthToken(false);

      if (!token && !isDevelopment) {
        if (unauthorizedBehavior === "returnNull") {
          console.log('No token available, returning null as configured');
          return null;
        }
        throw new Error("Authentication required");
      }

      const headers: Record<string, string> = token
        ? { "Authorization": `Bearer ${token}` }
        : {};

      console.log('Query details:', {
        url: queryKey[0],
        hasToken: !!token,
        host: window.location.hostname
      });

      let res = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include",
        cache: "no-store",
      });

      // If unauthorized, try one more time with forced token refresh
      if (res.status === 401) {
        console.log('Query failed with 401, attempting token refresh');
        token = await getAuthToken(true);

        if (token) {
          headers.Authorization = `Bearer ${token}`;
          console.log('Retrying query with new token');

          res = await fetch(queryKey[0] as string, {
            headers,
            credentials: "include",
            cache: "no-store",
          });
        }

        if (res.status === 401 && unauthorizedBehavior === "returnNull") {
          console.log('Authentication failed after refresh, returning null');
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
        if (error instanceof Error && error.message.startsWith("401:")) {
          console.log('Not retrying auth error');
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
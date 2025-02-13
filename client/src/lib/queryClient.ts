import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error: ${res.status} - ${text}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthToken(forceRefresh = true): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in');
      return null;
    }

    const token = await user.getIdToken(forceRefresh);
    console.log('Token obtained:', {
      success: !!token,
      uid: user.uid,
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
  try {
    console.log(`Making ${method} request to ${url} from ${window.location.hostname}`);
    const token = await getAuthToken(true);

    if (!token) {
      console.error('No authentication token available');
      throw new Error("Authentication required");
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
      cache: "no-store",
    });

    if (res.status === 401) {
      console.error('Authentication failed:', {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        host: window.location.hostname
      });

      // Try one more time with a forced token refresh
      const newToken = await getAuthToken(true);
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
          cache: "no-store",
        });

        if (retryRes.ok) {
          return retryRes;
        }
      }
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
      const token = await getAuthToken(true);

      if (!token) {
        if (unauthorizedBehavior === "returnNull") {
          console.log('No token available, returning null as configured');
          return null;
        }
        throw new Error("Authentication required");
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

        // Try one more time with a forced token refresh
        const newToken = await getAuthToken(true);
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          const retryRes = await fetch(queryKey[0] as string, {
            headers,
            credentials: "include",
            cache: "no-store",
          });

          if (retryRes.ok) {
            return await retryRes.json();
          }
        }

        if (unauthorizedBehavior === "returnNull") {
          console.log('Authentication failed, returning null as configured');
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
const API_BASE_URL = process.env.BACKEND_URL;
import { useAuth } from "@clerk/clerk-expo";
export const useApiClient = () => {
  const { getToken } = useAuth();

  const request = async <T = any>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body?: any,
    options: RequestInit = {}
  ): Promise<T> => {
    const token = await getToken();

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
      ...options,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return res.json() as Promise<T>;
  };

  return { request };
};

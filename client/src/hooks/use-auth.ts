import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

export type AuthRole = "user" | "business";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
  avatar?: string | null;
  level?: number;
  points?: number;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: AuthRole;
};

const authQueryKey = ["/api/auth/me"];

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: authQueryKey,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await apiRequest("POST", "/api/auth/login", payload);
      return response.json() as Promise<AuthUser>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authQueryKey, data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await apiRequest("POST", "/api/auth/register", payload);
      return response.json() as Promise<AuthUser>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(authQueryKey, data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(authQueryKey, null);
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginStatus: loginMutation.status,
    registerStatus: registerMutation.status,
    logoutStatus: logoutMutation.status,
  };
}

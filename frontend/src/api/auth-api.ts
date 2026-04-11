import { apiClient } from "@/lib/axios-client";
import type { AuthResponse, LoginRequestBody, MeResponse, RegisterRequestBody } from "@/types/auth";

export async function postLogin(body: LoginRequestBody): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/login", body);
  return data;
}

export async function postRegister(body: RegisterRequestBody): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/register", body);
  return data;
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>("/api/auth/me");
  return data;
}

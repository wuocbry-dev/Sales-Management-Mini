/** Khớp backend `AuthDtos` (JSON camelCase). */

export type AuthUserInfo = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: AuthUserInfo;
  roles: string[];
  permissions: string[];
  storeIds: number[];
  branchIds: number[];
};

export type MeResponse = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  roles: string[];
  permissions: string[];
  storeIds: number[];
  branchIds: number[];
  defaultStoreId: number | null;
};

export type LoginRequestBody = {
  username: string;
  password: string;
};

export type RegisterRequestBody = {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
};

export type ApiErrorBody = {
  timestamp?: string;
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
};

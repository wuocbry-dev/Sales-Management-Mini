/** Khớp backend `CustomerDtos` (JSON camelCase). */

export type CustomerRequestBody = {
  customerCode: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  status: string;
};

export type CustomerResponse = {
  id: number;
  customerCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  loyaltyPoints: number;
  totalSpent: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { CustomerRequestBody, CustomerResponse } from "@/types/customer";
import type { SpringPage } from "@/types/spring-page";

export type CustomerPageQuery = PageQuery & {
  storeId?: number;
};

export async function fetchCustomersPage(q: CustomerPageQuery): Promise<SpringPage<CustomerResponse>> {
  const { data } = await apiClient.get<SpringPage<CustomerResponse>>("/api/customers", { params: q });
  return data;
}

export async function fetchCustomerById(id: number): Promise<CustomerResponse> {
  const { data } = await apiClient.get<CustomerResponse>(`/api/customers/${id}`);
  return data;
}

export async function createCustomer(body: CustomerRequestBody): Promise<CustomerResponse> {
  const { data } = await apiClient.post<CustomerResponse>("/api/customers", body);
  return data;
}

export async function updateCustomer(id: number, body: CustomerRequestBody): Promise<CustomerResponse> {
  const { data } = await apiClient.put<CustomerResponse>(`/api/customers/${id}`, body);
  return data;
}

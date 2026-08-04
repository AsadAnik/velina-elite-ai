import { fetchApi } from './api';

export interface Address {
  id: number;
  customer_id: number;
  line1: string;
  line2?: string;
  city: string;
  counrty: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressDto {
  line1: string;
  line2?: string;
  city: string;
  counrty: string;
  postal_code: string;
  is_default?: boolean;
}

export interface UpdateAddressDto {
  line1?: string;
  line2?: string;
  city?: string;
  counrty?: string;
  postal_code?: string;
  is_default?: boolean;
}

export async function getAddresses(): Promise<Address[]> {
  return fetchApi<Address[]>('/addresses');
}

export async function createAddress(data: CreateAddressDto): Promise<Address> {
  return fetchApi<Address>('/addresses', {
    method: 'POST',
    data,
  });
}

export async function updateAddress(id: number, data: UpdateAddressDto): Promise<Address> {
  return fetchApi<Address>(`/addresses/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteAddress(id: number): Promise<void> {
  return fetchApi<void>(`/addresses/${id}`, {
    method: 'DELETE',
  });
}

export async function setDefaultAddress(id: number): Promise<Address> {
  return fetchApi<Address>(`/addresses/${id}/default`, {
    method: 'PUT',
  });
}

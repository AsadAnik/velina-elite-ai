import { fetchApi } from './api';

export enum OrderStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  preparing = 'preparing',
  shipping = 'shipping',
  shipped = 'shipped',
  delivered = 'delivered',
  ready_for_receive = 'ready_for_receive',
  completed = 'completed',
  cancelled = 'cancelled',
}

export enum PaymentMethod {
  cod = 'cod',
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  created_at: string;
  product: {
    id: number;
    title: string;
    price: number;
    images_url: string[];
    category: {
      id: number;
      name: string;
    };
    sub_category: {
      id: number;
      name: string;
    };
  };
}

export interface OrderHistory {
  id: number;
  order_id: number;
  status: OrderStatus;
  note?: string;
  created_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  shipping_address_id: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  note?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    fname: string;
    lname: string;
    user: {
      id: number;
      email: string;
    };
  };
  shipping_address: {
    id: number;
    line1: string;
    line2?: string;
    city: string;
    counrty: string;
    postal_code: string;
  };
  order_items: OrderItem[];
  order_histories: OrderHistory[];
}

export interface CreateOrderDto {
  shipping_address_id: number;
  items: {
    product_id: number;
    quantity: number;
  }[];
  note?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  note?: string;
}

export async function createOrder(data: CreateOrderDto): Promise<Order> {
  return fetchApi<Order>('/orders', {
    method: 'POST',
    data,
  });
}

export async function getMyOrders(): Promise<Order[]> {
  return fetchApi<Order[]>('/orders/my-orders');
}

export async function getMyOrderById(id: number): Promise<Order> {
  return fetchApi<Order>(`/orders/my-orders/${id}`);
}

export async function cancelMyOrder(id: number): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/orders/my-orders/${id}/cancel`, {
    method: 'POST',
  });
}

export async function getAllOrders(): Promise<Order[]> {
  return fetchApi<Order[]>('/orders');
}

export async function getOrderById(id: number): Promise<Order> {
  return fetchApi<Order>(`/orders/${id}`);
}

export async function updateOrderStatus(id: number, data: UpdateOrderStatusDto): Promise<Order> {
  return fetchApi<Order>(`/orders/${id}/status`, {
    method: 'PUT',
    data,
  });
}

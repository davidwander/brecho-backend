export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  clientId: string;
  userId: string;
  total: number;
  status: string;
  paymentType?: string;
  createdAt: Date;
  updatedAt: Date;
  products: SaleProduct[];
  delivery?: Delivery;
}

export interface SaleProduct {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Delivery {
  id: string;
  saleId: string;
  status: string;
  address: string;
  date?: Date;
  createdAt: Date;
  updatedAt: Date;
  sale: Sale;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  sales: Sale[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  sales: Sale[];
} 
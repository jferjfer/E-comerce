export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  size?: string[];
  color?: string[];
  rating: number;
  inStock: boolean;
  isEco?: boolean;
  compatibility?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: {
    style: string;
    colors: string[];
    size: string;
  };
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'credit' | 'external';
  description: string;
  icon: string;
  maxAmount?: number;
  interestRate?: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: Date;
}
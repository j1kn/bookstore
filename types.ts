
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export type SubscriptionType = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionType;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  amountPaid: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  category: string;
  description: string;
  coverImage: string;
  rating: number;
  stock: number;
  isBestseller?: boolean;
  isPremiumOnly?: boolean;      // locked for non-premium users
  premiumDiscount?: number;     // e.g. 0.10 = 10% off for premium users
  pdfUrl?: string;              // URL or local identifier of the PDF file
}

export interface CartItem extends Book {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  // Premium fields
  isPremium?: boolean;
  subscriptionType?: SubscriptionType;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

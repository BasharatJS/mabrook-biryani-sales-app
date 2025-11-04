import { Timestamp } from 'firebase/firestore';

export interface Order {
  id?: string;
  biryaniQuantity: number;
  totalAmount: number;
  discount?: number; // Discount percentage (0-100)
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderDate: Timestamp;
  notes?: string;
  orderItems: OrderItem[];
  paymentMode?: 'UPI' | 'Cash';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Expense {
  id?: string;
  category: 'ingredients' | 'fuel' | 'packaging' | 'utilities' | 'labor' | 'rent' | 'other';
  description: string;
  amount: number;
  date: Timestamp;
  receipt?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Settings {
  id?: string;
  pricePerPlate: number;
  taxRate: number;
  deliveryCharge: number;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  currency: string;
  workingHours: {
    open: string;
    close: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DailySummary {
  id?: string;
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  createdAt: Timestamp;
}

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  category: 'mutton' | 'chicken' | 'egg' | 'veg' | 'extras' | 'beverages';
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface OrderItem {
  menuItemId: string | number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderFormData {
  biryaniQuantity: number;
  orderItems: OrderItem[];
  notes?: string;
}

export interface ExpenseFormData {
  category: Expense['category'];
  description: string;
  amount: number;
  date: Date;
}

export interface MenuItemFormData {
  name: string;
  price: number;
  category: MenuItem['category'];
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}
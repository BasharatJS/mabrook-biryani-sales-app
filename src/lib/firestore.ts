import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  getCountFromServer,
  getAggregateFromServer,
  sum,
  count,
} from 'firebase/firestore';
import { db } from './firebase';
import { Order, Expense, Settings, DailySummary, OrderFormData, ExpenseFormData, MenuItem, MenuItemFormData } from './types';

// ========================================
// DIAGNOSTIC LOGGING FOR FIRESTORE READS
// ========================================
let totalReadsThisSession = 0;
const readLog: Array<{ timestamp: string; operation: string; collection: string; count: number; source: string }> = [];

function logFirestoreRead(operation: string, collection: string, count: number, source: string = 'unknown') {
  totalReadsThisSession += count;
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    collection,
    count,
    source
  };
  readLog.push(logEntry);

  console.log(`🔥 FIRESTORE READ [${totalReadsThisSession} total]:`, {
    operation,
    collection,
    reads: count,
    source,
    time: new Date().toLocaleTimeString()
  });
}

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).getFirestoreReadLog = () => ({
    total: totalReadsThisSession,
    log: readLog,
    byCollection: readLog.reduce((acc, entry) => {
      acc[entry.collection] = (acc[entry.collection] || 0) + entry.count;
      return acc;
    }, {} as Record<string, number>),
    bySource: readLog.reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + entry.count;
      return acc;
    }, {} as Record<string, number>)
  });
  console.log('📊 Firestore diagnostics enabled. Run window.getFirestoreReadLog() to see stats');
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  upiOrders: number;
  upiRevenue: number;
  cashOrders: number;
  cashRevenue: number;
}

export const collections = {
  orders: 'orders',
  expenses: 'expenses',
  settings: 'settings',
  dailySummaries: 'daily_summaries',
  menuItems: 'menu_items',
} as const;

export class OrderService {
  // Create new order for manager dashboard
  static async createOrder(orderData: OrderFormData): Promise<any> {
    const totalAmount = orderData.orderItems.reduce((sum, item) => sum + item.total, 0);

    const order: any = {
      biryaniQuantity: orderData.biryaniQuantity,
      totalAmount,
      orderItems: orderData.orderItems,
      status: 'pending',
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      notes: orderData.notes,
      paymentMode: orderData.paymentMode,
      ...(orderData.discount && orderData.discount > 0 && { discount: orderData.discount }),
    };

    const docRef = await addDoc(collection(db, collections.orders), order);

    return {
      id: docRef.id,
      ...order
    };
  }

  // Create order from customer portal (public orders)
  static async createCustomerOrder(orderData: any): Promise<any> {
    const totalAmount = orderData.orderItems.reduce((sum: number, item: any) => sum + item.total, 0);

    const order: any = {
      biryaniQuantity: orderData.biryaniQuantity,
      totalAmount,
      orderItems: orderData.orderItems,
      status: 'pending',
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      notes: orderData.notes,
      paymentMode: orderData.paymentMode,
      orderType: 'online', // Mark as online order
      ...(orderData.customerName && { customerName: orderData.customerName }),
      ...(orderData.customerPhone && { customerPhone: orderData.customerPhone }),
      ...(orderData.discount && orderData.discount > 0 && { discount: orderData.discount }),
    };

    const docRef = await addDoc(collection(db, collections.orders), order);

    return {
      id: docRef.id,
      ...order
    };
  }

  // Create order from staff dashboard with customer details
  static async createStaffOrder(orderData: any): Promise<any> {
    const totalAmount = orderData.orderItems.reduce((sum: number, item: any) => sum + item.total, 0);

    const order: any = {
      biryaniQuantity: orderData.biryaniQuantity,
      totalAmount,
      orderItems: orderData.orderItems,
      status: 'pending',
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      notes: orderData.notes,
      paymentMode: orderData.paymentMode,
      ...(orderData.customerName && { customerName: orderData.customerName }),
      ...(orderData.customerPhone && { customerPhone: orderData.customerPhone }),
      ...(orderData.orderType && { orderType: orderData.orderType }),
      ...(orderData.discount && orderData.discount > 0 && { discount: orderData.discount }),
    };

    const docRef = await addDoc(collection(db, collections.orders), order);

    return {
      id: docRef.id,
      ...order
    };
  }

  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderRef = doc(db, collections.orders, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  }

  // Update complete order (for editing)
  static async updateOrder(orderId: string, orderData: Partial<Order>): Promise<void> {
    const orderRef = doc(db, collections.orders, orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: Timestamp.now(),
    });
  }

  // Delete order
  static async deleteOrder(orderId: string): Promise<void> {
    const orderRef = doc(db, collections.orders, orderId);
    await deleteDoc(orderRef);
  }

  static async getTodayOrders(): Promise<Order[]> {
    const today = new Date();
    const startOfToday = Timestamp.fromDate(new Date(today.setHours(0, 0, 0, 0)));
    const endOfToday = Timestamp.fromDate(new Date(today.setHours(23, 59, 59, 999)));

    const q = query(
      collection(db, collections.orders),
      where('orderDate', '>=', startOfToday),
      where('orderDate', '<=', endOfToday),
      orderBy('orderDate', 'desc')
    );

    const snapshot = await getDocs(q);
    const count = snapshot.docs.length;
    logFirestoreRead('getTodayOrders', 'orders', count, 'OrderService.getTodayOrders');

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  }

  static async getAllOrders(limitCount = 200): Promise<Order[]> {
    const q = query(
      collection(db, collections.orders),
      orderBy('orderDate', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const count = snapshot.docs.length;
    logFirestoreRead('getAllOrders', 'orders', count, `OrderService.getAllOrders(limit=${limitCount})`);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  }

  // Paginated orders fetch - returns data with cursor for next page
  static async getOrdersPaginated(
    limitCount = 200,
    lastDocument?: QueryDocumentSnapshot
  ): Promise<PaginatedResult<Order>> {
    let q = query(
      collection(db, collections.orders),
      orderBy('orderDate', 'desc'),
      limit(limitCount)
    );

    // If we have a last document, start after it
    if (lastDocument) {
      q = query(
        collection(db, collections.orders),
        orderBy('orderDate', 'desc'),
        startAfter(lastDocument),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const count = snapshot.docs.length;
    logFirestoreRead('getOrdersPaginated', 'orders', count, `OrderService.getOrdersPaginated(limit=${limitCount}, hasLastDoc=${!!lastDocument})`);

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));

    return {
      data: orders,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount,
    };
  }

  // Fetch ALL orders in batches (for exports or full data needs)
  static async getAllOrdersInBatches(batchSize = 200): Promise<Order[]> {
    let allOrders: Order[] = [];
    let lastDoc: QueryDocumentSnapshot | null = null;
    let hasMore = true;

    while (hasMore) {
      const result = await this.getOrdersPaginated(batchSize, lastDoc || undefined);
      allOrders = [...allOrders, ...result.data];
      lastDoc = result.lastDoc;
      hasMore = result.hasMore;
    }

    return allOrders;
  }

  // Get orders by date range with pagination
  static async getOrdersByDateRangePaginated(
    startDate: Date,
    endDate: Date,
    limitCount = 200,
    lastDocument?: QueryDocumentSnapshot
  ): Promise<PaginatedResult<Order>> {
    let q = query(
      collection(db, collections.orders),
      where('orderDate', '>=', Timestamp.fromDate(startDate)),
      where('orderDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('orderDate', 'desc'),
      limit(limitCount)
    );

    if (lastDocument) {
      q = query(
        collection(db, collections.orders),
        where('orderDate', '>=', Timestamp.fromDate(startDate)),
        where('orderDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('orderDate', 'desc'),
        startAfter(lastDocument),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));

    return {
      data: orders,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limitCount,
    };
  }

  // Get order statistics using Firestore aggregation (efficient, no document reads)
  static async getOrderStatsAggregated(
    startDate?: Date,
    endDate?: Date
  ): Promise<OrderStats> {
    try {
      // If no date range, use efficient aggregation with fallback
      if (!startDate || !endDate) {
        try {
          const baseQuery = collection(db, collections.orders);

          // Try aggregation queries - may fail if quota exceeded or index missing
          // Exclude cancelled orders from all queries
          const allOrdersQuery = query(baseQuery, where('status', '!=', 'cancelled'));
          const allAggregation = await getAggregateFromServer(allOrdersQuery, {
            totalOrders: count(),
            totalRevenue: sum('totalAmount')
          });
          logFirestoreRead('aggregation', 'orders', 1, 'OrderService.getOrderStatsAggregated (all orders)');

          const upiQuery = query(baseQuery, where('status', '!=', 'cancelled'), where('paymentMode', '==', 'UPI'));
          const upiAggregation = await getAggregateFromServer(upiQuery, {
            upiOrders: count(),
            upiRevenue: sum('totalAmount')
          });
          logFirestoreRead('aggregation', 'orders', 1, 'OrderService.getOrderStatsAggregated (UPI)');

          const cashQuery = query(baseQuery, where('status', '!=', 'cancelled'), where('paymentMode', '==', 'Cash'));
          const cashAggregation = await getAggregateFromServer(cashQuery, {
            cashOrders: count(),
            cashRevenue: sum('totalAmount')
          });
          logFirestoreRead('aggregation', 'orders', 1, 'OrderService.getOrderStatsAggregated (Cash)');

          return {
            totalOrders: allAggregation.data().totalOrders || 0,
            totalRevenue: allAggregation.data().totalRevenue || 0,
            upiOrders: upiAggregation.data().upiOrders || 0,
            upiRevenue: upiAggregation.data().upiRevenue || 0,
            cashOrders: cashAggregation.data().cashOrders || 0,
            cashRevenue: cashAggregation.data().cashRevenue || 0,
          };
        } catch (aggregationError) {
          console.warn('Aggregation failed, falling back to document fetch:', aggregationError);
          // Fallback: fetch limited documents and calculate
          const limitedQuery = query(collection(db, collections.orders), orderBy('orderDate', 'desc'), limit(500));
          const snapshot = await getDocs(limitedQuery);
          const orders = snapshot.docs.map(doc => doc.data() as Order);

          const validOrders = orders.filter(order => order.status !== 'cancelled');
          const totalOrders = validOrders.length;
          const totalRevenue = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

          const upiOrders = validOrders.filter(order => order.paymentMode === 'UPI');
          const upiOrdersCount = upiOrders.length;
          const upiRevenue = upiOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

          const cashOrders = validOrders.filter(order => order.paymentMode === 'Cash');
          const cashOrdersCount = cashOrders.length;
          const cashRevenue = cashOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

          return {
            totalOrders,
            totalRevenue,
            upiOrders: upiOrdersCount,
            upiRevenue,
            cashOrders: cashOrdersCount,
            cashRevenue,
          };
        }
      }

      // OPTIMIZATION: Use aggregation queries for date ranges too!
      try {
        const baseQuery = query(
          collection(db, collections.orders),
          where('orderDate', '>=', Timestamp.fromDate(startDate)),
          where('orderDate', '<=', Timestamp.fromDate(endDate)),
          where('status', '!=', 'cancelled')
        );

        // Use aggregation queries - much more efficient than fetching all documents
        const allAggregation = await getAggregateFromServer(baseQuery, {
          totalOrders: count(),
          totalRevenue: sum('totalAmount')
        });

        const upiQuery = query(
          collection(db, collections.orders),
          where('orderDate', '>=', Timestamp.fromDate(startDate)),
          where('orderDate', '<=', Timestamp.fromDate(endDate)),
          where('status', '!=', 'cancelled'),
          where('paymentMode', '==', 'UPI')
        );
        const upiAggregation = await getAggregateFromServer(upiQuery, {
          upiOrders: count(),
          upiRevenue: sum('totalAmount')
        });

        const cashQuery = query(
          collection(db, collections.orders),
          where('orderDate', '>=', Timestamp.fromDate(startDate)),
          where('orderDate', '<=', Timestamp.fromDate(endDate)),
          where('status', '!=', 'cancelled'),
          where('paymentMode', '==', 'Cash')
        );
        const cashAggregation = await getAggregateFromServer(cashQuery, {
          cashOrders: count(),
          cashRevenue: sum('totalAmount')
        });

        return {
          totalOrders: allAggregation.data().totalOrders || 0,
          totalRevenue: allAggregation.data().totalRevenue || 0,
          upiOrders: upiAggregation.data().upiOrders || 0,
          upiRevenue: upiAggregation.data().upiRevenue || 0,
          cashOrders: cashAggregation.data().cashOrders || 0,
          cashRevenue: cashAggregation.data().cashRevenue || 0,
        };
      } catch (aggregationError) {
        console.warn('Date range aggregation failed, falling back to document fetch:', aggregationError);

        // Fallback: fetch documents and calculate (only if aggregation fails)
        const q = query(
          collection(db, collections.orders),
          where('orderDate', '>=', Timestamp.fromDate(startDate)),
          where('orderDate', '<=', Timestamp.fromDate(endDate)),
          orderBy('orderDate', 'desc')
        );

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => doc.data() as Order);

        // Filter out cancelled orders and calculate stats
        const validOrders = orders.filter(order => order.status !== 'cancelled');

        const totalOrders = validOrders.length;
        const totalRevenue = validOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        const upiOrders = validOrders.filter(order => order.paymentMode === 'UPI');
        const upiOrdersCount = upiOrders.length;
        const upiRevenue = upiOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        const cashOrders = validOrders.filter(order => order.paymentMode === 'Cash');
        const cashOrdersCount = cashOrders.length;
        const cashRevenue = cashOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        return {
          totalOrders,
          totalRevenue,
          upiOrders: upiOrdersCount,
          upiRevenue,
          cashOrders: cashOrdersCount,
          cashRevenue,
        };
      }
    } catch (error) {
      console.error('Error getting order stats:', error);
      // Fallback to zeros if aggregation fails
      return {
        totalOrders: 0,
        totalRevenue: 0,
        upiOrders: 0,
        upiRevenue: 0,
        cashOrders: 0,
        cashRevenue: 0,
      };
    }
  }

  // Get count only (even more efficient - single read)
  static async getOrderCount(
    startDate?: Date,
    endDate?: Date,
    paymentMode?: 'UPI' | 'Cash'
  ): Promise<number> {
    try {
      let q = query(
        collection(db, collections.orders),
        where('status', '!=', 'cancelled')
      );

      if (startDate && endDate) {
        q = query(
          collection(db, collections.orders),
          where('orderDate', '>=', Timestamp.fromDate(startDate)),
          where('orderDate', '<=', Timestamp.fromDate(endDate)),
          where('status', '!=', 'cancelled')
        );
      }

      if (paymentMode) {
        q = query(q, where('paymentMode', '==', paymentMode));
      }

      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting order count:', error);
      return 0;
    }
  }
}

export class ExpenseService {
  // Add new business expense
  static async createExpense(expenseData: ExpenseFormData): Promise<string> {
    const expense: Omit<Expense, 'id'> = {
      ...expenseData,
      date: Timestamp.fromDate(expenseData.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, collections.expenses), expense);
    return docRef.id;
  }

  // Get today's expenses only
  static async getTodayExpenses(): Promise<Expense[]> {
    const today = new Date();
    const startOfToday = Timestamp.fromDate(new Date(today.setHours(0, 0, 0, 0)));
    const endOfToday = Timestamp.fromDate(new Date(today.setHours(23, 59, 59, 999)));

    const q = query(
      collection(db, collections.expenses),
      where('date', '>=', startOfToday),
      where('date', '<=', endOfToday),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
  }

  static async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    const q = query(
      collection(db, collections.expenses),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    const count = snapshot.docs.length;
    logFirestoreRead('getExpensesByDateRange', 'expenses', count, `ExpenseService.getExpensesByDateRange(${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    await deleteDoc(doc(db, collections.expenses, expenseId));
  }
}

export class SettingsService {
  // Get business settings configuration
  static async getSettings(): Promise<Settings | null> {
    // Use limit(1) to fetch only the first settings document
    const q = query(collection(db, collections.settings), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const settingsDoc = snapshot.docs[0];
    return {
      id: settingsDoc.id,
      ...settingsDoc.data()
    } as Settings;
  }

  static async updateSettings(settings: Partial<Omit<Settings, 'id' | 'createdAt'>>): Promise<void> {
    const existingSettings = await this.getSettings();
    
    if (existingSettings?.id) {
      const settingsRef = doc(db, collections.settings, existingSettings.id);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.now(),
      });
    } else {
      const newSettings: Omit<Settings, 'id'> = {
        pricePerPlate: 150,
        taxRate: 0,
        deliveryCharge: 0,
        businessName: 'Biryani House',
        businessPhone: '',
        businessAddress: '',
        currency: '₹',
        workingHours: {
          open: '10:00',
          close: '22:00',
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...settings,
      };
      
      await addDoc(collection(db, collections.settings), newSettings);
    }
  }
}

export class UserService {
  // Check if email exists in pre-authorized users database
  static async checkEmailExists(email: string): Promise<{ exists: boolean; userData?: any }> {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { exists: false };
    }

    const userDoc = snapshot.docs[0];
    return { 
      exists: true, 
      userData: { 
        id: userDoc.id, 
        ...userDoc.data() 
      } 
    };
  }
}

export class DashboardService {
  // Get pre-calculated daily profit/loss summary
  static async getDailySummary(date: Date): Promise<DailySummary | null> {
    const dateStr = date.toISOString().split('T')[0];
    const q = query(
      collection(db, collections.dailySummaries),
      where('date', '==', dateStr)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as DailySummary;
  }

  static async calculateAndStoreDailySummary(date: Date): Promise<DailySummary> {
    const dateStr = date.toISOString().split('T')[0];
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const ordersQuery = query(
      collection(db, collections.orders),
      where('orderDate', '>=', Timestamp.fromDate(startOfDay)),
      where('orderDate', '<=', Timestamp.fromDate(endOfDay))
    );

    const expensesQuery = query(
      collection(db, collections.expenses),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );

    const [ordersSnapshot, expensesSnapshot] = await Promise.all([
      getDocs(ordersQuery),
      getDocs(expensesQuery)
    ]);

    const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);
    const expenses = expensesSnapshot.docs.map(doc => doc.data() as Expense);

    const totalRevenue = orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const summary: Omit<DailySummary, 'id'> = {
      date: dateStr,
      totalOrders: orders.filter(order => order.status !== 'cancelled').length,
      totalRevenue,
      totalExpenses,
      netProfit,
      createdAt: Timestamp.now(),
    };

    const existingSummary = await this.getDailySummary(date);
    if (existingSummary?.id) {
      const summaryRef = doc(db, collections.dailySummaries, existingSummary.id);
      await updateDoc(summaryRef, summary);
      return { id: existingSummary.id, ...summary };
    } else {
      const docRef = await addDoc(collection(db, collections.dailySummaries), summary);
      return { id: docRef.id, ...summary };
    }
  }
}

export class MenuItemService {
  // Create new menu item
  static async createMenuItem(itemData: MenuItemFormData): Promise<string> {
    const menuItem: Omit<MenuItem, 'id'> = {
      ...itemData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: itemData.isActive ?? true,
    };

    const docRef = await addDoc(collection(db, collections.menuItems), menuItem);
    return docRef.id;
  }

  // Update existing menu item
  static async updateMenuItem(itemId: string, itemData: Partial<MenuItemFormData>): Promise<void> {
    const itemRef = doc(db, collections.menuItems, itemId);
    await updateDoc(itemRef, {
      ...itemData,
      updatedAt: Timestamp.now(),
    });
  }

  // Get all menu items with custom category order
  static async getAllMenuItems(): Promise<MenuItem[]> {
    const snapshot = await getDocs(collection(db, collections.menuItems));
    const count = snapshot.docs.length;
    logFirestoreRead('getAllMenuItems', 'menu_items', count, 'MenuItemService.getAllMenuItems');

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem));
    
    // Define custom category order: Mutton → Chicken → Egg → Veg → Extras → Beverages
    const categoryOrder = {
      'mutton': 1,
      'chicken': 2,
      'egg': 3,
      'veg': 4,
      'extras': 5,
      'beverages': 6
    };
    
    // Sort with custom order
    return items.sort((a, b) => {
      const categoryA = categoryOrder[a.category as keyof typeof categoryOrder] || 999;
      const categoryB = categoryOrder[b.category as keyof typeof categoryOrder] || 999;
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      return a.name.localeCompare(b.name);
    });
  }

  // Get active menu items only with custom category order
  static async getActiveMenuItems(): Promise<MenuItem[]> {
    const snapshot = await getDocs(collection(db, collections.menuItems));
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem))
    .filter(item => item.isActive !== false); // Include items without isActive field
    
    // Define custom category order: Mutton → Chicken → Egg → Veg → Extras → Beverages
    const categoryOrder = {
      'mutton': 1,
      'chicken': 2,
      'egg': 3,
      'veg': 4,
      'extras': 5,
      'beverages': 6
    };
    
    // Sort with custom order
    return items.sort((a, b) => {
      const categoryA = categoryOrder[a.category as keyof typeof categoryOrder] || 999;
      const categoryB = categoryOrder[b.category as keyof typeof categoryOrder] || 999;
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      return a.name.localeCompare(b.name);
    });
  }

  // Get menu items by category
  static async getMenuItemsByCategory(category: MenuItem['category']): Promise<MenuItem[]> {
    const q = query(
      collection(db, collections.menuItems),
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem));
  }

  // Delete menu item
  static async deleteMenuItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, collections.menuItems, itemId));
  }

  // Deactivate menu item (soft delete)
  static async deactivateMenuItem(itemId: string): Promise<void> {
    const itemRef = doc(db, collections.menuItems, itemId);
    await updateDoc(itemRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  }

  // Activate menu item
  static async activateMenuItem(itemId: string): Promise<void> {
    const itemRef = doc(db, collections.menuItems, itemId);
    await updateDoc(itemRef, {
      isActive: true,
      updatedAt: Timestamp.now(),
    });
  }
}
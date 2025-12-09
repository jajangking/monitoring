import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for local storage
const ORDER_STORAGE_KEY = '@orders';
const FUEL_EXPENSE_STORAGE_KEY = '@fuel_expenses';
const OIL_CHANGE_STORAGE_KEY = '@oil_changes';
const DAILY_MILEAGE_STORAGE_KEY = '@daily_mileage';
const SPAREPART_STORAGE_KEY = '@spareparts';

// Define TypeScript interfaces (same as before)
export interface Order {
  id: string;
  amount: number; // in rupiah
  date: string; // ISO string format
  description?: string;
  quantity?: number; // for multiple fixed-price items
  orderType?: 'Regular' | 'Paket'; // Type of order - Regular or Paket
  pricePerItem?: number; // for fixed price items (application-facing)
  // Supabase returns snake_case columns
  price_per_item?: number; // for database operations
  order_type?: 'Regular' | 'Paket'; // snake_case for database operations
  created_at?: string; // timestamp for accurate sorting
  updated_at?: string; // timestamp for tracking updates
}

export interface FuelExpense {
  id: string;
  amount: number; // in rupiah
  date: string; // ISO string format
  liters?: number;
  description?: string;
  created_at?: string; // timestamp for accurate sorting
  updated_at?: string; // timestamp for tracking updates
}

export interface OilChange {
  id: string;
  amount: number; // in rupiah
  date: string; // ISO string format
  mileage?: number; // in kilometers
  description?: string;
  created_at?: string; // timestamp for accurate sorting
  updated_at?: string; // timestamp for tracking updates
}

export interface DailyMileage {
  id: string;
  date: string; // ISO string format
  mileage: number; // mileage in kilometers
  note?: string; // optional note
  created_by?: string; // user ID (nullable for backward compatibility)
  created_at?: string; // timestamp for accurate sorting
  updated_at?: string; // timestamp for tracking updates
}

export interface Sparepart {
  id: string;
  name: string;       // Nama sparepart
  mileageInstalled: number; // Kilometer saat sparepart dipasang
  estimatedMileage: number; // Estimasi kilometer sebelum penggantian
  mileageReplaced?: number; // Kilometer saat diganti (jika sudah diganti)
  dateInstalled: string;    // Tanggal pemasangan
  dateReplaced?: string;    // Tanggal penggantian (jika sudah diganti)
  note?: string;            // Catatan tambahan
  status: 'active' | 'replaced'; // Status sparepart
  created_at?: string; // timestamp for accurate sorting
  updated_at?: string; // timestamp for tracking updates
}

export class DataModelSupabase {
  // Orders
  static async getOrders(): Promise<Order[]> {
    const supabaseOrders: Order[] = [];
    const localOrders: Order[] = [];

    // Get data from Supabase if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false }); // Use created_at for accurate sorting

        if (error) {
          console.error('Error fetching orders from Supabase:', error);
        } else {
          // Convert snake_case column names back to camelCase for TypeScript interface
          const orders: Order[] = data.map(row => ({
            ...row,
            pricePerItem: row.price_per_item,  // Map snake_case to camelCase
            orderType: row.order_type,  // Map snake_case to camelCase
          }));

          // Remove the snake_case properties to maintain clean interface
          const cleanOrders = orders.map(({ price_per_item, order_type, ...order }) => order as Order);
          supabaseOrders.push(...cleanOrders);
        }
      } catch (error) {
        console.error('Unexpected error fetching orders from Supabase:', error);
      }
    }

    // Get data from local storage
    try {
      const localData = await DataModel.getLocalOrders();
      localOrders.push(...localData);
    } catch (error) {
      console.error('Error fetching orders from local storage:', error);
    }

    // Combine both arrays, removing duplicates (prioritizing Supabase data)
    const allOrdersMap = new Map<string, Order>();

    // Add local orders first
    localOrders.forEach(order => {
      allOrdersMap.set(order.id, order);
    });

    // Add/update with Supabase orders (these take priority)
    supabaseOrders.forEach(order => {
      allOrdersMap.set(order.id, order);
    });

    const allOrders = Array.from(allOrdersMap.values());

    // Sort by created_at descending (newest first), fallback to date if needed
    allOrders.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
      const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
      return timeB - timeA; // newest first
    });

    return allOrders;
  }

  static async addOrder(order: Omit<Order, 'id'>): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      console.warn('Supabase not available, saving to local storage');
      return await DataModel.addLocalOrder(order);
    }

    // Ensure date is set to today if not provided
    const orderWithDate = {
      ...order,
      date: order.date || new Date().toISOString().split('T')[0]
    };

    try {
      // Add to Supabase - map camelCase properties to snake_case columns
      const orderForDb = {
        ...orderWithDate,
        price_per_item: orderWithDate.pricePerItem,  // Map camelCase to snake_case
        order_type: orderWithDate.orderType,  // Map camelCase to snake_case
      };
      // Remove the original camelCase properties to avoid conflicts
      if (orderForDb.pricePerItem !== undefined) {
        delete (orderForDb as any).pricePerItem;
      }
      if (orderForDb.orderType !== undefined) {
        delete (orderForDb as any).orderType;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([orderForDb])
        .select();

      if (error) {
        console.error('Error adding order to Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.addLocalOrder(orderWithDate);
      }

      console.log('Order saved to Supabase successfully');

      // Also save to local storage to maintain consistency
      // We'll create a local version with the returned Supabase ID
      if (data && data.length > 0) {
        const supabaseOrder: Order = {
          ...orderWithDate,
          id: data[0].id,
          pricePerItem: data[0].price_per_item
        };
        await DataModel.addLocalOrderWithId(supabaseOrder);
      }
    } catch (error) {
      console.error('Unexpected error adding order:', error);
      // Fallback to AsyncStorage
      return await DataModel.addLocalOrder(orderWithDate);
    }
  }

  static async updateOrder(order: Order): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.updateLocalOrder(order);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't update it from Supabase
      // Only attempt update if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('orders')
          .update({
            amount: order.amount,
            date: order.date,
            description: order.description,
            quantity: order.quantity,
            price_per_item: order.pricePerItem,  // Map camelCase to snake_case
            order_type: order.orderType  // Map camelCase to snake_case
          })
          .eq('id', order.id);

        if (error) {
          console.error('Error updating order in Supabase:', error);
          // If it's a UUID but update failed, still try local update
          await DataModel.updateLocalOrder(order);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase update and only update in local storage
        console.log(`Skipping Supabase update for non-UUID ID: ${order.id}`);
      }

      // Always update in local storage
      await DataModel.updateLocalOrder(order);
    } catch (error) {
      console.error('Unexpected error updating order:', error);
      // Fallback to AsyncStorage
      await DataModel.updateLocalOrder(order);
    }
  }

  static async deleteOrder(orderId: string): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.deleteLocalOrder(orderId);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't delete it from Supabase
      // Only attempt deletion if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) {
          console.error('Error deleting order from Supabase:', error);
          // If it's a UUID but deletion failed, still try local deletion
          await DataModel.deleteLocalOrder(orderId);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase deletion and only delete from local storage
        console.log(`Skipping Supabase deletion for non-UUID ID: ${orderId}`);
      }

      // Always delete from local storage
      await DataModel.deleteLocalOrder(orderId);
    } catch (error) {
      console.error('Unexpected error deleting order:', error);
      // Fallback to AsyncStorage
      await DataModel.deleteLocalOrder(orderId);
    }
  }

  // Fuel Expenses
  static async getFuelExpenses(): Promise<FuelExpense[]> {
    const supabaseExpenses: FuelExpense[] = [];
    const localExpenses: FuelExpense[] = [];

    // Get data from Supabase if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('fuel_expenses')
          .select('*')
          .order('created_at', { ascending: false }); // Use created_at for accurate sorting

        if (error) {
          console.error('Error fetching fuel expenses from Supabase:', error);
        } else {
          supabaseExpenses.push(...(data as FuelExpense[]));
        }
      } catch (error) {
        console.error('Unexpected error fetching fuel expenses from Supabase:', error);
      }
    }

    // Get data from local storage
    try {
      const localData = await DataModel.getLocalFuelExpenses();
      localExpenses.push(...localData);
    } catch (error) {
      console.error('Error fetching fuel expenses from local storage:', error);
    }

    // Combine both arrays, removing duplicates (prioritizing Supabase data)
    const allExpensesMap = new Map<string, FuelExpense>();

    // Add local expenses first
    localExpenses.forEach(expense => {
      allExpensesMap.set(expense.id, expense);
    });

    // Add/update with Supabase expenses (these take priority)
    supabaseExpenses.forEach(expense => {
      allExpensesMap.set(expense.id, expense);
    });

    const allExpenses = Array.from(allExpensesMap.values());

    // Sort by created_at descending (newest first), fallback to date if needed
    allExpenses.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
      const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
      return timeB - timeA; // newest first
    });

    return allExpenses;
  }

  static async addFuelExpense(expense: Omit<FuelExpense, 'id'>): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      console.warn('Supabase not available, saving to local storage');
      return await DataModel.addLocalFuelExpense(expense);
    }

    // Ensure date is set to today if not provided
    const expenseWithDate = {
      ...expense,
      date: expense.date || new Date().toISOString().split('T')[0]
    };

    try {
      const { data, error } = await supabase
        .from('fuel_expenses')
        .insert([expenseWithDate])
        .select();

      if (error) {
        console.error('Error adding fuel expense to Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.addLocalFuelExpense(expenseWithDate);
      }

      console.log('Fuel expense saved to Supabase successfully');

      // Also save to local storage to maintain consistency
      // We'll create a local version with the returned Supabase ID
      if (data && data.length > 0) {
        const supabaseExpense: FuelExpense = {
          ...expenseWithDate,
          id: data[0].id
        };
        await DataModel.addLocalFuelExpenseWithId(supabaseExpense);
      }
    } catch (error) {
      console.error('Unexpected error adding fuel expense:', error);
      // Fallback to AsyncStorage
      return await DataModel.addLocalFuelExpense(expenseWithDate);
    }
  }

  static async updateFuelExpense(expense: FuelExpense): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.updateLocalFuelExpense(expense);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't update it from Supabase
      // Only attempt update if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(expense.id);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('fuel_expenses')
          .update({
            amount: expense.amount,
            date: expense.date,
            description: expense.description,
            liters: expense.liters
          })
          .eq('id', expense.id);

        if (error) {
          console.error('Error updating fuel expense in Supabase:', error);
          // If it's a UUID but update failed, still try local update
          await DataModel.updateLocalFuelExpense(expense);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase update and only update in local storage
        console.log(`Skipping Supabase update for non-UUID ID: ${expense.id}`);
      }

      // Always update in local storage
      await DataModel.updateLocalFuelExpense(expense);
    } catch (error) {
      console.error('Unexpected error updating fuel expense:', error);
      // Fallback to AsyncStorage
      await DataModel.updateLocalFuelExpense(expense);
    }
  }

  static async deleteFuelExpense(expenseId: string): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.deleteLocalFuelExpense(expenseId);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't delete it from Supabase
      // Only attempt deletion if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(expenseId);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('fuel_expenses')
          .delete()
          .eq('id', expenseId);

        if (error) {
          console.error('Error deleting fuel expense from Supabase:', error);
          // If it's a UUID but deletion failed, still try local deletion
          await DataModel.deleteLocalFuelExpense(expenseId);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase deletion and only delete from local storage
        console.log(`Skipping Supabase deletion for non-UUID ID: ${expenseId}`);
      }

      // Always delete from local storage
      await DataModel.deleteLocalFuelExpense(expenseId);
    } catch (error) {
      console.error('Unexpected error deleting fuel expense:', error);
      // Fallback to AsyncStorage
      await DataModel.deleteLocalFuelExpense(expenseId);
    }
  }

  // Oil Changes
  static async getOilChanges(): Promise<OilChange[]> {
    const supabaseChanges: OilChange[] = [];
    const localChanges: OilChange[] = [];

    // Get data from Supabase if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('oil_changes')
          .select('*')
          .order('created_at', { ascending: false }); // Use created_at for accurate sorting

        if (error) {
          console.error('Error fetching oil changes from Supabase:', error);
        } else {
          supabaseChanges.push(...(data as OilChange[]));
        }
      } catch (error) {
        console.error('Unexpected error fetching oil changes from Supabase:', error);
      }
    }

    // Get data from local storage
    try {
      const localData = await DataModel.getLocalOilChanges();
      localChanges.push(...localData);
    } catch (error) {
      console.error('Error fetching oil changes from local storage:', error);
    }

    // Combine both arrays, removing duplicates (prioritizing Supabase data)
    const allChangesMap = new Map<string, OilChange>();

    // Add local changes first
    localChanges.forEach(change => {
      allChangesMap.set(change.id, change);
    });

    // Add/update with Supabase changes (these take priority)
    supabaseChanges.forEach(change => {
      allChangesMap.set(change.id, change);
    });

    const allChanges = Array.from(allChangesMap.values());

    // Sort by created_at descending (newest first), fallback to date if needed
    allChanges.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
      const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
      return timeB - timeA; // newest first
    });

    return allChanges;
  }

  static async addOilChange(change: Omit<OilChange, 'id'>): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      console.warn('Supabase not available, saving to local storage');
      return await DataModel.addLocalOilChange(change);
    }

    // Ensure date is set to today if not provided
    const changeWithDate = {
      ...change,
      date: change.date || new Date().toISOString().split('T')[0]
    };

    try {
      const { data, error } = await supabase
        .from('oil_changes')
        .insert([changeWithDate])
        .select();

      if (error) {
        console.error('Error adding oil change to Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.addLocalOilChange(changeWithDate);
      }

      console.log('Oil change saved to Supabase successfully');

      // Also save to local storage to maintain consistency
      // We'll create a local version with the returned Supabase ID
      if (data && data.length > 0) {
        const supabaseChange: OilChange = {
          ...changeWithDate,
          id: data[0].id
        };
        await DataModel.addLocalOilChangeWithId(supabaseChange);
      }
    } catch (error) {
      console.error('Unexpected error adding oil change:', error);
      // Fallback to AsyncStorage
      return await DataModel.addLocalOilChange(changeWithDate);
    }
  }

  static async updateOilChange(change: OilChange): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.updateLocalOilChange(change);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't update it from Supabase
      // Only attempt update if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(change.id);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('oil_changes')
          .update({
            amount: change.amount,
            date: change.date,
            description: change.description,
            mileage: change.mileage
          })
          .eq('id', change.id);

        if (error) {
          console.error('Error updating oil change in Supabase:', error);
          // If it's a UUID but update failed, still try local update
          await DataModel.updateLocalOilChange(change);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase update and only update in local storage
        console.log(`Skipping Supabase update for non-UUID ID: ${change.id}`);
      }

      // Always update in local storage
      await DataModel.updateLocalOilChange(change);
    } catch (error) {
      console.error('Unexpected error updating oil change:', error);
      // Fallback to AsyncStorage
      await DataModel.updateLocalOilChange(change);
    }
  }

  static async deleteOilChange(changeId: string): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.deleteLocalOilChange(changeId);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't delete it from Supabase
      // Only attempt deletion if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(changeId);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('oil_changes')
          .delete()
          .eq('id', changeId);

        if (error) {
          console.error('Error deleting oil change from Supabase:', error);
          // If it's a UUID but deletion failed, still try local deletion
          await DataModel.deleteLocalOilChange(changeId);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase deletion and only delete from local storage
        console.log(`Skipping Supabase deletion for non-UUID ID: ${changeId}`);
      }

      // Always delete from local storage
      await DataModel.deleteLocalOilChange(changeId);
    } catch (error) {
      console.error('Unexpected error deleting oil change:', error);
      // Fallback to AsyncStorage
      await DataModel.deleteLocalOilChange(changeId);
    }
  }

  // Daily Mileage Records
  static async getDailyMileages(): Promise<DailyMileage[]> {
    const supabaseMileages: DailyMileage[] = [];
    const localMileages: DailyMileage[] = [];

    // Get data from Supabase if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('daily_mileage')
          .select('*')
          .order('date', { ascending: false });

        if (error) {
          console.error('Error fetching daily mileages from Supabase:', error);
        } else {
          supabaseMileages.push(...(data as DailyMileage[]));
        }
      } catch (error) {
        console.error('Unexpected error fetching daily mileages from Supabase:', error);
      }
    }

    // Get data from local storage
    try {
      const localData = await DataModel.getLocalDailyMileages();
      localMileages.push(...localData);
    } catch (error) {
      console.error('Error fetching daily mileages from local storage:', error);
    }

    // Combine both arrays, removing duplicates (prioritizing Supabase data)
    const allMileagesMap = new Map<string, DailyMileage>();

    // Add local mileages first
    localMileages.forEach(mileage => {
      allMileagesMap.set(mileage.id, mileage);
    });

    // Add/update with Supabase mileages (these take priority)
    supabaseMileages.forEach(mileage => {
      allMileagesMap.set(mileage.id, mileage);
    });

    const allMileages = Array.from(allMileagesMap.values());

    // Sort by date descending (newest first) for general use
    allMileages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allMileages;
  }

  static async getDailyMileagesLimited(limit: number): Promise<DailyMileage[]> {
    // Get all data from both sources without using the cached/sorted version
    const supabaseMileages: DailyMileage[] = [];
    const localMileages: DailyMileage[] = [];

    // Get fresh data from Supabase - include created_at for accurate sorting
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('daily_mileage')
          .select('*')
          .order('created_at', { ascending: false }); // Sort by created_at for accurate ordering

        if (error) {
          console.error('Error fetching daily mileages from Supabase:', error);
        } else {
          supabaseMileages.push(...(data as DailyMileage[]));
        }
      } catch (error) {
        console.error('Unexpected error fetching daily mileages from Supabase:', error);
      }
    }

    // Get data from local storage
    try {
      const localData = await DataModel.getLocalDailyMileages();
      localMileages.push(...localData);
    } catch (error) {
      console.error('Error fetching daily mileages from local storage:', error);
    }

    // Combine both arrays, removing duplicates (prioritizing Supabase data)
    const allMileagesMap = new Map<string, DailyMileage>();

    // Add local mileages first
    localMileages.forEach(mileage => {
      allMileagesMap.set(mileage.id, mileage);
    });

    // Add/update with Supabase mileages (these take priority)
    supabaseMileages.forEach(mileage => {
      allMileagesMap.set(mileage.id, mileage);
    });

    let allMileages = Array.from(allMileagesMap.values());

    // Sort all entries from newest to oldest using created_at, fallback to date if needed
    allMileages.sort((a, b) => {
      // Use created_at if available, otherwise use date field
      const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
      const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
      return timeB - timeA; // newest first
    });

    // Take the first 'limit' items (most recent entries)
    const mostRecentMileages = allMileages.slice(0, limit);

    // Sort these selected entries from oldest to newest using created_at, fallback to date if needed
    mostRecentMileages.sort((a, b) => {
      // Use created_at if available, otherwise use date field
      const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
      const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
      return timeA - timeB; // oldest first
    });

    return mostRecentMileages;
  }

  static async addDailyMileage(mileage: Omit<DailyMileage, 'id'>): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      console.warn('Supabase not available, saving to local storage');
      return await DataModel.addLocalDailyMileage(mileage);
    }

    // Ensure date is set to today if not provided
    const mileageWithDate = {
      ...mileage,
      date: mileage.date || new Date().toISOString().split('T')[0]
    };

    try {
      // Supabase will generate the UUID automatically since the column has DEFAULT gen_random_uuid()
      const { data, error } = await supabase
        .from('daily_mileage')
        .insert([mileageWithDate])
        .select();

      if (error) {
        console.error('Error adding daily mileage to Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.addLocalDailyMileage(mileageWithDate);
      }

      console.log('Daily mileage saved to Supabase successfully');

      // Also save to local storage to maintain consistency
      // We'll create a local version with the returned Supabase ID
      if (data && data.length > 0) {
        const supabaseMileage: DailyMileage = {
          ...mileageWithDate,
          id: data[0].id
        };
        await DataModel.addLocalDailyMileageWithId(supabaseMileage);
      }
    } catch (error) {
      console.error('Unexpected error adding daily mileage:', error);
      // Fallback to AsyncStorage
      return await DataModel.addLocalDailyMileage(mileageWithDate);
    }
  }

  static async updateDailyMileage(mileage: DailyMileage): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.updateLocalDailyMileage(mileage);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't update it from Supabase
      // Only attempt update if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mileage.id);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('daily_mileage')
          .update({
            date: mileage.date,
            mileage: mileage.mileage,
            note: mileage.note
          })
          .eq('id', mileage.id);

        if (error) {
          console.error('Error updating daily mileage in Supabase:', error);
          // If it's a UUID but update failed, still try local update
          await DataModel.updateLocalDailyMileage(mileage);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase update and only update in local storage
        console.log(`Skipping Supabase update for non-UUID ID: ${mileage.id}`);
      }

      // Always update in local storage
      await DataModel.updateLocalDailyMileage(mileage);
    } catch (error) {
      console.error('Unexpected error updating daily mileage:', error);
      // Fallback to AsyncStorage
      await DataModel.updateLocalDailyMileage(mileage);
    }
  }

  static async deleteDailyMileage(mileageId: string): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.deleteLocalDailyMileage(mileageId);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't delete it from Supabase
      // Only attempt deletion if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mileageId);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('daily_mileage')
          .delete()
          .eq('id', mileageId);

        if (error) {
          console.error('Error deleting daily mileage from Supabase:', error);
          // If it's a UUID but deletion failed, still try local deletion
          await DataModel.deleteLocalDailyMileage(mileageId);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase deletion and only delete from local storage
        console.log(`Skipping Supabase deletion for non-UUID ID: ${mileageId}`);
      }

      // Always delete from local storage
      await DataModel.deleteLocalDailyMileage(mileageId);
    } catch (error) {
      console.error('Unexpected error deleting daily mileage:', error);
      // Fallback to AsyncStorage
      await DataModel.deleteLocalDailyMileage(mileageId);
    }
  }

  // Sparepart Management
  static async getSpareparts(): Promise<Sparepart[]> {
    const supabaseSpareparts: Sparepart[] = [];
    const localSpareparts: Sparepart[] = [];

    // Get data from Supabase if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('spareparts') // Using a new table name
          .select('*')
          .order('created_at', { ascending: false }); // Use created_at for accurate sorting

        if (error) {
          console.error('Error fetching spareparts from Supabase:', error);
        } else {
          // Convert snake_case column names back to camelCase for TypeScript interface
          const spareparts: Sparepart[] = data.map(row => ({
            ...row,
            name: row.name,
            mileageInstalled: row.mileage_installed,
            estimatedMileage: row.estimated_mileage,
            mileageReplaced: row.mileage_replaced,
            dateInstalled: row.date_installed,
            dateReplaced: row.date_replaced,
            note: row.note,
            status: row.status as 'active' | 'replaced'
          }));

          // Remove the snake_case properties to maintain clean interface
          const cleanSpareparts = spareparts.map(({
            name, mileage_installed, estimated_mileage, mileage_replaced,
            date_installed, date_replaced, note, status, ...sparepart
          }) => ({
            ...sparepart,
            name,
            mileageInstalled: mileage_installed,
            estimatedMileage: estimated_mileage,
            mileageReplaced: mileage_replaced,
            dateInstalled: date_installed,
            dateReplaced: date_replaced,
            note,
            status: status as 'active' | 'replaced'
          }) as Sparepart);

          supabaseSpareparts.push(...cleanSpareparts);
        }
      } catch (error) {
        console.error('Unexpected error fetching spareparts from Supabase:', error);
      }
    }

    // Get data from local storage
    try {
      const localData = await DataModel.getLocalSpareparts();
      localSpareparts.push(...localData);
    } catch (error) {
      console.error('Error fetching spareparts from local storage:', error);
    }

    // Combine both arrays, removing duplicates (prioritizing Supabase data)
    const allSparepartsMap = new Map<string, Sparepart>();

    // Add local spareparts first
    localSpareparts.forEach(sparepart => {
      allSparepartsMap.set(sparepart.id, sparepart);
    });

    // Add/update with Supabase spareparts (these take priority)
    supabaseSpareparts.forEach(sparepart => {
      allSparepartsMap.set(sparepart.id, sparepart);
    });

    const allSpareparts = Array.from(allSparepartsMap.values());

    // Sort by created_at descending (newest first), fallback to dateInstalled if needed
    allSpareparts.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.dateInstalled).getTime();
      const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.dateInstalled).getTime();
      return timeB - timeA; // newest first
    });

    return allSpareparts;
  }

  static async addSparepart(sparepart: Omit<Sparepart, 'id'>): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      console.warn('Supabase not available, saving to local storage');
      return await DataModel.addLocalSparepart(sparepart);
    }

    // Ensure dateInstalled is set to today if not provided
    const sparepartWithDate = {
      ...sparepart,
      dateInstalled: sparepart.dateInstalled || new Date().toISOString().split('T')[0]
    };

    try {
      // Map camelCase properties to snake_case columns
      const sparepartForDb = {
        name: sparepartWithDate.name,
        mileage_installed: sparepartWithDate.mileageInstalled,
        estimated_mileage: sparepartWithDate.estimatedMileage,
        mileage_replaced: sparepartWithDate.mileageReplaced,
        date_installed: sparepartWithDate.dateInstalled,
        date_replaced: sparepartWithDate.dateReplaced,
        note: sparepartWithDate.note,
        status: sparepartWithDate.status
      };

      const { data, error } = await supabase
        .from('spareparts')
        .insert([sparepartForDb])
        .select();

      if (error) {
        console.error('Error adding sparepart to Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.addLocalSparepart(sparepartWithDate);
      }

      console.log('Sparepart saved to Supabase successfully');

      // Also save to local storage to maintain consistency
      // We'll create a local version with the returned Supabase ID
      if (data && data.length > 0) {
        const supabaseSparepart: Sparepart = {
          ...sparepartWithDate,
          id: data[0].id
        };
        await DataModel.addLocalSparepartWithId(supabaseSparepart);
      }
    } catch (error) {
      console.error('Unexpected error adding sparepart:', error);
      // Fallback to AsyncStorage
      return await DataModel.addLocalSparepart(sparepartWithDate);
    }
  }

  static async updateSparepart(sparepart: Sparepart): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.updateLocalSparepart(sparepart);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't update it from Supabase
      // Only attempt update if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sparepart.id);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('spareparts')
          .update({
            name: sparepart.name,
            mileage_installed: sparepart.mileageInstalled,
            estimated_mileage: sparepart.estimatedMileage,
            mileage_replaced: sparepart.mileageReplaced,
            date_installed: sparepart.dateInstalled,
            date_replaced: sparepart.dateReplaced,
            note: sparepart.note,
            status: sparepart.status
          })
          .eq('id', sparepart.id);

        if (error) {
          console.error('Error updating sparepart in Supabase:', error);
          // If it's a UUID but update failed, still try local update
          await DataModel.updateLocalSparepart(sparepart);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase update and only update in local storage
        console.log(`Skipping Supabase update for non-UUID ID: ${sparepart.id}`);
      }

      // Always update in local storage
      await DataModel.updateLocalSparepart(sparepart);
    } catch (error) {
      console.error('Unexpected error updating sparepart:', error);
      // Fallback to AsyncStorage
      await DataModel.updateLocalSparepart(sparepart);
    }
  }

  static async deleteSparepart(sparepartId: string): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.deleteLocalSparepart(sparepartId);
    }

    try {
      // Check if the ID is a numeric string (likely from local storage)
      // If it's not a valid UUID format, we can't delete it from Supabase
      // Only attempt deletion if it's a UUID format
      const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sparepartId);

      if (isUUIDFormat) {
        const { error } = await supabase
          .from('spareparts')
          .delete()
          .eq('id', sparepartId);

        if (error) {
          console.error('Error deleting sparepart from Supabase:', error);
          // If it's a UUID but deletion failed, still try local deletion
          await DataModel.deleteLocalSparepart(sparepartId);
          return;
        }
      } else {
        // If it's not UUID format, it might be a locally generated ID
        // In this case, skip Supabase deletion and only delete from local storage
        console.log(`Skipping Supabase deletion for non-UUID ID: ${sparepartId}`);
      }

      // Always delete from local storage
      await DataModel.deleteLocalSparepart(sparepartId);
    } catch (error) {
      console.error('Unexpected error deleting sparepart:', error);
      // Fallback to AsyncStorage
      await DataModel.deleteLocalSparepart(sparepartId);
    }
  }

  // Delete all records methods for reset functionality
  static async deleteAllOrders(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
      return;
    }

    try {
      // Delete all orders for the authenticated user from Supabase
      const { error } = await supabase
        .from('orders')
        .delete()
        .not('id', 'is', null); // This will delete all records

      if (error) {
        console.error('Error deleting all orders from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all orders:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
    }
  }

  static async deleteAllFuelExpenses(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
      return;
    }

    try {
      // Delete all fuel expenses for the authenticated user from Supabase
      const { error } = await supabase
        .from('fuel_expenses')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all fuel expenses from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all fuel expenses:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
    }
  }

  static async deleteAllOilChanges(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
      return;
    }

    try {
      // Delete all oil changes for the authenticated user from Supabase
      const { error } = await supabase
        .from('oil_changes')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all oil changes from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all oil changes:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
    }
  }

  static async deleteAllDailyMileages(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
      return;
    }

    try {
      // Delete all daily mileages for the authenticated user from Supabase
      const { error } = await supabase
        .from('daily_mileage')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all daily mileages from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all daily mileages:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
    }
  }

  static async deleteAllSpareparts(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
      return;
    }

    try {
      // Delete all spare parts for the authenticated user from Supabase
      const { error } = await supabase
        .from('spareparts')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all spareparts from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all spareparts:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
    }
  }

  static async deleteAllUserPreferences(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      // Just remove specific key from local storage if it exists
      await AsyncStorage.removeItem('custom_oil_change_interval');
      return;
    }

    try {
      // Delete all user preferences for the authenticated user from Supabase
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all user preferences from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem('custom_oil_change_interval');
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem('custom_oil_change_interval');
    } catch (error) {
      console.error('Error deleting all user preferences:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem('custom_oil_change_interval');
    }
  }
}

// Fallback implementation using AsyncStorage in case Supabase fails
class DataModel {
  // Storage keys
  static ORDER_STORAGE_KEY = '@orders';
  static FUEL_EXPENSE_STORAGE_KEY = '@fuel_expenses';
  static OIL_CHANGE_STORAGE_KEY = '@oil_changes';
  static SPAREPART_STORAGE_KEY = '@spareparts';

  // Orders - Local Implementation
  static async getLocalOrders(): Promise<Order[]> {
    try {
      const ordersData = await AsyncStorage.getItem(DataModel.ORDER_STORAGE_KEY);
      return ordersData ? JSON.parse(ordersData) : [];
    } catch (error) {
      console.error('Error getting orders from local storage:', error);
      return [];
    }
  }

  static async addLocalOrder(order: Omit<Order, 'id'>): Promise<void> {
    try {
      const orders = await DataModel.getLocalOrders();
      // Generate a unique ID for local storage
      const newOrder: Order = {
        ...order,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      };
      orders.push(newOrder);
      await AsyncStorage.setItem(DataModel.ORDER_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Error adding order to local storage:', error);
    }
  }

  static async addLocalOrderWithId(order: Order): Promise<void> {
    try {
      const orders = await DataModel.getLocalOrders();
      // Check if order with this ID already exists
      const existingIndex = orders.findIndex(item => item.id === order.id);
      if (existingIndex !== -1) {
        // Update existing order
        orders[existingIndex] = order;
      } else {
        // Add new order
        orders.push(order);
      }
      await AsyncStorage.setItem(DataModel.ORDER_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Error adding order with ID to local storage:', error);
    }
  }

  static async updateLocalOrder(order: Order): Promise<void> {
    try {
      const orders = await DataModel.getLocalOrders();
      const updatedOrders = orders.map(item =>
        item.id === order.id ? order : item
      );
      await AsyncStorage.setItem(DataModel.ORDER_STORAGE_KEY, JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Error updating order in local storage:', error);
    }
  }

  static async deleteLocalOrder(orderId: string): Promise<void> {
    try {
      const orders = await DataModel.getLocalOrders();
      const updatedOrders = orders.filter(item => item.id !== orderId);
      await AsyncStorage.setItem(DataModel.ORDER_STORAGE_KEY, JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Error deleting order from local storage:', error);
    }
  }

  // Fuel Expenses - Local Implementation
  static async getLocalFuelExpenses(): Promise<FuelExpense[]> {
    try {
      const expensesData = await AsyncStorage.getItem(DataModel.FUEL_EXPENSE_STORAGE_KEY);
      return expensesData ? JSON.parse(expensesData) : [];
    } catch (error) {
      console.error('Error getting fuel expenses from local storage:', error);
      return [];
    }
  }

  static async addLocalFuelExpense(expense: Omit<FuelExpense, 'id'>): Promise<void> {
    try {
      const expenses = await DataModel.getLocalFuelExpenses();
      const newExpense: FuelExpense = {
        ...expense,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      };
      expenses.push(newExpense);
      await AsyncStorage.setItem(DataModel.FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error adding fuel expense to local storage:', error);
    }
  }

  static async addLocalFuelExpenseWithId(expense: FuelExpense): Promise<void> {
    try {
      const expenses = await DataModel.getLocalFuelExpenses();
      // Check if expense with this ID already exists
      const existingIndex = expenses.findIndex(item => item.id === expense.id);
      if (existingIndex !== -1) {
        // Update existing expense
        expenses[existingIndex] = expense;
      } else {
        // Add new expense
        expenses.push(expense);
      }
      await AsyncStorage.setItem(DataModel.FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error adding fuel expense with ID to local storage:', error);
    }
  }

  static async updateLocalFuelExpense(expense: FuelExpense): Promise<void> {
    try {
      const expenses = await DataModel.getLocalFuelExpenses();
      const updatedExpenses = expenses.map(item =>
        item.id === expense.id ? expense : item
      );
      await AsyncStorage.setItem(DataModel.FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error updating fuel expense in local storage:', error);
    }
  }

  static async deleteLocalFuelExpense(expenseId: string): Promise<void> {
    try {
      const expenses = await DataModel.getLocalFuelExpenses();
      const updatedExpenses = expenses.filter(item => item.id !== expenseId);
      await AsyncStorage.setItem(DataModel.FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error deleting fuel expense from local storage:', error);
    }
  }

  // Oil Changes - Local Implementation
  static async getLocalOilChanges(): Promise<OilChange[]> {
    try {
      const changesData = await AsyncStorage.getItem(DataModel.OIL_CHANGE_STORAGE_KEY);
      return changesData ? JSON.parse(changesData) : [];
    } catch (error) {
      console.error('Error getting oil changes from local storage:', error);
      return [];
    }
  }

  static async addLocalOilChange(change: Omit<OilChange, 'id'>): Promise<void> {
    try {
      const changes = await DataModel.getLocalOilChanges();
      const newChange: OilChange = {
        ...change,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      };
      changes.push(newChange);
      await AsyncStorage.setItem(DataModel.OIL_CHANGE_STORAGE_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error('Error adding oil change to local storage:', error);
    }
  }

  static async addLocalOilChangeWithId(change: OilChange): Promise<void> {
    try {
      const changes = await DataModel.getLocalOilChanges();
      // Check if change with this ID already exists
      const existingIndex = changes.findIndex(item => item.id === change.id);
      if (existingIndex !== -1) {
        // Update existing change
        changes[existingIndex] = change;
      } else {
        // Add new change
        changes.push(change);
      }
      await AsyncStorage.setItem(DataModel.OIL_CHANGE_STORAGE_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error('Error adding oil change with ID to local storage:', error);
    }
  }

  static async updateLocalOilChange(change: OilChange): Promise<void> {
    try {
      const changes = await DataModel.getLocalOilChanges();
      const updatedChanges = changes.map(item =>
        item.id === change.id ? change : item
      );
      await AsyncStorage.setItem(DataModel.OIL_CHANGE_STORAGE_KEY, JSON.stringify(updatedChanges));
    } catch (error) {
      console.error('Error updating oil change in local storage:', error);
    }
  }

  static async deleteLocalOilChange(changeId: string): Promise<void> {
    try {
      const changes = await DataModel.getLocalOilChanges();
      const updatedChanges = changes.filter(item => item.id !== changeId);
      await AsyncStorage.setItem(DataModel.OIL_CHANGE_STORAGE_KEY, JSON.stringify(updatedChanges));
    } catch (error) {
      console.error('Error deleting oil change from local storage:', error);
    }
  }

  // Daily Mileage Records - Local Implementation
  static DAILY_MILEAGE_STORAGE_KEY = '@daily_mileage';

  static async getLocalDailyMileages(): Promise<DailyMileage[]> {
    try {
      const mileageData = await AsyncStorage.getItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
      return mileageData ? JSON.parse(mileageData) : [];
    } catch (error) {
      console.error('Error getting daily mileages from local storage:', error);
      return [];
    }
  }

  static async addLocalDailyMileage(mileage: Omit<DailyMileage, 'id'>): Promise<void> {
    try {
      const mileages = await DataModel.getLocalDailyMileages();
      const newMileage: DailyMileage = {
        ...mileage,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      };
      mileages.push(newMileage);
      await AsyncStorage.setItem(DataModel.DAILY_MILEAGE_STORAGE_KEY, JSON.stringify(mileages));
    } catch (error) {
      console.error('Error adding daily mileage to local storage:', error);
    }
  }

  static async addLocalDailyMileageWithId(mileage: DailyMileage): Promise<void> {
    try {
      const mileages = await DataModel.getLocalDailyMileages();
      // Check if mileage with this ID already exists
      const existingIndex = mileages.findIndex(item => item.id === mileage.id);
      if (existingIndex !== -1) {
        // Update existing mileage
        mileages[existingIndex] = mileage;
      } else {
        // Add new mileage
        mileages.push(mileage);
      }
      await AsyncStorage.setItem(DataModel.DAILY_MILEAGE_STORAGE_KEY, JSON.stringify(mileages));
    } catch (error) {
      console.error('Error adding daily mileage with ID to local storage:', error);
    }
  }

  static async updateLocalDailyMileage(mileage: DailyMileage): Promise<void> {
    try {
      const mileages = await DataModel.getLocalDailyMileages();
      const updatedMileages = mileages.map(item =>
        item.id === mileage.id ? mileage : item
      );
      await AsyncStorage.setItem(DataModel.DAILY_MILEAGE_STORAGE_KEY, JSON.stringify(updatedMileages));
    } catch (error) {
      console.error('Error updating daily mileage in local storage:', error);
    }
  }

  static async deleteLocalDailyMileage(mileageId: string): Promise<void> {
    try {
      const mileages = await DataModel.getLocalDailyMileages();
      const updatedMileages = mileages.filter(item => item.id !== mileageId);
      await AsyncStorage.setItem(DataModel.DAILY_MILEAGE_STORAGE_KEY, JSON.stringify(updatedMileages));
    } catch (error) {
      console.error('Error deleting daily mileage from local storage:', error);
    }
  }

  // Sparepart Management - Local Implementation
  static SPAREPART_STORAGE_KEY = '@spareparts';

  static async getLocalSpareparts(): Promise<Sparepart[]> {
    try {
      const sparepartData = await AsyncStorage.getItem(DataModel.SPAREPART_STORAGE_KEY);
      return sparepartData ? JSON.parse(sparepartData) : [];
    } catch (error) {
      console.error('Error getting spareparts from local storage:', error);
      return [];
    }
  }

  static async addLocalSparepart(sparepart: Omit<Sparepart, 'id'>): Promise<void> {
    try {
      const spareparts = await DataModel.getLocalSpareparts();
      const newSparepart: Sparepart = {
        ...sparepart,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      };
      spareparts.push(newSparepart);
      await AsyncStorage.setItem(DataModel.SPAREPART_STORAGE_KEY, JSON.stringify(spareparts));
    } catch (error) {
      console.error('Error adding sparepart to local storage:', error);
    }
  }

  static async addLocalSparepartWithId(sparepart: Sparepart): Promise<void> {
    try {
      const spareparts = await DataModel.getLocalSpareparts();
      // Check if sparepart with this ID already exists
      const existingIndex = spareparts.findIndex(item => item.id === sparepart.id);
      if (existingIndex !== -1) {
        // Update existing sparepart
        spareparts[existingIndex] = sparepart;
      } else {
        // Add new sparepart
        spareparts.push(sparepart);
      }
      await AsyncStorage.setItem(DataModel.SPAREPART_STORAGE_KEY, JSON.stringify(spareparts));
    } catch (error) {
      console.error('Error adding sparepart with ID to local storage:', error);
    }
  }

  static async updateLocalSparepart(sparepart: Sparepart): Promise<void> {
    try {
      const spareparts = await DataModel.getLocalSpareparts();
      const updatedSpareparts = spareparts.map(item =>
        item.id === sparepart.id ? sparepart : item
      );
      await AsyncStorage.setItem(DataModel.SPAREPART_STORAGE_KEY, JSON.stringify(updatedSpareparts));
    } catch (error) {
      console.error('Error updating sparepart in local storage:', error);
    }
  }

  static async deleteLocalSparepart(sparepartId: string): Promise<void> {
    try {
      const spareparts = await DataModel.getLocalSpareparts();
      const updatedSpareparts = spareparts.filter(item => item.id !== sparepartId);
      await AsyncStorage.setItem(DataModel.SPAREPART_STORAGE_KEY, JSON.stringify(updatedSpareparts));
    } catch (error) {
      console.error('Error deleting sparepart from local storage:', error);
    }
  }

  // Delete all records methods
  static async deleteAllOrders(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await DataModel.getLocalOrders();
      await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
      return;
    }

    try {
      // Check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not authenticated, clear local storage only
        await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
        return;
      }

      // Delete all orders for the authenticated user from Supabase
      const { error } = await supabase
        .from('orders')
        .delete()
        .not('id', 'is', null); // This will delete all records for this user

      if (error) {
        console.error('Error deleting all orders from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all orders:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
    }
  }

  static async deleteAllFuelExpenses(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
      return;
    }

    try {
      // Check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not authenticated, clear local storage only
        await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
        return;
      }

      // Delete all fuel expenses for the authenticated user from Supabase
      const { error } = await supabase
        .from('fuel_expenses')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all fuel expenses from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all fuel expenses:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);
    }
  }

  static async deleteAllOilChanges(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
      return;
    }

    try {
      // Check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not authenticated, clear local storage only
        await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
        return;
      }

      // Delete all oil changes for the authenticated user from Supabase
      const { error } = await supabase
        .from('oil_changes')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all oil changes from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all oil changes:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);
    }
  }

  static async deleteAllDailyMileages(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
      return;
    }

    try {
      // Check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not authenticated, clear local storage only
        await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
        return;
      }

      // Delete all daily mileages for the authenticated user from Supabase
      const { error } = await supabase
        .from('daily_mileage')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all daily mileages from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all daily mileages:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);
    }
  }

  static async deleteAllSpareparts(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
      return;
    }

    try {
      // Check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not authenticated, clear local storage only
        await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
        return;
      }

      // Delete all spare parts for the authenticated user from Supabase
      const { error } = await supabase
        .from('spareparts')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all spareparts from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all spareparts:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);
    }
  }

  static async deleteAllUserPreferences(): Promise<void> {
    // If Supabase client is not available, clear local storage only
    if (!supabase) {
      // Just remove specific key from local storage if it exists
      await AsyncStorage.removeItem('custom_oil_change_interval');
      return;
    }

    try {
      // Check if the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not authenticated, clear local storage only
        await AsyncStorage.removeItem('custom_oil_change_interval');
        return;
      }

      // Delete all user preferences for the authenticated user from Supabase
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.error('Error deleting all user preferences from Supabase:', error);
        // Still try to clear local storage
        await AsyncStorage.removeItem('custom_oil_change_interval');
        throw error;
      }

      // Clear local storage after successful deletion
      await AsyncStorage.removeItem('custom_oil_change_interval');
    } catch (error) {
      console.error('Error deleting all user preferences:', error);
      // If Supabase fails, clear local storage only
      await AsyncStorage.removeItem('custom_oil_change_interval');
    }
  }

  // Limited queries
  static async getDailyMileagesLimited(limit: number): Promise<DailyMileage[]> {
    return await DataModelSupabase.getDailyMileagesLimited(limit);
  }

  // Reset all data - Delete all records from all tables
  static async resetAllData(): Promise<void> {
    try {
      // Delete all orders
      await DataModelSupabase.deleteAllOrders();
      await AsyncStorage.removeItem(ORDER_STORAGE_KEY);

      // Delete all fuel expenses
      await DataModelSupabase.deleteAllFuelExpenses();
      await AsyncStorage.removeItem(FUEL_EXPENSE_STORAGE_KEY);

      // Delete all oil changes
      await DataModelSupabase.deleteAllOilChanges();
      await AsyncStorage.removeItem(OIL_CHANGE_STORAGE_KEY);

      // Delete all daily mileages
      await DataModelSupabase.deleteAllDailyMileages();
      await AsyncStorage.removeItem(DataModel.DAILY_MILEAGE_STORAGE_KEY);

      // Delete all spare parts
      await DataModelSupabase.deleteAllSpareparts();
      await AsyncStorage.removeItem(DataModel.SPAREPART_STORAGE_KEY);

      // Also clear any custom preferences (like oil change interval)
      await DataModelSupabase.deleteAllUserPreferences();
    } catch (error) {
      console.error('Error resetting all data:', error);
      // If Supabase fails, at least clear local storage
      await AsyncStorage.clear();
      throw error;
    }
  }
}
import { supabase } from '../utils/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define TypeScript interfaces (same as before)
export interface Order {
  id: string;
  amount: number; // in rupiah
  date: string; // ISO string format
  description?: string;
  quantity?: number; // for multiple fixed-price items
  pricePerItem?: number; // for fixed price items
  // Supabase returns snake_case columns
  price_per_item?: number;
}

export interface FuelExpense {
  id: string;
  amount: number; // in rupiah
  date: string; // ISO string format
  liters?: number;
  description?: string;
}

export interface OilChange {
  id: string;
  amount: number; // in rupiah
  date: string; // ISO string format
  mileage?: number; // in kilometers
  description?: string;
}

export class DataModelSupabase {
  // Orders
  static async getOrders(): Promise<Order[]> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.getLocalOrders();
    }

    try {
      // First try to fetch from Supabase
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching orders from Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.getLocalOrders();
      }

      // Convert snake_case column names back to camelCase for TypeScript interface
      const orders: Order[] = data.map(row => ({
        ...row,
        pricePerItem: row.price_per_item,  // Map snake_case to camelCase
      }));

      // Remove the snake_case property to maintain clean interface
      return orders.map(({ price_per_item, ...order }) => order as Order);
    } catch (error) {
      console.error('Unexpected error fetching orders:', error);
      // Fallback to AsyncStorage
      return await DataModel.getLocalOrders();
    }
  }

  static async addOrder(order: Omit<Order, 'id'>): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.addLocalOrder(order);
    }

    try {
      // Add to Supabase - map camelCase property to snake_case column
      const orderForDb = {
        ...order,
        price_per_item: order.pricePerItem,  // Map camelCase to snake_case
      };
      // Remove the original camelCase property to avoid conflicts
      if (orderForDb.pricePerItem !== undefined) {
        delete (orderForDb as any).pricePerItem;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([orderForDb])
        .select();

      if (error) {
        console.error('Error adding order to Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.addLocalOrder(order);
      }
    } catch (error) {
      console.error('Unexpected error adding order:', error);
      // Fallback to AsyncStorage
      return await DataModel.addLocalOrder(order);
    }
  }

  static async updateOrder(order: Order): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.updateLocalOrder(order);
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          amount: order.amount,
          date: order.date,
          description: order.description,
          quantity: order.quantity,
          price_per_item: order.pricePerItem  // Map camelCase to snake_case
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating order in Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.updateLocalOrder(order);
      }
    } catch (error) {
      console.error('Unexpected error updating order:', error);
      // Fallback to AsyncStorage
      return await DataModel.updateLocalOrder(order);
    }
  }

  static async deleteOrder(orderId: string): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.deleteLocalOrder(orderId);
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order from Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.deleteLocalOrder(orderId);
      }
    } catch (error) {
      console.error('Unexpected error deleting order:', error);
      // Fallback to AsyncStorage
      return await DataModel.deleteLocalOrder(orderId);
    }
  }

  // Fuel Expenses
  static async getFuelExpenses(): Promise<FuelExpense[]> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.getLocalFuelExpenses();
    }

    try {
      const { data, error } = await supabase
        .from('fuel_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching fuel expenses from Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.getLocalFuelExpenses();
      }

      return data as FuelExpense[];
    } catch (error) {
      console.error('Unexpected error fetching fuel expenses:', error);
      // Fallback to AsyncStorage
      return await DataModel.getLocalFuelExpenses();
    }
  }

  static async addFuelExpense(expense: Omit<FuelExpense, 'id'>): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.addLocalFuelExpense(expense);
    }

    try {
      const { data, error } = await supabase
        .from('fuel_expenses')
        .insert([expense])
        .select();

      if (error) {
        console.error('Error adding fuel expense to Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.addLocalFuelExpense(expense);
      }
    } catch (error) {
      console.error('Unexpected error adding fuel expense:', error);
      // Fallback to AsyncStorage
      return await DataModel.addLocalFuelExpense(expense);
    }
  }

  static async updateFuelExpense(expense: FuelExpense): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.updateLocalFuelExpense(expense);
    }

    try {
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
        // Fallback to AsyncStorage
        return await DataModel.updateLocalFuelExpense(expense);
      }
    } catch (error) {
      console.error('Unexpected error updating fuel expense:', error);
      // Fallback to AsyncStorage
      return await DataModel.updateLocalFuelExpense(expense);
    }
  }

  static async deleteFuelExpense(expenseId: string): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.deleteLocalFuelExpense(expenseId);
    }

    try {
      const { error } = await supabase
        .from('fuel_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting fuel expense from Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.deleteLocalFuelExpense(expenseId);
      }
    } catch (error) {
      console.error('Unexpected error deleting fuel expense:', error);
      // Fallback to AsyncStorage
      return await DataModel.deleteLocalFuelExpense(expenseId);
    }
  }

  // Oil Changes
  static async getOilChanges(): Promise<OilChange[]> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.getLocalOilChanges();
    }

    try {
      const { data, error } = await supabase
        .from('oil_changes')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching oil changes from Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.getLocalOilChanges();
      }

      return data as OilChange[];
    } catch (error) {
      console.error('Unexpected error fetching oil changes:', error);
      // Fallback to AsyncStorage
      return await DataModel.getLocalOilChanges();
    }
  }

  static async addOilChange(change: Omit<OilChange, 'id'>): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.addLocalOilChange(change);
    }

    try {
      const { data, error } = await supabase
        .from('oil_changes')
        .insert([change])
        .select();

      if (error) {
        console.error('Error adding oil change to Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.addLocalOilChange(change);
      }
    } catch (error) {
      console.error('Unexpected error adding oil change:', error);
      // Fallback to AsyncStorage
      return await DataModel.addLocalOilChange(change);
    }
  }

  static async updateOilChange(change: OilChange): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.updateLocalOilChange(change);
    }

    try {
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
        // Fallback to AsyncStorage
        return await DataModel.updateLocalOilChange(change);
      }
    } catch (error) {
      console.error('Unexpected error updating oil change:', error);
      // Fallback to AsyncStorage
      return await DataModel.updateLocalOilChange(change);
    }
  }

  static async deleteOilChange(changeId: string): Promise<void> {
    // If Supabase client is not available, fallback to local storage
    if (!supabase) {
      return await DataModel.deleteLocalOilChange(changeId);
    }

    try {
      const { error } = await supabase
        .from('oil_changes')
        .delete()
        .eq('id', changeId);

      if (error) {
        console.error('Error deleting oil change from Supabase:', error);
        // Fallback to AsyncStorage
        return await DataModel.deleteLocalOilChange(changeId);
      }
    } catch (error) {
      console.error('Unexpected error deleting oil change:', error);
      // Fallback to AsyncStorage
      return await DataModel.deleteLocalOilChange(changeId);
    }
  }
}

// Fallback implementation using AsyncStorage in case Supabase fails
class DataModel {
  // Storage keys
  static ORDER_STORAGE_KEY = '@orders';
  static FUEL_EXPENSE_STORAGE_KEY = '@fuel_expenses';
  static OIL_CHANGE_STORAGE_KEY = '@oil_changes';

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
}
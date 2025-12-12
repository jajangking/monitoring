import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataModelSupabase, Order, FuelExpense, OilChange, Sparepart, Motorcycle } from './DataModelSupabase';

// Re-export interfaces from the Supabase model
import { DailyMileage } from './DataModelSupabase';
export { Order, FuelExpense, OilChange, DailyMileage, Sparepart, Motorcycle };

// Storage keys
const ORDER_STORAGE_KEY = '@orders';
const FUEL_EXPENSE_STORAGE_KEY = '@fuel_expenses';
const OIL_CHANGE_STORAGE_KEY = '@oil_changes';

// Update the DataModel class to use Supabase implementation with fallback to local storage
export class DataModel {
  // Orders
  static async getOrders(): Promise<Order[]> {
    try {
      return await DataModelSupabase.getOrders();
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      return await DataModel.getLocalOrders();
    }
  }

  static async addOrder(order: Omit<Order, 'id'>): Promise<void> {
    try {
      await DataModelSupabase.addOrder(order);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.addLocalOrder(order);
    }
  }

  static async updateOrder(order: Order): Promise<void> {
    try {
      await DataModelSupabase.updateOrder(order);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.updateLocalOrder(order);
    }
  }

  static async deleteOrder(orderId: string): Promise<void> {
    try {
      await DataModelSupabase.deleteOrder(orderId);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.deleteLocalOrder(orderId);
    }
  }

  // Fuel Expenses
  static async getFuelExpenses(): Promise<FuelExpense[]> {
    try {
      return await DataModelSupabase.getFuelExpenses();
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      return await DataModel.getLocalFuelExpenses();
    }
  }

  static async addFuelExpense(expense: Omit<FuelExpense, 'id'>): Promise<void> {
    try {
      await DataModelSupabase.addFuelExpense(expense);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.addLocalFuelExpense(expense);
    }
  }

  static async updateFuelExpense(expense: FuelExpense): Promise<void> {
    try {
      await DataModelSupabase.updateFuelExpense(expense);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.updateLocalFuelExpense(expense);
    }
  }

  static async deleteFuelExpense(expenseId: string): Promise<void> {
    try {
      await DataModelSupabase.deleteFuelExpense(expenseId);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.deleteLocalFuelExpense(expenseId);
    }
  }

  // Oil Changes
  static async getOilChanges(motorcycleId?: string): Promise<OilChange[]> {
    try {
      return await DataModelSupabase.getOilChanges(motorcycleId);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      return await DataModel.getLocalOilChanges(motorcycleId);
    }
  }

  static async addOilChange(change: Omit<OilChange, 'id'>): Promise<void> {
    try {
      await DataModelSupabase.addOilChange(change);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.addLocalOilChange(change);
    }
  }

  static async updateOilChange(change: OilChange): Promise<void> {
    try {
      await DataModelSupabase.updateOilChange(change);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.updateLocalOilChange(change);
    }
  }

  static async deleteOilChange(changeId: string): Promise<void> {
    try {
      await DataModelSupabase.deleteOilChange(changeId);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.deleteLocalOilChange(changeId);
    }
  }

  // Local Storage Implementations for fallback
  // Orders - Local Implementation
  static async getLocalOrders(): Promise<Order[]> {
    try {
      const ordersData = await AsyncStorage.getItem(ORDER_STORAGE_KEY);
      return ordersData ? JSON.parse(ordersData) : [];
    } catch (error) {
      console.error('Error getting orders from local storage:', error);
      return [];
    }
  }

  static async addLocalOrder(order: Omit<Order, 'id'>): Promise<void> {
    try {
      const orders = await DataModel.getLocalOrders();
      const newOrder: Order = {
        ...order,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      };
      orders.push(newOrder);
      await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
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
      await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
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
      await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Error updating order in local storage:', error);
    }
  }

  static async deleteLocalOrder(orderId: string): Promise<void> {
    try {
      const orders = await DataModel.getLocalOrders();
      const updatedOrders = orders.filter(item => item.id !== orderId);
      await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Error deleting order from local storage:', error);
    }
  }

  // Fuel Expenses - Local Implementation
  static async getLocalFuelExpenses(): Promise<FuelExpense[]> {
    try {
      const expensesData = await AsyncStorage.getItem(FUEL_EXPENSE_STORAGE_KEY);
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
      await AsyncStorage.setItem(FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
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
      await AsyncStorage.setItem(FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
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
      await AsyncStorage.setItem(FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error updating fuel expense in local storage:', error);
    }
  }

  static async deleteLocalFuelExpense(expenseId: string): Promise<void> {
    try {
      const expenses = await DataModel.getLocalFuelExpenses();
      const updatedExpenses = expenses.filter(item => item.id !== expenseId);
      await AsyncStorage.setItem(FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error deleting fuel expense from local storage:', error);
    }
  }

  // Oil Changes - Local Implementation
  static async getLocalOilChanges(motorcycleId?: string): Promise<OilChange[]> {
    try {
      const changesData = await AsyncStorage.getItem(OIL_CHANGE_STORAGE_KEY);
      let changes = changesData ? JSON.parse(changesData) : [];

      // Filter by motorcycleId if provided
      if (motorcycleId) {
        changes = changes.filter(change => change.motorcycleId === motorcycleId);
      }

      return changes;
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
      await AsyncStorage.setItem(OIL_CHANGE_STORAGE_KEY, JSON.stringify(changes));
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
      await AsyncStorage.setItem(OIL_CHANGE_STORAGE_KEY, JSON.stringify(changes));
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
      await AsyncStorage.setItem(OIL_CHANGE_STORAGE_KEY, JSON.stringify(updatedChanges));
    } catch (error) {
      console.error('Error updating oil change in local storage:', error);
    }
  }

  static async deleteLocalOilChange(changeId: string): Promise<void> {
    try {
      const changes = await DataModel.getLocalOilChanges();
      const updatedChanges = changes.filter(item => item.id !== changeId);
      await AsyncStorage.setItem(OIL_CHANGE_STORAGE_KEY, JSON.stringify(updatedChanges));
    } catch (error) {
      console.error('Error deleting oil change from local storage:', error);
    }
  }

  // Daily Mileage Records
  static async getDailyMileages(motorcycleId?: string): Promise<DailyMileage[]> {
    try {
      return await DataModelSupabase.getDailyMileages(motorcycleId);
    } catch (error) {
      console.warn('Supabase not available, using local storage:', error);
      return await DataModel.getLocalDailyMileages(motorcycleId);
    }
  }

  static async addDailyMileage(mileage: Omit<DailyMileage, 'id'>): Promise<void> {
    try {
      await DataModelSupabase.addDailyMileage(mileage);
    } catch (error) {
      console.warn('Supabase not available, saving to local storage:', error);
      await DataModel.addLocalDailyMileage(mileage);
    }
  }

  static async updateDailyMileage(mileage: DailyMileage): Promise<void> {
    try {
      await DataModelSupabase.updateDailyMileage(mileage);
    } catch (error) {
      console.warn('Supabase not available, updating local storage:', error);
      await DataModel.updateLocalDailyMileage(mileage);
    }
  }

  static async deleteDailyMileage(mileageId: string): Promise<void> {
    try {
      await DataModelSupabase.deleteDailyMileage(mileageId);
    } catch (error) {
      console.warn('Supabase not available, deleting from local storage:', error);
      await DataModel.deleteLocalDailyMileage(mileageId);
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

  // Sparepart Management
  static async getSpareparts(motorcycleId?: string): Promise<Sparepart[]> {
    try {
      return await DataModelSupabase.getSpareparts(motorcycleId);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      return await DataModel.getLocalSpareparts(motorcycleId);
    }
  }

  static async addSparepart(sparepart: Omit<Sparepart, 'id'>): Promise<void> {
    try {
      await DataModelSupabase.addSparepart(sparepart);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.addLocalSparepart(sparepart);
    }
  }

  static async updateSparepart(sparepart: Sparepart): Promise<void> {
    try {
      await DataModelSupabase.updateSparepart(sparepart);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.updateLocalSparepart(sparepart);
    }
  }

  static async deleteSparepart(sparepartId: string): Promise<void> {
    try {
      await DataModelSupabase.deleteSparepart(sparepartId);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.deleteLocalSparepart(sparepartId);
    }
  }

  // Sparepart Management - Local Implementation
  static SPAREPART_STORAGE_KEY = '@spareparts';

  static async getLocalSpareparts(motorcycleId?: string): Promise<Sparepart[]> {
    try {
      const sparepartData = await AsyncStorage.getItem(DataModel.SPAREPART_STORAGE_KEY);
      let spareparts = sparepartData ? JSON.parse(sparepartData) : [];

      // Filter by motorcycleId if provided
      if (motorcycleId) {
        spareparts = spareparts.filter(sparepart => sparepart.motorcycleId === motorcycleId);
      }

      return spareparts;
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

  // Motorcycle Management
  static async getMotorcycles(): Promise<Motorcycle[]> {
    try {
      return await DataModelSupabase.getMotorcycles();
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      return await DataModel.getLocalMotorcycles();
    }
  }

  static async addMotorcycle(motorcycle: Omit<Motorcycle, 'id'>): Promise<void> {
    try {
      await DataModelSupabase.addMotorcycle(motorcycle);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.addLocalMotorcycle(motorcycle);
    }
  }

  static async updateMotorcycle(motorcycle: Motorcycle): Promise<void> {
    try {
      await DataModelSupabase.updateMotorcycle(motorcycle);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.updateLocalMotorcycle(motorcycle);
    }
  }

  static async deleteMotorcycle(motorcycleId: string): Promise<void> {
    try {
      await DataModelSupabase.deleteMotorcycle(motorcycleId);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      await DataModel.deleteLocalMotorcycle(motorcycleId);
    }
  }

  // Motorcycle Management - Local Implementation
  static MOTORCYCLE_STORAGE_KEY = '@motorcycles';

  static async getLocalMotorcycles(): Promise<Motorcycle[]> {
    try {
      const motorcycleData = await AsyncStorage.getItem(DataModel.MOTORCYCLE_STORAGE_KEY);
      return motorcycleData ? JSON.parse(motorcycleData) : [];
    } catch (error) {
      console.error('Error getting motorcycles from local storage:', error);
      return [];
    }
  }

  static async addLocalMotorcycle(motorcycle: Omit<Motorcycle, 'id'>): Promise<void> {
    try {
      const motorcycles = await DataModel.getLocalMotorcycles();
      const newMotorcycle: Motorcycle = {
        ...motorcycle,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      };
      motorcycles.push(newMotorcycle);
      await AsyncStorage.setItem(DataModel.MOTORCYCLE_STORAGE_KEY, JSON.stringify(motorcycles));
    } catch (error) {
      console.error('Error adding motorcycle to local storage:', error);
    }
  }

  static async addLocalMotorcycleWithId(motorcycle: Motorcycle): Promise<void> {
    try {
      const motorcycles = await DataModel.getLocalMotorcycles();
      // Check if motorcycle with this ID already exists
      const existingIndex = motorcycles.findIndex(item => item.id === motorcycle.id);
      if (existingIndex !== -1) {
        // Update existing motorcycle
        motorcycles[existingIndex] = motorcycle;
      } else {
        // Add new motorcycle
        motorcycles.push(motorcycle);
      }
      await AsyncStorage.setItem(DataModel.MOTORCYCLE_STORAGE_KEY, JSON.stringify(motorcycles));
    } catch (error) {
      console.error('Error adding motorcycle with ID to local storage:', error);
    }
  }

  static async updateLocalMotorcycle(motorcycle: Motorcycle): Promise<void> {
    try {
      const motorcycles = await DataModel.getLocalMotorcycles();
      const updatedMotorcycles = motorcycles.map(item =>
        item.id === motorcycle.id ? motorcycle : item
      );
      await AsyncStorage.setItem(DataModel.MOTORCYCLE_STORAGE_KEY, JSON.stringify(updatedMotorcycles));
    } catch (error) {
      console.error('Error updating motorcycle in local storage:', error);
    }
  }

  static async deleteLocalMotorcycle(motorcycleId: string): Promise<void> {
    try {
      const motorcycles = await DataModel.getLocalMotorcycles();
      const updatedMotorcycles = motorcycles.filter(item => item.id !== motorcycleId);
      await AsyncStorage.setItem(DataModel.MOTORCYCLE_STORAGE_KEY, JSON.stringify(updatedMotorcycles));
    } catch (error) {
      console.error('Error deleting motorcycle from local storage:', error);
    }
  }

  // Limited queries
  static async getDailyMileagesLimited(limit: number, motorcycleId?: string): Promise<DailyMileage[]> {
    try {
      return await DataModelSupabase.getDailyMileagesLimited(limit, motorcycleId);
    } catch (error) {
      console.warn('Supabase failed, falling back to local storage:', error);
      // Fallback to local storage with limit
      let localData = await DataModel.getLocalDailyMileages(motorcycleId);
      // Create a copy to avoid mutating the original
      localData = [...localData];
      // Sort from newest to oldest to identify the most recent entries
      // Using a combination of date and other indicators if available
      localData.sort((a, b) => {
        // Use created_at if available, otherwise use date field
        const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
        const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
        return timeB - timeA; // newest first
      });
      // Take the first 'limit' items (most recent entries)
      const mostRecentData = localData.slice(0, limit);
      // Create another copy and sort from oldest to newest so newest appears at bottom
      return mostRecentData.sort((a, b) => {
        // Use created_at if available, otherwise use date field
        const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
        const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
        return timeA - timeB; // oldest first
      });
    }
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define TypeScript interfaces
export interface Order {
  id: string;
  amount: number; // in rupiah
  date: string; // ISO string format
  description?: string;
  quantity?: number; // for multiple fixed-price items
  pricePerItem?: number; // for fixed price items
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

// Storage keys
const ORDER_STORAGE_KEY = '@orders';
const FUEL_EXPENSE_STORAGE_KEY = '@fuel_expenses';
const OIL_CHANGE_STORAGE_KEY = '@oil_changes';

export class DataModel {
  // Orders
  static async getOrders(): Promise<Order[]> {
    try {
      const ordersData = await AsyncStorage.getItem(ORDER_STORAGE_KEY);
      return ordersData ? JSON.parse(ordersData) : [];
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  static async addOrder(order: Omit<Order, 'id'>): Promise<void> {
    try {
      const orders = await this.getOrders();
      const newOrder: Order = {
        ...order,
        id: Date.now().toString(),
      };
      orders.push(newOrder);
      await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Error adding order:', error);
    }
  }

  static async updateOrder(order: Order): Promise<void> {
    try {
      const orders = await this.getOrders();
      const updatedOrders = orders.map(item => 
        item.id === order.id ? order : item
      );
      await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  }

  static async deleteOrder(orderId: string): Promise<void> {
    try {
      const orders = await this.getOrders();
      const updatedOrders = orders.filter(item => item.id !== orderId);
      await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  }

  // Fuel Expenses
  static async getFuelExpenses(): Promise<FuelExpense[]> {
    try {
      const expensesData = await AsyncStorage.getItem(FUEL_EXPENSE_STORAGE_KEY);
      return expensesData ? JSON.parse(expensesData) : [];
    } catch (error) {
      console.error('Error getting fuel expenses:', error);
      return [];
    }
  }

  static async addFuelExpense(expense: Omit<FuelExpense, 'id'>): Promise<void> {
    try {
      const expenses = await this.getFuelExpenses();
      const newExpense: FuelExpense = {
        ...expense,
        id: Date.now().toString(),
      };
      expenses.push(newExpense);
      await AsyncStorage.setItem(FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error adding fuel expense:', error);
    }
  }

  static async updateFuelExpense(expense: FuelExpense): Promise<void> {
    try {
      const expenses = await this.getFuelExpenses();
      const updatedExpenses = expenses.map(item => 
        item.id === expense.id ? expense : item
      );
      await AsyncStorage.setItem(FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error updating fuel expense:', error);
    }
  }

  static async deleteFuelExpense(expenseId: string): Promise<void> {
    try {
      const expenses = await this.getFuelExpenses();
      const updatedExpenses = expenses.filter(item => item.id !== expenseId);
      await AsyncStorage.setItem(FUEL_EXPENSE_STORAGE_KEY, JSON.stringify(updatedExpenses));
    } catch (error) {
      console.error('Error deleting fuel expense:', error);
    }
  }

  // Oil Changes
  static async getOilChanges(): Promise<OilChange[]> {
    try {
      const changesData = await AsyncStorage.getItem(OIL_CHANGE_STORAGE_KEY);
      return changesData ? JSON.parse(changesData) : [];
    } catch (error) {
      console.error('Error getting oil changes:', error);
      return [];
    }
  }

  static async addOilChange(change: Omit<OilChange, 'id'>): Promise<void> {
    try {
      const changes = await this.getOilChanges();
      const newChange: OilChange = {
        ...change,
        id: Date.now().toString(),
      };
      changes.push(newChange);
      await AsyncStorage.setItem(OIL_CHANGE_STORAGE_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error('Error adding oil change:', error);
    }
  }

  static async updateOilChange(change: OilChange): Promise<void> {
    try {
      const changes = await this.getOilChanges();
      const updatedChanges = changes.map(item => 
        item.id === change.id ? change : item
      );
      await AsyncStorage.setItem(OIL_CHANGE_STORAGE_KEY, JSON.stringify(updatedChanges));
    } catch (error) {
      console.error('Error updating oil change:', error);
    }
  }

  static async deleteOilChange(changeId: string): Promise<void> {
    try {
      const changes = await this.getOilChanges();
      const updatedChanges = changes.filter(item => item.id !== changeId);
      await AsyncStorage.setItem(OIL_CHANGE_STORAGE_KEY, JSON.stringify(updatedChanges));
    } catch (error) {
      console.error('Error deleting oil change:', error);
    }
  }
}
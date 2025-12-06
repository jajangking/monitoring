import { DataModelSupabase, Order, FuelExpense, OilChange } from './DataModelSupabase';

// Re-export interfaces from the Supabase model
export { Order, FuelExpense, OilChange };

// Update the DataModel class to use Supabase implementation
export class DataModel {
  // Orders
  static async getOrders(): Promise<Order[]> {
    return await DataModelSupabase.getOrders();
  }

  static async addOrder(order: Omit<Order, 'id'>): Promise<void> {
    await DataModelSupabase.addOrder(order);
  }

  static async updateOrder(order: Order): Promise<void> {
    await DataModelSupabase.updateOrder(order);
  }

  static async deleteOrder(orderId: string): Promise<void> {
    await DataModelSupabase.deleteOrder(orderId);
  }

  // Fuel Expenses
  static async getFuelExpenses(): Promise<FuelExpense[]> {
    return await DataModelSupabase.getFuelExpenses();
  }

  static async addFuelExpense(expense: Omit<FuelExpense, 'id'>): Promise<void> {
    await DataModelSupabase.addFuelExpense(expense);
  }

  static async updateFuelExpense(expense: FuelExpense): Promise<void> {
    await DataModelSupabase.updateFuelExpense(expense);
  }

  static async deleteFuelExpense(expenseId: string): Promise<void> {
    await DataModelSupabase.deleteFuelExpense(expenseId);
  }

  // Oil Changes
  static async getOilChanges(): Promise<OilChange[]> {
    return await DataModelSupabase.getOilChanges();
  }

  static async addOilChange(change: Omit<OilChange, 'id'>): Promise<void> {
    await DataModelSupabase.addOilChange(change);
  }

  static async updateOilChange(change: OilChange): Promise<void> {
    await DataModelSupabase.updateOilChange(change);
  }

  static async deleteOilChange(changeId: string): Promise<void> {
    await DataModelSupabase.deleteOilChange(changeId);
  }
}
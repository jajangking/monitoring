import { Order, FuelExpense, OilChange } from '../models/DataModel';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Calculates total orders within a specific date range
 */
export const calculateTotalOrders = (orders: Order[], dateRange: DateRange): number => {
  return orders
    .filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
    })
    .reduce((sum, order) => sum + order.amount, 0);
};

/**
 * Calculates total fuel expenses within a specific date range
 */
export const calculateTotalFuelExpenses = (expenses: FuelExpense[], dateRange: DateRange): number => {
  return expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= dateRange.startDate && expenseDate <= dateRange.endDate;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
};

/**
 * Calculates total oil change expenses within a specific date range
 */
export const calculateTotalOilChangeExpenses = (changes: OilChange[], dateRange: DateRange): number => {
  return changes
    .filter(change => {
      const changeDate = new Date(change.date);
      return changeDate >= dateRange.startDate && changeDate <= dateRange.endDate;
    })
    .reduce((sum, change) => sum + change.amount, 0);
};

/**
 * Calculates total expenses (fuel + oil changes) within a specific date range
 */
export const calculateTotalExpenses = (
  fuelExpenses: FuelExpense[],
  oilChanges: OilChange[],
  dateRange: DateRange
): number => {
  const fuelTotal = calculateTotalFuelExpenses(fuelExpenses, dateRange);
  const oilTotal = calculateTotalOilChangeExpenses(oilChanges, dateRange);
  return fuelTotal + oilTotal;
};

/**
 * Calculates net income (orders - expenses) within a specific date range
 */
export const calculateNetIncome = (
  orders: Order[],
  fuelExpenses: FuelExpense[],
  oilChanges: OilChange[],
  dateRange: DateRange
): number => {
  const totalOrders = calculateTotalOrders(orders, dateRange);
  const totalExpenses = calculateTotalExpenses(fuelExpenses, oilChanges, dateRange);
  return totalOrders - totalExpenses;
};

/**
 * Gets predefined date ranges: 1-15 (first half) and 15-31 (second half)
 */
export const getPredefinedDateRanges = (year: number, month: number): { firstHalf: DateRange, secondHalf: DateRange } => {
  // Get the number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstHalf: DateRange = {
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month, 15)
  };

  const secondHalf: DateRange = {
    startDate: new Date(year, month, 16),
    endDate: new Date(year, month, daysInMonth)
  };

  return { firstHalf, secondHalf };
};

/**
 * Calculates totals for both predefined date ranges in a month
 */
export const calculateMonthlyTotals = (
  orders: Order[],
  fuelExpenses: FuelExpense[],
  oilChanges: OilChange[],
  year: number,
  month: number
) => {
  const { firstHalf, secondHalf } = getPredefinedDateRanges(year, month);

  return {
    firstHalf: {
      totalOrders: calculateTotalOrders(orders, firstHalf),
      totalExpenses: calculateTotalExpenses(fuelExpenses, oilChanges, firstHalf),
      netIncome: calculateNetIncome(orders, fuelExpenses, oilChanges, firstHalf)
    },
    secondHalf: {
      totalOrders: calculateTotalOrders(orders, secondHalf),
      totalExpenses: calculateTotalExpenses(fuelExpenses, oilChanges, secondHalf),
      netIncome: calculateNetIncome(orders, fuelExpenses, oilChanges, secondHalf)
    }
  };
};

/**
 * Calculates totals for a custom date range
 */
export const calculateCustomRangeTotals = (
  orders: Order[],
  fuelExpenses: FuelExpense[],
  oilChanges: OilChange[],
  startDate: Date,
  endDate: Date
) => {
  const dateRange: DateRange = { startDate, endDate };

  return {
    totalOrders: calculateTotalOrders(orders, dateRange),
    totalExpenses: calculateTotalExpenses(fuelExpenses, oilChanges, dateRange),
    netIncome: calculateNetIncome(orders, fuelExpenses, oilChanges, dateRange)
  };
};

/**
 * Calculates daily order accumulation for a specific date
 */
export const calculateDailyOrderTotal = (orders: Order[], date: Date): number => {
  // Format the input date to YYYY-MM-DD to match order dates
  const dateStr = date.toISOString().split('T')[0];

  return orders
    .filter(order => order.date === dateStr)
    .reduce((sum, order) => sum + order.amount, 0);
};

/**
 * Calculates daily order accumulation for multiple days in a date range
 */
export const calculateDailyOrderAccumulation = (orders: Order[], dateRange: DateRange): Record<string, number> => {
  const result: Record<string, number> = {};

  // Get all orders in the date range
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.date);
    return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
  });

  // Group orders by date and sum amounts
  filteredOrders.forEach(order => {
    if (!result[order.date]) {
      result[order.date] = 0;
    }
    result[order.date] += order.amount;
  });

  return result;
};

/**
 * Calculates daily order accumulation for a specific month, grouped by day
 */
export const calculateMonthlyDailyAccumulation = (orders: Order[], year: number, month: number): Record<string, number> => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of the month

  const dateRange: DateRange = { startDate, endDate };
  return calculateDailyOrderAccumulation(orders, dateRange);
};

/**
 * Gets daily order count for each day in a date range
 */
export const calculateDailyOrderCount = (orders: Order[], dateRange: DateRange): Record<string, number> => {
  const result: Record<string, number> = {};

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.date);
    return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
  });

  filteredOrders.forEach(order => {
    if (!result[order.date]) {
      result[order.date] = 0;
    }
    result[order.date] += 1;
  });

  return result;
};
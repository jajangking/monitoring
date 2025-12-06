import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Pressable, RefreshControl } from 'react-native';
import { OrderTracker } from '../components/OrderTracker';
import { FuelExpenseTracker } from '../components/FuelExpenseTracker';
import { OilChangeTracker } from '../components/OilChangeTracker';
import { DataModel } from '../models/DataModel';
import { calculateNetIncome, calculateMonthlyTotals, calculateCustomRangeTotals, getPredefinedDateRanges, calculateMonthlyDailyAccumulation, calculateDailyOrderCount, calculateTotalOrders, calculateTotalExpenses } from '../utils/Calculations';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the main tabs
type Tab = 'dashboard' | 'orders' | 'fuel' | 'oil' | 'settings';

// Define summary data structure
interface SummaryData {
  totalOrders: number;
  totalExpenses: number;
  netIncome: number;
  firstHalfNetIncome: number;
  secondHalfNetIncome: number;
  currentMonthOrders: number;
  currentMonthExpenses: number;
  currentMonthNetIncome: number;
  dailyAccumulation: Record<string, number>;
  dailyOrderCounts: Record<string, number>;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [summary, setSummary] = useState<SummaryData>({
    totalOrders: 0,
    totalExpenses: 0,
    netIncome: 0,
    firstHalfNetIncome: 0,
    secondHalfNetIncome: 0,
    currentMonthOrders: 0,
    currentMonthExpenses: 0,
    currentMonthNetIncome: 0,
    dailyAccumulation: {},
    dailyOrderCounts: {}
  });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Load all data and calculate summaries
  useEffect(() => {
    loadAndCalculateData();
  }, [currentMonth, currentYear]);

  const loadAndCalculateData = async () => {
    try {
      const [orders, fuelExpenses, oilChanges] = await Promise.all([
        DataModel.getOrders(),
        DataModel.getFuelExpenses(),
        DataModel.getOilChanges()
      ]);

      // Calculate monthly totals for current month
      const monthlyTotals = calculateMonthlyTotals(
        orders,
        fuelExpenses,
        oilChanges,
        currentYear,
        currentMonth
      );

      // Calculate daily accumulation for the current month
      const dailyAccumulation = calculateMonthlyDailyAccumulation(orders, currentYear, currentMonth);
      const dailyOrderCounts = calculateDailyOrderCount(orders, {
        startDate: new Date(currentYear, currentMonth, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0)
      });

      // Calculate totals for current month only
      const currentMonthDateRange = {
        startDate: new Date(currentYear, currentMonth, 1),
        endDate: new Date(currentYear, currentMonth + 1, 0)
      };

      const currentMonthOrders = calculateTotalOrders(orders, currentMonthDateRange);
      const currentMonthExpenses = calculateTotalExpenses(fuelExpenses, oilChanges, currentMonthDateRange);
      const currentMonthNetIncome = currentMonthOrders - currentMonthExpenses;

      // Calculate overall totals (for all time)
      const allTimeDateRange = {
        startDate: new Date(1970, 0, 1), // Beginning of time
        endDate: new Date(2050, 11, 31)  // Far future
      };

      const totalOrders = orders.reduce((sum, order) => sum + order.amount, 0);
      const totalFuelExpenses = fuelExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalOilChangeExpenses = oilChanges.reduce((sum, change) => sum + change.amount, 0);
      const totalExpenses = totalFuelExpenses + totalOilChangeExpenses;
      const overallNetIncome = totalOrders - totalExpenses;

      setSummary({
        totalOrders,
        totalExpenses,
        netIncome: overallNetIncome,
        firstHalfNetIncome: monthlyTotals.firstHalf.netIncome,
        secondHalfNetIncome: monthlyTotals.secondHalf.netIncome,
        currentMonthOrders,
        currentMonthExpenses,
        currentMonthNetIncome,
        dailyAccumulation,
        dailyOrderCounts
      });
    } catch (error) {
      console.error('Error calculating summaries:', error);
      Alert.alert('Error', 'Failed to calculate summaries');
    }
  };

  const navigateMonth = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentMonth === 11) {
        setCurrentYear(currentYear + 1);
        setCurrentMonth(0);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      if (currentMonth === 0) {
        setCurrentYear(currentYear - 1);
        setCurrentMonth(11);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  // Reset all data (for testing purposes)
  const resetAllData = async () => {
    Alert.alert(
      'Confirm Reset',
      'Are you sure you want to reset all data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              loadAndCalculateData();
              Alert.alert('Success', 'All data has been reset');
            } catch (error) {
              console.error('Error resetting data:', error);
              Alert.alert('Error', 'Failed to reset data');
            }
          }
        }
      ]
    );
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Format month-year display
  const formatMonthYear = (): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[currentMonth]} ${currentYear}`;
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAndCalculateData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monitoring App</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'fuel' && styles.activeTab]}
          onPress={() => setActiveTab('fuel')}
        >
          <Text style={[styles.tabText, activeTab === 'fuel' && styles.activeTabText]}>Fuel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'oil' && styles.activeTab]}
          onPress={() => setActiveTab('oil')}
        >
          <Text style={[styles.tabText, activeTab === 'oil' && styles.activeTabText]}>Oil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {activeTab === 'dashboard' && (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.title}>Financial Summary</Text>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <Pressable
              style={({ pressed }) => [styles.navButton, pressed && styles.pressedButton]}
              onPress={() => navigateMonth('prev')}
            >
              <Text style={styles.navButtonText}>‹ Prev</Text>
            </Pressable>
            <Text style={styles.monthYear}>{formatMonthYear()}</Text>
            <Pressable
              style={({ pressed }) => [styles.navButton, pressed && styles.pressedButton]}
              onPress={() => navigateMonth('next')}
            >
              <Text style={styles.navButtonText}>Next ›</Text>
            </Pressable>
          </View>


          {/* Monthly Summary Cards */}
          <View style={styles.monthlySummaryContainer}>
            <Text style={styles.monthlySummaryTitle}>This Month ({formatMonthYear()})</Text>
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, styles.monthlyOrdersCard]}>
                <View style={styles.cardContent}>
                  <Text style={styles.summaryTitle}>Orders</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.currentMonthOrders)}</Text>
                </View>
              </View>

              <View style={[styles.summaryCard, styles.monthlyExpensesCard]}>
                <View style={styles.cardContent}>
                  <Text style={styles.summaryTitle}>Expenses</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.currentMonthExpenses)}</Text>
                </View>
              </View>

              <View style={[styles.summaryCard, styles.monthlyNetIncomeCard]}>
                <View style={styles.cardContent}>
                  <Text style={styles.summaryTitle}>Net Income</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      summary.currentMonthNetIncome >= 0 ? styles.positiveValue : styles.negativeValue
                    ]}
                  >
                    {formatCurrency(summary.currentMonthNetIncome)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Overall Summary Cards */}
          <View style={styles.summaryContainer}>
            <Text style={styles.monthlySummaryTitle}>Overall Totals</Text>
            <View style={styles.summaryCard}>
              <View style={styles.cardContent}>
                <Text style={styles.summaryTitle}>Total Orders</Text>
                <Text style={styles.summaryValue}>{formatCurrency(summary.totalOrders)}</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.cardContent}>
                <Text style={styles.summaryTitle}>Total Expenses</Text>
                <Text style={styles.summaryValue}>{formatCurrency(summary.totalExpenses)}</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.cardContent}>
                <Text style={styles.summaryTitle}>Net Income (All Time)</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    summary.netIncome >= 0 ? styles.positiveValue : styles.negativeValue
                  ]}
                >
                  {formatCurrency(summary.netIncome)}
                </Text>
              </View>
            </View>
          </View>

          {/* Half-Month Summary Cards */}
          <View style={styles.summaryContainer}>
            <Text style={styles.monthlySummaryTitle}>This Month Breakdown</Text>
            <View style={styles.summaryCard}>
              <View style={styles.cardContent}>
                <Text style={styles.summaryTitle}>Net Income (1st Half)</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    summary.firstHalfNetIncome >= 0 ? styles.positiveValue : styles.negativeValue
                  ]}
                >
                  {formatCurrency(summary.firstHalfNetIncome)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.cardContent}>
                <Text style={styles.summaryTitle}>Net Income (2nd Half)</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    summary.secondHalfNetIncome >= 0 ? styles.positiveValue : styles.negativeValue
                  ]}
                >
                  {formatCurrency(summary.secondHalfNetIncome)}
                </Text>
              </View>
            </View>
          </View>

          {/* Daily Accumulation Section */}
          <View style={styles.dailyAccumulationContainer}>
            <Text style={styles.dailyAccumulationTitle}>Daily Order Summary</Text>
            <View style={styles.dailyAccumulationList}>
              {Object.entries(summary.dailyAccumulation).length > 0 ? (
                Object.entries(summary.dailyAccumulation)
                  .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Sort by date
                  .map(([date, amount]) => {
                    const orderCount = summary.dailyOrderCounts[date] || 0;
                    return (
                      <View key={date} style={styles.dailyItem}>
                        <View style={styles.dailyItemHeader}>
                          <Text style={styles.dailyDate}>{new Date(date).toLocaleDateString()}</Text>
                          <Text style={styles.dailyAmount}>Rp {amount.toLocaleString()}</Text>
                        </View>
                        <Text style={styles.dailyCount}>{orderCount} order{orderCount !== 1 ? 's' : ''}</Text>
                      </View>
                    );
                  })
              ) : (
                <Text style={styles.emptyText}>No orders for this month</Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'orders' && <OrderTracker />}
      {activeTab === 'fuel' && <FuelExpenseTracker />}
      {activeTab === 'oil' && <OilChangeTracker />}
      {activeTab === 'settings' && (
        <View style={styles.settingsTabContainer}>
          <Text style={styles.settingsTabTitle}>Settings</Text>
          <View style={styles.settingsTabContent}>
            <Pressable
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressedButton]}
              onPress={resetAllData}
            >
              <Text style={styles.resetButtonText}>Reset All Data</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  activeTabText: {
    color: '#2196F3',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  navButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summaryContainer: {
    marginBottom: 24,
  },
  cardContent: {
    padding: 16,
  },
  summaryCard: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ordersCard: {
    backgroundColor: '#E8F5E9',
  },
  expensesCard: {
    backgroundColor: '#FFEBEE',
  },
  netIncomeCard: {
    backgroundColor: '#E3F2FD',
  },
  halfCard: {
    backgroundColor: '#F3E5F5',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  positiveValue: {
    color: '#4CAF50',
  },
  negativeValue: {
    color: '#f44336',
  },
  actionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resetButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  pressedButton: {
    opacity: 0.7,
  },
  dailyAccumulationContainer: {
    marginBottom: 24,
  },
  dailyAccumulationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  dailyAccumulationList: {
    marginBottom: 16,
  },
  dailyItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dailyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dailyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  dailyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dailyCount: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  monthlySummaryContainer: {
    marginBottom: 24,
  },
  monthlySummaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  monthlyOrdersCard: {
    backgroundColor: '#E8F5E9',
  },
  monthlyExpensesCard: {
    backgroundColor: '#FFEBEE',
  },
  monthlyNetIncomeCard: {
    backgroundColor: '#E3F2FD',
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  settingsContent: {
    padding: 16,
  },
  settingsTabContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  settingsTabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  settingsTabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Pressable, RefreshControl, Appearance } from 'react-native';
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

  // Add state for dark mode
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [userTheme, setUserTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Load all data and calculate summaries
  useEffect(() => {
    loadAndCalculateData();
    loadThemePreference();

    // Listen for appearance changes
    const subscription = Appearance.addChangeListener(() => {
      if (userTheme === 'system') {
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      }
    });

    return () => subscription.remove();
  }, [currentMonth, currentYear, userTheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        const theme = savedTheme as 'light' | 'dark' | 'system';
        setUserTheme(theme);
        if (theme === 'system') {
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        } else {
          setIsDarkMode(theme === 'dark');
        }
      }
    } catch (error) {
      console.error('Kesalahan saat memuat preferensi tema:', error);
    }
  };

  const saveThemePreference = async (theme: 'light' | 'dark' | 'system') => {
    try {
      await AsyncStorage.setItem('theme', theme);
      setUserTheme(theme);
      if (theme === 'system') {
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      } else {
        setIsDarkMode(theme === 'dark');
      }
    } catch (error) {
      console.error('Kesalahan saat menyimpan preferensi tema:', error);
    }
  };

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
      console.error('Kesalahan saat menghitung ringkasan:', error);
      Alert.alert('Kesalahan', 'Gagal menghitung ringkasan');
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
      'Konfirmasi Atur Ulang',
      'Apakah Anda yakin ingin mengatur ulang semua data? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Atur Ulang Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              loadAndCalculateData();
              Alert.alert('Sukses', 'Semua data telah diatur ulang');
            } catch (error) {
              console.error('Kesalahan saat mengatur ulang data:', error);
              Alert.alert('Kesalahan', 'Gagal mengatur ulang data');
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
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[currentMonth]} ${currentYear}`;
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAndCalculateData();
    setRefreshing(false);
  };

  // Get theme-appropriate colors
  const getThemeColors = () => {
    return isDarkMode ? darkTheme : lightTheme;
  };

  const themeColors = getThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.header }]}>
        <Text style={[styles.headerTitle, { color: themeColors.headerText }]}>Aplikasi Monitoring</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabScrollView}>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: activeTab === 'dashboard' ? themeColors.activeTabBackground : themeColors.tabBackground }]}
            onPress={() => setActiveTab('dashboard')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>📊</Text>
              <Text style={[styles.tabText, { color: activeTab === 'dashboard' ? themeColors.activeTabText : themeColors.text }]}>Dasbor</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: activeTab === 'orders' ? themeColors.activeTabBackground : themeColors.tabBackground }]}
            onPress={() => setActiveTab('orders')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>📦</Text>
              <Text style={[styles.tabText, { color: activeTab === 'orders' ? themeColors.activeTabText : themeColors.text }]}>Pesanan</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: activeTab === 'fuel' ? themeColors.activeTabBackground : themeColors.tabBackground }]}
            onPress={() => setActiveTab('fuel')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>⛽</Text>
              <Text style={[styles.tabText, { color: activeTab === 'fuel' ? themeColors.activeTabText : themeColors.text }]}>BBM</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: activeTab === 'oil' ? themeColors.activeTabBackground : themeColors.tabBackground }]}
            onPress={() => setActiveTab('oil')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>🔧</Text>
              <Text style={[styles.tabText, { color: activeTab === 'oil' ? themeColors.activeTabText : themeColors.text }]}>Oli</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: activeTab === 'settings' ? themeColors.activeTabBackground : themeColors.tabBackground }]}
            onPress={() => setActiveTab('settings')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>⚙️</Text>
              <Text style={[styles.tabText, { color: activeTab === 'settings' ? themeColors.activeTabText : themeColors.text }]}>Pengaturan</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {activeTab === 'dashboard' && (
        <ScrollView
          style={[styles.content, { backgroundColor: themeColors.background }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.activeTabBorder]}
              progressBackgroundColor={themeColors.background}
            />
          }
        >
          <Text style={[styles.title, { color: themeColors.text }]}>{isDarkMode ? '📊 Ringkasan Keuangan' : '📊 Ringkasan Keuangan'}</Text>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <Pressable
              style={({ pressed }) => [styles.navButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}
              onPress={() => navigateMonth('prev')}
            >
              <Text style={[styles.navButtonText, { color: themeColors.buttonText }]}>{isDarkMode ? '‹ Sebelumnya' : '‹ Sebelumnya'}</Text>
            </Pressable>
            <Text style={[styles.monthYear, { color: themeColors.text }]}>{formatMonthYear()}</Text>
            <Pressable
              style={({ pressed }) => [styles.navButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}
              onPress={() => navigateMonth('next')}
            >
              <Text style={[styles.navButtonText, { color: themeColors.buttonText }]}>{isDarkMode ? 'Berikutnya ›' : 'Berikutnya ›'}</Text>
            </Pressable>
          </View>


          {/* Monthly Summary Cards */}
          <View style={styles.monthlySummaryContainer}>
            <Text style={[styles.monthlySummaryTitle, { color: themeColors.text }]}>{isDarkMode ? `💰 Bulan Ini (${formatMonthYear()})` : `💰 Bulan Ini (${formatMonthYear()})`}</Text>
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, styles.monthlyOrdersCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
                <View style={styles.cardContent}>
                  <Text style={[styles.summaryTitle, { color: themeColors.text }]}>{isDarkMode ? '📦 Pesanan' : '📦 Pesanan'}</Text>
                  <Text style={[styles.summaryValue, { color: themeColors.text }]}>{formatCurrency(summary.currentMonthOrders)}</Text>
                </View>
              </View>

              <View style={[styles.summaryCard, styles.monthlyExpensesCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
                <View style={styles.cardContent}>
                  <Text style={[styles.summaryTitle, { color: themeColors.text }]}>{isDarkMode ? '💸 Pengeluaran' : '💸 Pengeluaran'}</Text>
                  <Text style={[styles.summaryValue, { color: themeColors.text }]}>{formatCurrency(summary.currentMonthExpenses)}</Text>
                </View>
              </View>

              <View style={[styles.summaryCard, styles.monthlyNetIncomeCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
                <View style={styles.cardContent}>
                  <Text style={[styles.summaryTitle, { color: themeColors.text }]}>{isDarkMode ? '📈 Pendapatan Bersih' : '📈 Pendapatan Bersih'}</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      summary.currentMonthNetIncome >= 0 ? styles.positiveValue : styles.negativeValue,
                      { color: summary.currentMonthNetIncome >= 0 ? themeColors.positive : themeColors.negative }
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
            <Text style={[styles.monthlySummaryTitle, { color: themeColors.text }]}>{isDarkMode ? '📋 Total Keseluruhan' : '📋 Total Keseluruhan'}</Text>
            <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>{isDarkMode ? '📦 Total Pesanan' : '📦 Total Pesanan'}</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text }]}>{formatCurrency(summary.totalOrders)}</Text>
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>{isDarkMode ? '💸 Total Pengeluaran' : '💸 Total Pengeluaran'}</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text }]}>{formatCurrency(summary.totalExpenses)}</Text>
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>{isDarkMode ? '📈 Pendapatan Bersih (Sepanjang Waktu)' : '📈 Pendapatan Bersih (Sepanjang Waktu)'}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    summary.netIncome >= 0 ? styles.positiveValue : styles.negativeValue,
                    { color: summary.netIncome >= 0 ? themeColors.positive : themeColors.negative }
                  ]}
                >
                  {formatCurrency(summary.netIncome)}
                </Text>
              </View>
            </View>
          </View>

          {/* Half-Month Summary Cards */}
          <View style={styles.summaryContainer}>
            <Text style={[styles.monthlySummaryTitle, { color: themeColors.text }]}>{isDarkMode ? '📅 Rincian Bulan Ini' : '📅 Rincian Bulan Ini'}</Text>
            <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>{isDarkMode ? '📈 Pendapatan Bersih (Awal Bulan)' : '📈 Pendapatan Bersih (Awal Bulan)'}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    summary.firstHalfNetIncome >= 0 ? styles.positiveValue : styles.negativeValue,
                    { color: summary.firstHalfNetIncome >= 0 ? themeColors.positive : themeColors.negative }
                  ]}
                >
                  {formatCurrency(summary.firstHalfNetIncome)}
                </Text>
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.summaryTitle, { color: themeColors.text }]}>{isDarkMode ? '📈 Pendapatan Bersih (Akhir Bulan)' : '📈 Pendapatan Bersih (Akhir Bulan)'}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    summary.secondHalfNetIncome >= 0 ? styles.positiveValue : styles.negativeValue,
                    { color: summary.secondHalfNetIncome >= 0 ? themeColors.positive : themeColors.negative }
                  ]}
                >
                  {formatCurrency(summary.secondHalfNetIncome)}
                </Text>
              </View>
            </View>
          </View>

          {/* Daily Accumulation Section */}
          <View style={styles.dailyAccumulationContainer}>
            <Text style={[styles.dailyAccumulationTitle, { color: themeColors.text }]}>{isDarkMode ? '📆 Ringkasan Harian' : '📆 Ringkasan Harian'}</Text>
            <View style={styles.dailyAccumulationList}>
              {Object.entries(summary.dailyAccumulation).length > 0 ? (
                Object.entries(summary.dailyAccumulation)
                  .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Sort by date
                  .map(([date, amount]) => {
                    const orderCount = summary.dailyOrderCounts[date] || 0;
                    return (
                      <View key={date} style={[styles.dailyItem, { backgroundColor: themeColors.cardBackground, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
                        <View style={styles.dailyItemHeader}>
                          <Text style={[styles.dailyDate, { color: themeColors.text }]}>{new Date(date).toLocaleDateString()}</Text>
                          <Text style={[styles.dailyAmount, { color: themeColors.positive }]}>{isDarkMode ? `💵 Rp ${amount.toLocaleString()}` : `💵 Rp ${amount.toLocaleString()}`}</Text>
                        </View>
                        <Text style={[styles.dailyCount, { color: themeColors.textSecondary }]}>{orderCount} pesanan</Text>
                      </View>
                    );
                  })
              ) : (
                <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>{isDarkMode ? 'Tidak ada pesanan bulan ini' : 'Tidak ada pesanan bulan ini'}</Text>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'orders' && <OrderTracker />}
      {activeTab === 'fuel' && <FuelExpenseTracker />}
      {activeTab === 'oil' && <OilChangeTracker />}
      {activeTab === 'settings' && (
        <View style={[styles.settingsTabContainer, { backgroundColor: themeColors.background, padding: 16 }]}>
          <Text style={[styles.settingsTabTitle, { color: themeColors.text }]}>{isDarkMode ? '⚙️ Pengaturan' : '⚙️ Pengaturan'}</Text>
          <View style={styles.settingsTabContent}>
            <View style={[styles.settingsContainer, { backgroundColor: themeColors.cardBackground, borderRadius: 12, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
              <View style={[styles.settingsHeader, { backgroundColor: themeColors.cardHeader }]}>
                <Text style={[styles.settingsTitle, { color: themeColors.text }]}>{isDarkMode ? '🌙 Mode Gelap' : '🌙 Mode Gelap'}</Text>
              </View>
              <View style={styles.settingsContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                  <TouchableOpacity
                    style={[styles.themeButton, userTheme === 'light' ? { backgroundColor: themeColors.primaryButton } : { backgroundColor: themeColors.cardHeader }]}
                    onPress={() => saveThemePreference('light')}
                  >
                    <Text style={{ color: userTheme === 'light' ? themeColors.buttonText : themeColors.text }}>{isDarkMode ? 'Terang' : 'Terang'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.themeButton, userTheme === 'dark' ? { backgroundColor: themeColors.primaryButton } : { backgroundColor: themeColors.cardHeader }]}
                    onPress={() => saveThemePreference('dark')}
                  >
                    <Text style={{ color: userTheme === 'dark' ? themeColors.buttonText : themeColors.text }}>{isDarkMode ? 'Gelap' : 'Gelap'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.themeButton, userTheme === 'system' ? { backgroundColor: themeColors.primaryButton } : { backgroundColor: themeColors.cardHeader }]}
                    onPress={() => saveThemePreference('system')}
                  >
                    <Text style={{ color: userTheme === 'system' ? themeColors.buttonText : themeColors.text }}>{isDarkMode ? 'Sistem' : 'Sistem'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressedButton, { backgroundColor: themeColors.dangerButton }]}
              onPress={resetAllData}
            >
              <Text style={[styles.resetButtonText, { color: themeColors.buttonText }]}>{isDarkMode ? '🗑️ Atur Ulang Semua Data' : '🗑️ Atur Ulang Semua Data'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

// Light theme colors
const lightTheme = {
  background: '#f0f2f5',
  header: '#2196F3',
  headerText: '#ffffff',
  tabBackground: '#f5f5f5',
  activeTabBackground: '#e3f2fd',
  activeTabText: '#2196F3',
  inactiveTabText: '#666666',
  text: '#333333',
  textSecondary: '#666666',
  primaryButton: '#2196F3',
  buttonText: '#ffffff',
  cardBackground: '#ffffff',
  cardHeader: '#f5f5f5',
  positive: '#4CAF50',
  negative: '#f44336',
  dangerButton: '#f44336',
  inputBackground: '#ffffff',
  borderColor: '#ddd',
  placeholderText: '#aaa',
  activeTabBorder: '#2196F3',
};

// Dark theme colors
const darkTheme = {
  background: '#121212',
  header: '#1976d2',
  headerText: '#ffffff',
  tabBackground: '#1e1e1e',
  activeTabBackground: '#2c2c2c',
  activeTabText: '#90caf9',
  inactiveTabText: '#b0b0b0',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  primaryButton: '#1976d2',
  buttonText: '#ffffff',
  cardBackground: '#1e1e1e',
  cardHeader: '#2c2c2c',
  positive: '#81c784',
  negative: '#e57373',
  dangerButton: '#d32f2f',
  inputBackground: '#2c2c2c',
  borderColor: '#555',
  placeholderText: '#aaa',
  activeTabBorder: '#90caf9',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  tabContainer: {
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabScrollView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  activeTab: {},
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {},
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonText: {
    fontWeight: '600',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
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
  },
  ordersCard: {},
  expensesCard: {},
  netIncomeCard: {},
  halfCard: {},
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  positiveValue: {},
  negativeValue: {},
  actionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  resetButtonText: {
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
  },
  dailyAccumulationList: {
    marginBottom: 16,
  },
  dailyItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
  },
  dailyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dailyCount: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  monthlySummaryContainer: {
    marginBottom: 24,
  },
  monthlySummaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  monthlyOrdersCard: {},
  monthlyExpensesCard: {},
  monthlyNetIncomeCard: {},
  settingsContainer: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsContent: {
    padding: 16,
  },
  settingsTabContainer: {
    flex: 1,
  },
  settingsTabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  settingsTabContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  themeButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
});

export default Dashboard;
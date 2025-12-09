import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Pressable, ScrollView, RefreshControl, Appearance } from 'react-native';
import { DataModel, Order } from '../models/DataModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OrderFormProps {
  onSubmit: (order: Omit<Order, 'id'>) => void;
  onCancel: () => void;
  order?: Order;
  isEditing?: boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, onCancel, order, isEditing = false }) => {
  const originalOrder = useRef(order); // Store the original order data
  const [pricePerItem, setPricePerItem] = useState<string>((order?.amount && order.quantity) ? (order.amount / order.quantity).toString() : '');
  const [quantity, setQuantity] = useState<string>(order?.quantity?.toString() || '');
  const [orderType, setOrderType] = useState<'Regular' | 'Paket'>(order?.orderType || 'Regular');
  const [amount, setAmount] = useState<string>(order?.amount.toString() || '');
  const [date, setDate] = useState<string>(order?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(order?.description || '');
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

  // Function to calculate total amount based on price per item and quantity
  const calculateTotal = (price: string, qty: string): string => {
    const priceNum = parseFloat(price);
    const qtyNum = parseInt(qty);
    if (!isNaN(priceNum) && !isNaN(qtyNum) && qtyNum > 0) {
      return (priceNum * qtyNum).toString();
    }
    return '';
  };

  // Update amount when pricePerItem or quantity changes
  useEffect(() => {
    if (pricePerItem && quantity) {
      const calculatedAmount = calculateTotal(pricePerItem, quantity);
      if (calculatedAmount) {
        setAmount(calculatedAmount);
      }
    }
  }, [pricePerItem, quantity]);

  // Reset date to today when switching to add mode (not edit mode)
  useEffect(() => {
    if (!isEditing && !order) {
      // Only reset date to today if we're adding a new order (not editing)
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isEditing, order]);

  // Load theme preference
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        const theme = savedTheme as 'light' | 'dark' | 'system';
        if (theme === 'system') {
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        } else {
          setIsDarkMode(theme === 'dark');
        }
      } else {
        // Default to system preference if no saved theme
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      }
    };

    loadTheme();

    // Listen for appearance changes
    const subscription = Appearance.addChangeListener(() => {
      const savedTheme = AsyncStorage.getItem('theme');
      savedTheme.then(theme => {
        if (theme) {
          const saved = theme as 'light' | 'dark' | 'system';
          if (saved === 'system') {
            setIsDarkMode(Appearance.getColorScheme() === 'dark');
          }
        } else {
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        }
      });
    });

    return () => subscription.remove();
  }, []);

  // Initialize form state when order changes
  useEffect(() => {
    if (order) {
      setQuantity(order.quantity?.toString() || '');
      setPricePerItem((order.quantity && order.amount) ? (order.amount / order.quantity).toString() : '');
      setOrderType(order.orderType || 'Regular');
      setAmount(order.amount.toString() || '');
      setDate(order.date || new Date().toISOString().split('T')[0]);
      setDescription(order.description || '');
    } else {
      // Reset to default values when creating new order
      setQuantity('');
      setPricePerItem('');
      setOrderType('Regular');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
  }, [order]);  // This should run when the order prop changes, which happens when editing

  const handleSubmit = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const orderData: Omit<Order, 'id'> = {
      amount: parseFloat(amount),
      quantity: quantity ? parseInt(quantity) : undefined,
      orderType,
      date,
      description
    };

    onSubmit(orderData);
  };


  // Get theme-appropriate colors
  const getThemeColors = () => {
    return isDarkMode ? darkTheme : lightTheme;
  };

  const themeColors = getThemeColors();

  return (
    <View style={[styles.formContainer, { backgroundColor: themeColors.cardBackground }]}>
      <Text style={[styles.label, { color: themeColors.text }]}>Harga per Item (Rp)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
        value={pricePerItem}
        onChangeText={setPricePerItem}
        placeholder="Masukkan harga per item"
        keyboardType="numeric"
        placeholderTextColor={themeColors.placeholderText}
      />

      <Text style={[styles.label, { color: themeColors.text }]}>Jumlah Item</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
        value={quantity}
        onChangeText={setQuantity}
        placeholder="Masukkan jumlah"
        keyboardType="numeric"
        placeholderTextColor={themeColors.placeholderText}
      />

      <Text style={[styles.label, { color: themeColors.text }]}>Total (Rp) - Dihitung Otomatis</Text>
      <TextInput
        style={[styles.input, styles.calculatedAmountInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
        value={amount}
        onChangeText={setAmount}
        placeholder="Total"
        keyboardType="numeric"
        editable={false}
        placeholderTextColor={themeColors.placeholderText}
      />

      <Text style={[styles.label, { color: themeColors.text }]}>Tanggal</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={themeColors.placeholderText}
      />

      <Text style={[styles.label, { color: themeColors.text }]}>Tipe Pesanan</Text>
      <View style={styles.orderTypeContainer}>
        <Pressable
          style={[
            styles.orderTypeButton,
            orderType === 'Regular' && styles.activeTypeButton,
            { backgroundColor: orderType === 'Regular' ? themeColors.primaryButton : themeColors.cardBackground }
          ]}
          onPress={() => setOrderType('Regular')}
        >
          <Text style={[
            styles.orderTypeText,
            { color: orderType === 'Regular' ? themeColors.buttonText : themeColors.text }
          ]}>Regular</Text>
        </Pressable>
        <Pressable
          style={[
            styles.orderTypeButton,
            orderType === 'Paket' && styles.activeTypeButton,
            { backgroundColor: orderType === 'Paket' ? themeColors.primaryButton : themeColors.cardBackground }
          ]}
          onPress={() => setOrderType('Paket')}
        >
          <Text style={[
            styles.orderTypeText,
            { color: orderType === 'Paket' ? themeColors.buttonText : themeColors.text }
          ]}>Paket</Text>
        </Pressable>
      </View>

      <Text style={[styles.label, { color: themeColors.text }]}>Deskripsi</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Masukkan deskripsi (opsional)"
        placeholderTextColor={themeColors.placeholderText}
      />

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.pressedButton, { backgroundColor: themeColors.positive }]}
          onPress={handleSubmit}
        >
          <Text style={[styles.submitButtonText, { color: themeColors.buttonText }]}>{isEditing ? "Perbarui" : "Tambah"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative }]}
          onPress={onCancel}
        >
          <Text style={[styles.cancelButtonText, { color: themeColors.buttonText }]} >Batal</Text>
        </Pressable>
      </View>
    </View>
  );
};

interface OrderItemProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onEdit, onDelete }) => {
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

  // Load theme preference
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        const theme = savedTheme as 'light' | 'dark' | 'system';
        if (theme === 'system') {
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        } else {
          setIsDarkMode(theme === 'dark');
        }
      } else {
        // Default to system preference if no saved theme
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      }
    };

    loadTheme();

    // Listen for appearance changes
    const subscription = Appearance.addChangeListener(() => {
      const savedTheme = AsyncStorage.getItem('theme');
      savedTheme.then(theme => {
        if (theme) {
          const saved = theme as 'light' | 'dark' | 'system';
          if (saved === 'system') {
            setIsDarkMode(Appearance.getColorScheme() === 'dark');
          }
        } else {
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        }
      });
    });

    return () => subscription.remove();
  }, []);

  // Get theme-appropriate colors
  const getThemeColors = () => {
    return isDarkMode ? darkTheme : lightTheme;
  };

  const themeColors = getThemeColors();

  return (
    <View style={[styles.itemContainer, { backgroundColor: themeColors.cardBackground }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemDate, { color: themeColors.text }]}>{new Date(order.date).toLocaleDateString()}</Text>
        <Text style={[styles.itemAmount, { color: themeColors.positive }]}>Rp {order.amount.toLocaleString()}</Text>
      </View>
      {order.quantity && (
        <View style={styles.itemDetails}>
          <Text style={[styles.itemDetail, { color: themeColors.textSecondary }]}>
            Jumlah: {order.quantity} {order.pricePerItem ? `@ Rp ${order.pricePerItem.toLocaleString()}/item` : ''}
          </Text>
          {order.orderType && (
            <Text style={[
              styles.itemType,
              {
                color: order.orderType === 'Paket' ? themeColors.positive : themeColors.textSecondary,
                fontWeight: '600',
                fontSize: 12
              }
            ]}>
              {order.orderType}
            </Text>
          )}
        </View>
      )}
      {order.description ? <Text style={[styles.itemDescription, { color: themeColors.textSecondary }]}>{order.description}</Text> : null}
      <View style={styles.itemActions}>
        <Pressable onPress={() => onEdit(order)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}>
          <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(order.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative }]}>
          <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>Hapus</Text>
        </Pressable>
      </View>
    </View>
  );
};

// Helper function to determine which period an order belongs to
// Returns a string in format YYYY-MM-DD1-DD2 (e.g. "2023-12-1-15" or "2023-12-16-30")
const getOrderPeriod = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();

  if (day <= 15) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-1-15`;
  } else {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-16-30`;
  }
};

// Helper function to format period for display
const formatPeriod = (periodString: string) => {
  const [year, month, startDay, endDay] = periodString.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return `${startDay} - ${endDay} ${monthNames[parseInt(month) - 1]} ${year}`;
};

export const OrderTracker: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  // State for period selection
  const [periodMode, setPeriodMode] = useState<'monthly' | 'semiMonthly'>('monthly');

  useEffect(() => {
    loadOrders();

    // Load theme preference
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        const theme = savedTheme as 'light' | 'dark' | 'system';
        if (theme === 'system') {
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        } else {
          setIsDarkMode(theme === 'dark');
        }
      } else {
        // Default to system preference if no saved theme
        setIsDarkMode(Appearance.getColorScheme() === 'dark');
      }
    };

    loadTheme();

    // Listen for appearance changes
    const subscription = Appearance.addChangeListener(() => {
      const savedTheme = AsyncStorage.getItem('theme');
      savedTheme.then(theme => {
        if (theme) {
          const saved = theme as 'light' | 'dark' | 'system';
          if (saved === 'system') {
            setIsDarkMode(Appearance.getColorScheme() === 'dark');
          }
        } else {
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        }
      });
    });

    return () => subscription.remove();
  }, []);

  const loadOrders = async () => {
    const loadedOrders = await DataModel.getOrders();
    setOrders(loadedOrders);
  };

  const handleAddOrder = async (orderData: Omit<Order, 'id'>) => {
    await DataModel.addOrder(orderData);
    loadOrders();
    setShowForm(false);
  };

  const handleUpdateOrder = async (orderData: Omit<Order, 'id'>) => {
    if (!editingOrder) return; // Safety check
    const updatedOrder: Order = {
      ...editingOrder,  // Preserve the original order's id
      ...orderData      // Override with new values
    };
    await DataModel.updateOrder(updatedOrder);
    loadOrders();
    setEditingOrder(null);
    setShowForm(false);
  };

  const handleDeleteOrder = async (id: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus pesanan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await DataModel.deleteOrder(id);
            loadOrders();
          }
        }
      ]
    );
  };

  // Filter orders based on search text and period
  const filteredOrders = orders.filter(order =>
    (order.description || '').toLowerCase().includes(searchText.toLowerCase()) ||
    order.amount.toString().includes(searchText) ||
    new Date(order.date).toLocaleDateString().includes(searchText)
  );

  // Helper function to group orders by date within each period
  const groupOrdersByDate = (orders: Order[]) => {
    return orders.reduce((acc: { [key: string]: Order[] }, order) => {
      const date = order.date; // Format: YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(order);
      return acc;
    }, {});
  };

  // Organize orders by period based on the selected mode
  const ordersByPeriod = periodMode === 'semiMonthly'
    ? filteredOrders.reduce((acc: { [key: string]: Order[] }, order) => {
        const period = getOrderPeriod(order.date);
        if (!acc[period]) {
          acc[period] = [];
        }
        acc[period].push(order);
        return acc;
      }, {})
    : filteredOrders.reduce((acc: { [key: string]: Order[] }, order) => {
        const period = `${order.date.substring(0, 7)}`; // Year-Month format
        if (!acc[period]) {
          acc[period] = [];
        }
        acc[period].push(order);
        return acc;
      }, {});

  // Group orders by date within each period
  const ordersByPeriodAndDate: { [key: string]: { [key: string]: Order[] } } = {};
  Object.entries(ordersByPeriod).forEach(([period, periodOrders]) => {
    ordersByPeriodAndDate[period] = groupOrdersByDate(periodOrders);
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Get theme-appropriate colors
  const getThemeColors = () => {
    return isDarkMode ? darkTheme : lightTheme;
  };

  const themeColors = getThemeColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[themeColors.activeTabBorder]}
          progressBackgroundColor={themeColors.background}
        />
      }
    >
      <Text style={[styles.title, { color: themeColors.text }]}>Pelacak Pesanan</Text>

      {/* Period Toggle Section */}
      <View style={styles.switchContainer}>
        <Text style={[styles.label, { color: themeColors.text, textAlign: 'center', marginBottom: 8 }]}>Pilih Mode Periode</Text>
        <View style={[styles.switchOptionContainer, { backgroundColor: themeColors.cardBackground }]}>
          <Pressable
            style={[
              styles.switchOption,
              periodMode === 'monthly' && styles.activeSwitchOption,
              { backgroundColor: periodMode === 'monthly' ? themeColors.primaryButton : 'transparent' }
            ]}
            onPress={() => setPeriodMode('monthly')}
          >
            <Text style={[
              styles.switchText,
              { color: periodMode === 'monthly' ? themeColors.buttonText : themeColors.text },
              periodMode === 'monthly' && styles.activeSwitchText
            ]}>Bulanan</Text>
          </Pressable>
          <Pressable
            style={[
              styles.switchOption,
              periodMode === 'semiMonthly' && styles.activeSwitchOption,
              { backgroundColor: periodMode === 'semiMonthly' ? themeColors.primaryButton : 'transparent' }
            ]}
            onPress={() => setPeriodMode('semiMonthly')}
          >
            <Text style={[
              styles.switchText,
              { color: periodMode === 'semiMonthly' ? themeColors.buttonText : themeColors.text },
              periodMode === 'semiMonthly' && styles.activeSwitchText
            ]}>Mingguan (1-15 & 16-30)</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
            placeholder="Cari pesanan..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={themeColors.placeholderText}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}
          onPress={() => {
            setShowForm(!showForm);
            setEditingOrder(null);
          }}
        >
          <Text style={[styles.addButtonText, { color: themeColors.buttonText }]}>{showForm ? "Batal" : "Tambah Pesanan"}</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={styles.formSection}>
          <OrderForm
            onSubmit={editingOrder ? handleUpdateOrder : handleAddOrder}
            onCancel={() => {
              setShowForm(false);
              setEditingOrder(null);
            }}
            order={editingOrder || undefined}
            isEditing={!!editingOrder}
          />
        </View>
      )}

      {/* Conditional rendering based on period mode */}
      {Object.keys(ordersByPeriod).length === 0 ? (
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Tidak ada pesanan ditemukan</Text>
      ) : (
        Object.entries(ordersByPeriodAndDate).map(([period, ordersByDate]) => {
          // Calculate overall stats for the period
          const periodOrders = Object.values(ordersByDate).flat();
          const totalAmount = periodOrders.reduce((sum, order) => sum + order.amount, 0);
          const avgAmount = periodOrders.length > 0 ? totalAmount / periodOrders.length : 0;
          const totalQty = periodOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
          const avgQty = periodOrders.length > 0 ? totalQty / periodOrders.length : 0;

          return (
            <View key={period} style={styles.periodSection}>
              <View style={[styles.cardHeader, { backgroundColor: themeColors.cardHeader }]}>
                <View style={styles.headerInfo}>
                  <Text style={[styles.periodTitle, { color: themeColors.text }]}>
                    {periodMode === 'semiMonthly' ? formatPeriod(period) :
                      new Date(period + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={[styles.periodStats, { color: themeColors.textSecondary }]}>
                    {periodOrders.length} pesanan • Rata-rata: Rp {avgAmount.toLocaleString('id-ID')}
                  </Text>
                  {totalQty > 0 && (
                    <Text style={[styles.periodStats, { color: themeColors.textSecondary }]}>
                      Jumlah barang: {totalQty} • Rata-rata: {avgQty.toFixed(1)}/pesanan
                    </Text>
                  )}
                </View>
                <Text style={[styles.periodTotal, { color: themeColors.positive }]}>
                  Total: Rp {totalAmount.toLocaleString('id-ID')}
                </Text>
              </View>

              <View style={styles.ordersContainer}>
                {/* Group orders by date within the period */}
                {Object.entries(ordersByDate).map(([date, dateOrders]) => {
                  // Calculate stats for this date
                  const dateTotalAmount = dateOrders.reduce((sum, order) => sum + order.amount, 0);
                  const dateTotalQty = dateOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);

                  return (
                    <View key={date} style={styles.dateGroup}>
                      <View style={[styles.dateHeader, { backgroundColor: themeColors.cardHeader }]}>
                        <Text style={[styles.dateTitle, { color: themeColors.text }]}>
                          {new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                        <View style={styles.dateStats}>
                          <Text style={[styles.dateAmount, { color: themeColors.positive }]}>
                            Rp {dateTotalAmount.toLocaleString('id-ID')}
                          </Text>
                          {dateTotalQty > 0 && (
                            <Text style={[styles.dateQty, { color: themeColors.textSecondary }]}>
                              ({dateTotalQty} barang)
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.dateOrdersContainer}>
                        {dateOrders.map((order) => (
                          <OrderItem
                            key={order.id}
                            order={order}
                            onEdit={(order) => {
                              setEditingOrder(order);
                              setShowForm(true);
                            }}
                            onDelete={handleDeleteOrder}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Add extra padding at the bottom to ensure content is not hidden
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  formContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  itemContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    padding: 32,
    fontSize: 16,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  calculatedAmountInput: {},
  switchContainer: {
    marginBottom: 16,
  },
  switchOptionContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginTop: 8,
  },
  switchOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSwitchOption: {},
  switchText: {
    fontWeight: '600',
  },
  activeSwitchText: {},
  formSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  flatListContent: {
    paddingBottom: 16,
  },
  itemDetails: {
    marginTop: 8,
  },
  itemDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  pressedButton: {
    opacity: 0.7,
  },
  periodSection: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  periodTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  periodStats: {
    fontSize: 12,
    marginTop: 4,
  },
  ordersContainer: {
    padding: 8,
  },
  dateGroup: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateStats: {
    alignItems: 'flex-end',
  },
  dateAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateQty: {
    fontSize: 12,
    marginTop: 2,
  },
  dateOrdersContainer: {
    padding: 4,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeTypeButton: {
    backgroundColor: '#2196F3',
  },
  orderTypeText: {
    fontWeight: '600',
    fontSize: 16,
  },
  itemType: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
});
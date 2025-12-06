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
  const [amount, setAmount] = useState<string>(order?.amount.toString() || '');
  const [quantity, setQuantity] = useState<string>(order?.quantity?.toString() || '');
  const [pricePerItem, setPricePerItem] = useState<string>(order?.pricePerItem?.toString() || '');
  const [date, setDate] = useState<string>(order?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(order?.description || '');
  const [useFixedPrice, setUseFixedPrice] = useState<boolean>(!!order?.quantity); // Use fixed price if quantity exists
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

  // Update amount when quantity or price changes (only when using fixed price)
  useEffect(() => {
    if (useFixedPrice && quantity && pricePerItem) {
      const qty = parseInt(quantity, 10);
      const price = parseFloat(pricePerItem);
      if (!isNaN(qty) && !isNaN(price)) {
        setAmount((qty * price).toString());
      }
    } else if (!useFixedPrice) {
      // When switching to custom price mode, clear quantity and pricePerItem
      // but preserve the amount value
      setQuantity('');
      setPricePerItem('');
    }
  }, [quantity, pricePerItem, useFixedPrice]);

  // Initialize form state when order changes
  useEffect(() => {
    if (order) {
      setAmount(order.amount.toString());
      setQuantity(order.quantity?.toString() || '');
      setPricePerItem(order.pricePerItem?.toString() || '');
      setDate(order.date || new Date().toISOString().split('T')[0]);
      setDescription(order.description || '');
      setUseFixedPrice(!!order.quantity);
    } else {
      // Reset to default values when creating new order
      setAmount('');
      setQuantity('');
      setPricePerItem('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setUseFixedPrice(false);
    }
  }, [order]);  // This should run when the order prop changes, which happens when editing

  const handleSubmit = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    let finalQuantity: number | undefined = undefined;
    let finalPricePerItem: number | undefined = undefined;
    let finalAmount: number = parseFloat(amount);

    if (useFixedPrice) {
      finalQuantity = quantity && !isNaN(parseInt(quantity, 10)) ? parseInt(quantity, 10) : undefined;
      finalPricePerItem = pricePerItem && !isNaN(parseFloat(pricePerItem)) ? parseFloat(pricePerItem) : undefined;

      // If both quantity and price per item are provided, use their product as amount
      if (finalQuantity !== undefined && finalPricePerItem !== undefined) {
        finalAmount = finalQuantity * finalPricePerItem;
      }
    }

    const orderData: Omit<Order, 'id'> = {
      amount: finalAmount,
      quantity: finalQuantity,
      pricePerItem: finalPricePerItem,
      date,
      description
    };

    onSubmit(orderData);
  };

  const handleQuantityChange = (text: string) => {
    setQuantity(text);
    // Automatically calculate amount when in fixed price mode
    if (useFixedPrice) {
      const qty = text ? parseInt(text, 10) : NaN;
      const price = pricePerItem ? parseFloat(pricePerItem) : NaN;
      if (!isNaN(qty) && !isNaN(price) && qty >= 0 && price >= 0) {
        const calculatedAmount = (qty * price).toString();
        setAmount(calculatedAmount);
      }
    }
  };

  const handlePricePerItemChange = (text: string) => {
    setPricePerItem(text);
    // Automatically calculate amount when in fixed price mode
    if (useFixedPrice) {
      const qty = quantity ? parseInt(quantity, 10) : NaN;
      const price = text ? parseFloat(text) : NaN;
      if (!isNaN(qty) && !isNaN(price) && qty >= 0 && price >= 0) {
        const calculatedAmount = (qty * price).toString();
        setAmount(calculatedAmount);
      }
    }
  };

  // Get theme-appropriate colors
  const getThemeColors = () => {
    return isDarkMode ? darkTheme : lightTheme;
  };

  const themeColors = getThemeColors();

  return (
    <View style={[styles.formContainer, { backgroundColor: themeColors.cardBackground }]}>
      <View style={styles.switchContainer}>
        <Text style={[styles.label, { color: themeColors.text }]}>Tipe Pesanan:</Text>
        <View style={[styles.switchOptionContainer, { backgroundColor: themeColors.cardHeader }]}>
          <Pressable
            style={[styles.switchOption, !useFixedPrice && styles.activeSwitchOption, { backgroundColor: !useFixedPrice ? themeColors.activeTabBackground : themeColors.cardBackground }]}
            onPress={() => {
              setUseFixedPrice(false);
              // When switching to custom, clear the fixed price fields but preserve the current amount
              setQuantity('');
              setPricePerItem('');
            }}
          >
            <Text style={[styles.switchText, !useFixedPrice && styles.activeSwitchText, { color: !useFixedPrice ? themeColors.activeTabText : themeColors.text }]}>Harga Kustom</Text>
          </Pressable>
          <Pressable
            style={[styles.switchOption, useFixedPrice && styles.activeSwitchOption, { backgroundColor: useFixedPrice ? themeColors.activeTabBackground : themeColors.cardBackground }]}
            onPress={() => {
              setUseFixedPrice(true);
              // When switching to fixed price mode,
              // set the current amount as pricePerItem and quantity as 1 if no existing values
              if (!quantity && !pricePerItem && amount && parseFloat(amount) > 0) {
                setPricePerItem(amount);
                setQuantity('1');
              }
            }}
          >
            <Text style={[styles.switchText, useFixedPrice && styles.activeSwitchText, { color: useFixedPrice ? themeColors.activeTabText : themeColors.text }]}>Harga Tetap + Jumlah</Text>
          </Pressable>
        </View>
      </View>

      {useFixedPrice ? (
        <>
          <Text style={[styles.label, { color: themeColors.text }]}>Harga Per Item (Rp)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
            value={pricePerItem}
            onChangeText={handlePricePerItemChange}
            placeholder="Masukkan harga per item"
            keyboardType="numeric"
            placeholderTextColor={themeColors.placeholderText}
          />

          <Text style={[styles.label, { color: themeColors.text }]}>Jumlah</Text>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
            value={quantity}
            onChangeText={handleQuantityChange}
            placeholder="Masukkan jumlah"
            keyboardType="numeric"
            placeholderTextColor={themeColors.placeholderText}
          />

          <Text style={[styles.label, { color: themeColors.text }]}>Total (Rp) - Dihitung</Text>
          <TextInput
            style={[styles.input, styles.calculatedAmountInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Total"
            keyboardType="numeric"
            editable={false}
            placeholderTextColor={themeColors.placeholderText}
          />
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: themeColors.text }]}>Total (Rp)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Masukkan total"
            keyboardType="numeric"
            placeholderTextColor={themeColors.placeholderText}
          />
        </>
      )}

      <Text style={[styles.label, { color: themeColors.text }]}>Tanggal</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={themeColors.placeholderText}
      />

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
      {order.quantity && order.pricePerItem ? (
        <View style={styles.itemDetails}>
          <Text style={[styles.itemDetail, { color: themeColors.textSecondary }]}>Qty: {order.quantity} × Rp {order.pricePerItem.toLocaleString()}</Text>
        </View>
      ) : null}
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

export const OrderTracker: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

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

  const filteredOrders = orders.filter(order =>
    order.description.toLowerCase().includes(searchText.toLowerCase()) ||
    order.amount.toString().includes(searchText) ||
    new Date(order.date).toLocaleDateString().includes(searchText)
  );

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

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderItem
            order={item}
            onEdit={(order) => {
              setEditingOrder(order);
              setShowForm(true);
            }}
            onDelete={handleDeleteOrder}
          />
        )}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Tidak ada pesanan ditemukan</Text>}
        scrollEnabled={false} // Disable FlatList scroll since parent ScrollView handles it
        contentContainerStyle={styles.flatListContent}
      />
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
});
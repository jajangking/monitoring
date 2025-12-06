import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Pressable, ScrollView, RefreshControl } from 'react-native';
import { DataModel, Order } from '../models/DataModel';

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

  return (
    <View style={styles.formContainer}>
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Order Type:</Text>
        <View style={styles.switchOptionContainer}>
          <Pressable
            style={[styles.switchOption, !useFixedPrice && styles.activeSwitchOption]}
            onPress={() => {
              setUseFixedPrice(false);
              // When switching to custom, clear the fixed price fields but preserve the current amount
              setQuantity('');
              setPricePerItem('');
            }}
          >
            <Text style={[styles.switchText, !useFixedPrice && styles.activeSwitchText]}>Custom Price</Text>
          </Pressable>
          <Pressable
            style={[styles.switchOption, useFixedPrice && styles.activeSwitchOption]}
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
            <Text style={[styles.switchText, useFixedPrice && styles.activeSwitchText]}>Fixed Price + Qty</Text>
          </Pressable>
        </View>
      </View>

      {useFixedPrice ? (
        <>
          <Text style={styles.label}>Price Per Item (Rp)</Text>
          <TextInput
            style={styles.input}
            value={pricePerItem}
            onChangeText={handlePricePerItemChange}
            placeholder="Enter price per item"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={handleQuantityChange}
            placeholder="Enter quantity"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Total Amount (Rp) - Calculated</Text>
          <TextInput
            style={[styles.input, styles.calculatedAmountInput]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Total amount"
            keyboardType="numeric"
            editable={false}
            placeholderTextColor="#aaa"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Total Amount (Rp)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter total amount"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />
        </>
      )}

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description (optional)"
        placeholderTextColor="#aaa"
      />

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.pressedButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>{isEditing ? "Update" : "Add"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemDate}>{new Date(order.date).toLocaleDateString()}</Text>
        <Text style={styles.itemAmount}>Rp {order.amount.toLocaleString()}</Text>
      </View>
      {order.quantity && order.pricePerItem ? (
        <View style={styles.itemDetails}>
          <Text style={styles.itemDetail}>Qty: {order.quantity} × Rp {order.pricePerItem.toLocaleString()}</Text>
        </View>
      ) : null}
      {order.description ? <Text style={styles.itemDescription}>{order.description}</Text> : null}
      <View style={styles.itemActions}>
        <Pressable onPress={() => onEdit(order)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressedButton]}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(order.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton]}>
          <Text style={styles.actionButtonText}>Delete</Text>
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

  useEffect(() => {
    loadOrders();
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
      'Confirm Delete',
      'Are you sure you want to delete this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Order Tracker</Text>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#aaa"
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton]}
          onPress={() => {
            setShowForm(!showForm);
            setEditingOrder(null);
          }}
        >
          <Text style={styles.addButtonText}>{showForm ? "Cancel" : "Add Order"}</Text>
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
        ListEmptyComponent={<Text style={styles.emptyText}>No orders found</Text>}
        scrollEnabled={false} // Disable FlatList scroll since parent ScrollView handles it
        contentContainerStyle={styles.flatListContent}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: '#333',
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
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
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
    color: '#333',
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderColor: '#ddd',
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
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
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
    color: '#555',
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    padding: 32,
    fontSize: 16,
    color: '#999',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  calculatedAmountInput: {
    backgroundColor: '#f0f0f0',
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchOptionContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
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
  activeSwitchOption: {
    backgroundColor: '#2196F3',
  },
  switchText: {
    color: '#666',
    fontWeight: '600',
  },
  activeSwitchText: {
    color: '#fff',
  },
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
    color: '#666',
    marginBottom: 4,
  },
  pressedButton: {
    opacity: 0.7,
  },
});
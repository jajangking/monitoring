import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Pressable, ScrollView, RefreshControl } from 'react-native';
import { DataModel, FuelExpense } from '../models/DataModel';

interface FuelExpenseFormProps {
  onSubmit: (expense: Omit<FuelExpense, 'id'>) => void;
  onCancel: () => void;
  expense?: FuelExpense;
  isEditing?: boolean;
}

export const FuelExpenseForm: React.FC<FuelExpenseFormProps> = ({ onSubmit, onCancel, expense, isEditing = false }) => {
  const [amount, setAmount] = useState<string>(expense?.amount.toString() || '');
  const [date, setDate] = useState<string>(expense?.date || new Date().toISOString().split('T')[0]);
  const [liters, setLiters] = useState<string>(expense?.liters?.toString() || '');
  const [description, setDescription] = useState<string>(expense?.description || '');

  const handleSubmit = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    onSubmit({
      amount: parseFloat(amount),
      date,
      liters: liters ? parseFloat(liters) : undefined,
      description
    });
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>Amount (Rp)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter amount spent"
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Liters</Text>
      <TextInput
        style={styles.input}
        value={liters}
        onChangeText={setLiters}
        placeholder="Enter liters (optional)"
        keyboardType="decimal-pad"
        placeholderTextColor="#aaa"
      />

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

interface FuelExpenseItemProps {
  expense: FuelExpense;
  onEdit: (expense: FuelExpense) => void;
  onDelete: (id: string) => void;
}

const FuelExpenseItem: React.FC<FuelExpenseItemProps> = ({ expense, onEdit, onDelete }) => {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemDate}>{new Date(expense.date).toLocaleDateString()}</Text>
        <Text style={styles.itemAmount}>Rp {expense.amount.toLocaleString()}</Text>
      </View>
      {expense.liters ? <Text style={styles.itemDetail}>Liters: {expense.liters}L</Text> : null}
      {expense.description ? <Text style={styles.itemDescription}>{expense.description}</Text> : null}
      <View style={styles.itemActions}>
        <Pressable onPress={() => onEdit(expense)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressedButton]}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(expense.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton]}>
          <Text style={styles.actionButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const FuelExpenseTracker: React.FC = () => {
  const [expenses, setExpenses] = useState<FuelExpense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FuelExpense | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const loadedExpenses = await DataModel.getFuelExpenses();
    setExpenses(loadedExpenses);
  };

  const handleAddExpense = async (expenseData: Omit<FuelExpense, 'id'>) => {
    await DataModel.addFuelExpense(expenseData);
    loadExpenses();
    setShowForm(false);
  };

  const handleUpdateExpense = async (expenseData: Omit<FuelExpense, 'id'>) => {
    if (!editingExpense) return; // Safety check
    const updatedExpense: FuelExpense = {
      ...editingExpense,  // Preserve the original expense's id
      ...expenseData      // Override with new values
    };
    await DataModel.updateFuelExpense(updatedExpense);
    loadExpenses();
    setEditingExpense(null);
    setShowForm(false);
  };

  const handleDeleteExpense = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this fuel expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await DataModel.deleteFuelExpense(id);
            loadExpenses();
          }
        }
      ]
    );
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchText.toLowerCase()) ||
    expense.amount.toString().includes(searchText) ||
    expense.liters?.toString().includes(searchText) ||
    new Date(expense.date).toLocaleDateString().includes(searchText)
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
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
      <Text style={styles.title}>Fuel Expense Tracker</Text>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#aaa"
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton]}
          onPress={() => {
            setShowForm(!showForm);
            setEditingExpense(null);
          }}
        >
          <Text style={styles.addButtonText}>{showForm ? "Cancel" : "Add Expense"}</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={styles.formSection}>
          <FuelExpenseForm
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            onCancel={() => {
              setShowForm(false);
              setEditingExpense(null);
            }}
            expense={editingExpense || undefined}
            isEditing={!!editingExpense}
          />
        </View>
      )}

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FuelExpenseItem
            expense={item}
            onEdit={(expense) => {
              setEditingExpense(expense);
              setShowForm(true);
            }}
            onDelete={handleDeleteExpense}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No fuel expenses found</Text>}
        scrollEnabled={false} // Disable FlatList scroll since parent ScrollView handles it
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
    color: '#f44336',
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  formSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  pressedButton: {
    opacity: 0.7,
  },
});
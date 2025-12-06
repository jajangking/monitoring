import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Pressable, ScrollView, RefreshControl } from 'react-native';
import { DataModel, OilChange } from '../models/DataModel';

interface OilChangeFormProps {
  onSubmit: (change: Omit<OilChange, 'id'>) => void;
  onCancel: () => void;
  change?: OilChange;
  isEditing?: boolean;
}

export const OilChangeForm: React.FC<OilChangeFormProps> = ({ onSubmit, onCancel, change, isEditing = false }) => {
  const [amount, setAmount] = useState<string>(change?.amount.toString() || '');
  const [date, setDate] = useState<string>(change?.date || new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState<string>(change?.mileage?.toString() || '');
  const [description, setDescription] = useState<string>(change?.description || '');

  const handleSubmit = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    onSubmit({
      amount: parseFloat(amount),
      date,
      mileage: mileage ? parseFloat(mileage) : undefined,
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

      <Text style={styles.label}>Mileage (km)</Text>
      <TextInput
        style={styles.input}
        value={mileage}
        onChangeText={setMileage}
        placeholder="Enter mileage (optional)"
        keyboardType="numeric"
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

interface OilChangeItemProps {
  change: OilChange;
  onEdit: (change: OilChange) => void;
  onDelete: (id: string) => void;
}

const OilChangeItem: React.FC<OilChangeItemProps> = ({ change, onEdit, onDelete }) => {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemDate}>{new Date(change.date).toLocaleDateString()}</Text>
        <Text style={styles.itemAmount}>Rp {change.amount.toLocaleString()}</Text>
      </View>
      {change.mileage ? <Text style={styles.itemDetail}>Mileage: {change.mileage}km</Text> : null}
      {change.description ? <Text style={styles.itemDescription}>{change.description}</Text> : null}
      <View style={styles.itemActions}>
        <Pressable onPress={() => onEdit(change)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressedButton]}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(change.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton]}>
          <Text style={styles.actionButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const OilChangeTracker: React.FC = () => {
  const [changes, setChanges] = useState<OilChange[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingChange, setEditingChange] = useState<OilChange | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadChanges();
  }, []);

  const loadChanges = async () => {
    const loadedChanges = await DataModel.getOilChanges();
    setChanges(loadedChanges);
  };

  const handleAddChange = async (changeData: Omit<OilChange, 'id'>) => {
    await DataModel.addOilChange(changeData);
    loadChanges();
    setShowForm(false);
  };

  const handleUpdateChange = async (changeData: Omit<OilChange, 'id'>) => {
    if (!editingChange) return; // Safety check
    const updatedChange: OilChange = {
      ...editingChange,  // Preserve the original change's id
      ...changeData      // Override with new values
    };
    await DataModel.updateOilChange(updatedChange);
    loadChanges();
    setEditingChange(null);
    setShowForm(false);
  };

  const handleDeleteChange = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this oil change?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await DataModel.deleteOilChange(id);
            loadChanges();
          }
        }
      ]
    );
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChanges();
    setRefreshing(false);
  };

  const filteredChanges = changes.filter(change =>
    change.description.toLowerCase().includes(searchText.toLowerCase()) ||
    change.amount.toString().includes(searchText) ||
    change.mileage?.toString().includes(searchText) ||
    new Date(change.date).toLocaleDateString().includes(searchText)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Oil Change Tracker</Text>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search oil changes..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#aaa"
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton]}
          onPress={() => {
            setShowForm(!showForm);
            setEditingChange(null);
          }}
        >
          <Text style={styles.addButtonText}>{showForm ? "Cancel" : "Add Oil Change"}</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={styles.formSection}>
          <OilChangeForm
            onSubmit={editingChange ? handleUpdateChange : handleAddChange}
            onCancel={() => {
              setShowForm(false);
              setEditingChange(null);
            }}
            change={editingChange || undefined}
            isEditing={!!editingChange}
          />
        </View>
      )}

      <FlatList
        data={filteredChanges}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OilChangeItem
            change={item}
            onEdit={(change) => {
              setEditingChange(change);
              setShowForm(true);
            }}
            onDelete={handleDeleteChange}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No oil changes found</Text>}
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
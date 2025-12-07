import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Pressable, ScrollView, RefreshControl, Appearance } from 'react-native';
import { DataModel, OilChange } from '../models/DataModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Get theme-appropriate colors
  const getThemeColors = () => {
    return isDarkMode ? darkTheme : lightTheme;
  };

  const themeColors = getThemeColors();

  return (
    <View style={[styles.formContainer, { backgroundColor: themeColors.cardBackground }]}>
      <Text style={[styles.label, { color: themeColors.text }]}>Jumlah (Rp)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
        value={amount}
        onChangeText={setAmount}
        placeholder="Masukkan jumlah pengeluaran"
        keyboardType="numeric"
        placeholderTextColor={themeColors.placeholderText}
      />

      <Text style={[styles.label, { color: themeColors.text }]}>Jarak Tempuh (km)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
        value={mileage}
        onChangeText={setMileage}
        placeholder="Masukkan jarak tempuh (opsional)"
        keyboardType="numeric"
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
          <Text style={styles.submitButtonText}>{isEditing ? "Perbarui" : "Tambah"}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative }]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
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
        <Text style={[styles.itemDate, { color: themeColors.text }]}>{new Date(change.date).toLocaleDateString()}</Text>
        <Text style={[styles.itemAmount, { color: themeColors.negative }]}>Rp {change.amount.toLocaleString()}</Text>
      </View>
      {change.mileage ? <Text style={[styles.itemDetail, { color: themeColors.textSecondary }]}>Jarak Tempuh: {change.mileage}km</Text> : null}
      {change.description ? <Text style={[styles.itemDescription, { color: themeColors.textSecondary }]}>{change.description}</Text> : null}
      <View style={styles.itemActions}>
        <Pressable onPress={() => onEdit(change)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(change.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative }]}>
          <Text style={styles.actionButtonText}>Hapus</Text>
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
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    loadChanges();

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
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus penggantian oli ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
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
    (change.description || '').toLowerCase().includes(searchText.toLowerCase()) ||
    change.amount.toString().includes(searchText) ||
    change.mileage?.toString().includes(searchText) ||
    new Date(change.date).toLocaleDateString().includes(searchText)
  );

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
      <Text style={[styles.title, { color: themeColors.text }]}>Pelacak Penggantian Oli</Text>

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
            placeholder="Cari penggantian oli..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={themeColors.placeholderText}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}
          onPress={() => {
            setShowForm(!showForm);
            setEditingChange(null);
          }}
        >
          <Text style={styles.addButtonText}>{showForm ? "Batal" : "Tambah Penggantian Oli"}</Text>
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
        ListEmptyComponent={<Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Tidak ada penggantian oli ditemukan</Text>}
        scrollEnabled={false} // Disable FlatList scroll since parent ScrollView handles it
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
    color: '#060621',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#ffffff',
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
  itemDetail: {
    fontSize: 14,
    marginBottom: 4,
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
    color: '#ffffff',
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
    color: '#060621',
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
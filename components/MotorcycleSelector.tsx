import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable,
  Appearance,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataModel, Motorcycle } from '../models/DataModel';

interface MotorcycleSelectorProps {
  onMotorcycleSelect: (motorcycle: Motorcycle | null) => void;
  selectedMotorcycleId: string | null;
}

export const MotorcycleSelector: React.FC<MotorcycleSelectorProps> = ({
  onMotorcycleSelect,
  selectedMotorcycleId,
}) => {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  
  // Form fields for adding/editing motorcycles
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [description, setDescription] = useState('');
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(null);

  useEffect(() => {
    loadMotorcycles();
    loadThemePreference();

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

  // Load theme preference
  const loadThemePreference = async () => {
    try {
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
    } catch (error) {
      console.error('Kesalahan saat memuat preferensi tema:', error);
    }
  };

  // Load motorcycles data from database
  const loadMotorcycles = async () => {
    try {
      const motorcycleData = await DataModel.getMotorcycles();
      setMotorcycles(motorcycleData);
    } catch (error) {
      console.error('Error loading motorcycles:', error);
      setMotorcycles([]);
    }
  };

  // Function to select a motorcycle
  const handleSelectMotorcycle = (motorcycle: Motorcycle) => {
    onMotorcycleSelect(motorcycle);
    setShowModal(false);
  };

  // Function to select no motorcycle (show all)
  const handleSelectAllMotorcycles = () => {
    onMotorcycleSelect(null);
    setShowModal(false);
  };

  // Function to reset form
  const resetForm = () => {
    setName('');
    setBrand('');
    setModel('');
    setYear('');
    setLicensePlate('');
    setDescription('');
    setEditingMotorcycle(null);
    setShowForm(false);
  };

  // Function to add or update a motorcycle
  const handleAddUpdateMotorcycle = async () => {
    if (!name) {
      Alert.alert('Error', 'Silakan masukkan nama motor');
      return;
    }

    try {
      const motorcycleData = {
        name,
        brand: brand || undefined,
        model: model || undefined,
        year: year ? parseInt(year) : undefined,
        licensePlate: licensePlate || undefined,
        description: description || undefined,
      };

      if (editingMotorcycle) {
        // Update existing motorcycle
        const updatedMotorcycle: Motorcycle = {
          ...editingMotorcycle,
          ...motorcycleData,
        };

        await DataModel.updateMotorcycle(updatedMotorcycle);
      } else {
        // Add new motorcycle
        await DataModel.addMotorcycle(motorcycleData);
      }

      // Reload data to update the UI
      loadMotorcycles();

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving motorcycle:', error);
      Alert.alert('Error', 'Gagal menyimpan data motor');
    }
  };

  // Function to edit a motorcycle
  const handleEditMotorcycle = (motorcycle: Motorcycle) => {
    setName(motorcycle.name);
    setBrand(motorcycle.brand || '');
    setModel(motorcycle.model || '');
    setYear(motorcycle.year ? motorcycle.year.toString() : '');
    setLicensePlate(motorcycle.licensePlate || '');
    setDescription(motorcycle.description || '');
    setEditingMotorcycle(motorcycle);
    setShowForm(true);
  };

  // Function to delete a motorcycle
  const handleDeleteMotorcycle = async (id: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus motor ini? Data terkait juga akan dihapus.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataModel.deleteMotorcycle(id);
              // Reload data to update the UI
              loadMotorcycles();
              // If we're currently viewing this motorcycle's data, switch to all
              if (selectedMotorcycleId === id) {
                onMotorcycleSelect(null);
              }
            } catch (error) {
              console.error('Error deleting motorcycle:', error);
              Alert.alert('Error', 'Gagal menghapus data motor');
            }
          }
        }
      ]
    );
  };

  // Get theme-appropriate colors
  const getThemeColors = () => {
    return isDarkMode ? darkTheme : lightTheme;
  };

  const themeColors = getThemeColors();

  // Get selected motorcycle name for display
  const selectedMotorcycle = motorcycles.find(m => m.id === selectedMotorcycleId);
  const displayText = selectedMotorcycle 
    ? selectedMotorcycle.name 
    : 'Semua Motor';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selectorButton, { backgroundColor: themeColors.primaryButton }]}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.selectorText, { color: themeColors.buttonText }]}>
          Motor: {displayText}
        </Text>
      </TouchableOpacity>

      {/* Modal for selecting motorcycle */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: themeColors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Pilih Motor
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={{ color: themeColors.negative }}>Tutup</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.motorcycleList}>
              {/* Option to show all data */}
              <TouchableOpacity
                style={[
                  styles.motorcycleItem,
                  selectedMotorcycleId === null && styles.selectedItem,
                  { backgroundColor: themeColors.cardBackground }
                ]}
                onPress={handleSelectAllMotorcycles}
              >
                <View style={styles.motorcycleInfo}>
                  <Text style={[styles.motorcycleName, { color: themeColors.text }]}>
                    Semua Motor
                  </Text>
                  <Text style={[styles.motorcycleDetails, { color: themeColors.textSecondary }]}>
                    Tampilkan data dari semua motor
                  </Text>
                </View>
              </TouchableOpacity>

              {motorcycles.map((motorcycle) => (
                <TouchableOpacity
                  key={motorcycle.id}
                  style={[
                    styles.motorcycleItem,
                    selectedMotorcycleId === motorcycle.id && styles.selectedItem,
                    { backgroundColor: themeColors.cardBackground }
                  ]}
                  onPress={() => handleSelectMotorcycle(motorcycle)}
                >
                  <View style={styles.motorcycleInfo}>
                    <Text style={[styles.motorcycleName, { color: themeColors.text }]}>
                      {motorcycle.name}
                    </Text>
                    <Text style={[styles.motorcycleDetails, { color: themeColors.textSecondary }]}>
                      {motorcycle.brand} {motorcycle.model} {motorcycle.year ? `(${motorcycle.year})` : ''}
                    </Text>
                    {motorcycle.licensePlate && (
                      <Text style={[styles.motorcycleDetails, { color: themeColors.textSecondary }]}>
                        No. Polisi: {motorcycle.licensePlate}
                      </Text>
                    )}
                  </View>
                  <View style={styles.motorcycleActions}>
                    <Pressable
                      style={({ pressed }) => [styles.actionButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}
                      onPress={() => handleEditMotorcycle(motorcycle)}
                    >
                      <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative }]}
                      onPress={() => handleDeleteMotorcycle(motorcycle.id)}
                    >
                      <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>Hapus</Text>
                    </Pressable>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: themeColors.primaryButton }]}
                onPress={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <Text style={[styles.addButtonText, { color: themeColors.buttonText }]}>
                  Tambah Motor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Form for adding/editing motorcycles */}
      {showForm && (
        <Modal
          visible={showForm}
          transparent={true}
          animationType="slide"
          onRequestClose={resetForm}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.formContainer, { backgroundColor: themeColors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  {editingMotorcycle ? 'Edit Motor' : 'Tambah Motor Baru'}
                </Text>
                <TouchableOpacity onPress={resetForm}>
                  <Text style={{ color: themeColors.negative }}>Batal</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={[styles.formContent, { maxHeight: 400 }]}>
                <Text style={[styles.label, { color: themeColors.text }]}>Nama Motor *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Contoh: Honda Vario 150"
                  placeholderTextColor={themeColors.placeholderText}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>Merek</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Contoh: Honda"
                  placeholderTextColor={themeColors.placeholderText}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>Model</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
                  value={model}
                  onChangeText={setModel}
                  placeholder="Contoh: Vario 150"
                  placeholderTextColor={themeColors.placeholderText}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>Tahun</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
                  value={year}
                  onChangeText={setYear}
                  placeholder="Contoh: 2022"
                  keyboardType="numeric"
                  placeholderTextColor={themeColors.placeholderText}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>No. Polisi</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  placeholder="Contoh: B 1234 CD"
                  placeholderTextColor={themeColors.placeholderText}
                />

                <Text style={[styles.label, { color: themeColors.text }]}>Deskripsi (opsional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Catatan tambahan"
                  placeholderTextColor={themeColors.placeholderText}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formSubmitButton, { backgroundColor: themeColors.positive }]}
                  onPress={handleAddUpdateMotorcycle}
                >
                  <Text style={[styles.submitButtonText, { color: themeColors.buttonText }]}>
                    {editingMotorcycle ? 'Perbarui' : 'Simpan'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    marginBottom: 16,
  },
  selectorButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectorText: {
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  motorcycleList: {
    flex: 1,
    maxHeight: 400,
  },
  motorcycleItem: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  motorcycleInfo: {
    flex: 1,
  },
  motorcycleName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  motorcycleDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  motorcycleActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  formContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    flex: 1,
  },
  formContent: {
    padding: 16,
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
  formActions: {
    padding: 16,
    borderTopWidth: 1,
  },
  formSubmitButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  pressedButton: {
    opacity: 0.7,
  },
});
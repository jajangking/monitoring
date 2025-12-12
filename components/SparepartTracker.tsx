import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Pressable, ScrollView, RefreshControl, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DataModel, DailyMileage, Sparepart, Motorcycle } from '../models/DataModel';
import { MotorcycleSelector } from './MotorcycleSelector';

export const SparepartTracker: React.FC = () => {
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [dailyMileages, setDailyMileages] = useState<DailyMileage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSparepart, setEditingSparepart] = useState<Sparepart | null>(null);
  const [sparepartName, setSparepartName] = useState<string>('');
  const [sparepartMileageInstalled, setSparepartMileageInstalled] = useState<string>('');
  const [sparepartEstimatedMileage, setSparepartEstimatedMileage] = useState<string>('');
  const [sparepartDateInstalled, setSparepartDateInstalled] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sparepartNote, setSparepartNote] = useState<string>('');
  const [sparepartStatus, setSparepartStatus] = useState<'active' | 'replaced'>('active');
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [searchText, setSearchText] = useState('');
  // State for motorcycle selection
  const [selectedMotorcycleId, setSelectedMotorcycleId] = useState<string | null>(null);

  useEffect(() => {
    loadSpareparts();
    loadDailyMileages(); // Load daily mileage data
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

  // Load all data
  const loadData = async () => {
    try {
      const [sparepartsData, dailyMileagesData] = await Promise.all([
        DataModel.getSpareparts(),
        DataModel.getDailyMileages()
      ]);

      setSpareparts(sparepartsData);
      setDailyMileages(dailyMileagesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

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

  // Load spareparts data from database
  const loadSpareparts = async () => {
    try {
      const sparepartData = await DataModel.getSpareparts(selectedMotorcycleId);
      setSpareparts(sparepartData);
    } catch (error) {
      console.error('Error loading spareparts:', error);
      setSpareparts([]);
    }
  };

  // Load daily mileage data from database
  const loadDailyMileages = async () => {
    try {
      const mileageData = await DataModel.getDailyMileages(selectedMotorcycleId);
      setDailyMileages(mileageData);
    } catch (error) {
      console.error('Error loading daily mileages:', error);
      setDailyMileages([]);
    }
  };

  // Function to calculate distance to replacement for spareparts
  const calculateDistanceToReplacement = (sparepart: Sparepart): number | null => {
    if (sparepart.status === 'replaced') return 0;

    // Get the latest daily mileage record for the same motorcycle
    if (dailyMileages.length > 0) {
      const sortedDaily = [...dailyMileages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestDailyMileage = sortedDaily[0];
      if (latestDailyMileage) {
        const replacementMileage = sparepart.mileageInstalled + sparepart.estimatedMileage;
        return replacementMileage - latestDailyMileage.mileage;
      }
    }
    return null;
  };

  // Function to add or update a sparepart
  const handleAddUpdateSparepart = async () => {
    if (!sparepartName || !sparepartMileageInstalled || !sparepartEstimatedMileage) {
      Alert.alert('Error', 'Silakan lengkapi semua field yang wajib');
      return;
    }

    const mileageInstalledNum = parseFloat(sparepartMileageInstalled);
    const estimatedMileageNum = parseFloat(sparepartEstimatedMileage);

    if (isNaN(mileageInstalledNum) || isNaN(estimatedMileageNum)) {
      Alert.alert('Error', 'Silakan masukkan kilometer yang valid');
      return;
    }

    try {
      if (editingSparepart) {
        // Update existing sparepart
        const updatedSparepart: Sparepart = {
          ...editingSparepart,
          name: sparepartName,
          mileageInstalled: mileageInstalledNum,
          estimatedMileage: estimatedMileageNum,
          dateInstalled: sparepartDateInstalled,
          note: sparepartNote || undefined,
          status: sparepartStatus,
          motorcycleId: selectedMotorcycleId || undefined  // Include motorcycleId
        };

        await DataModel.updateSparepart(updatedSparepart);
      } else {
        // Add new sparepart
        const newSparepart: Omit<Sparepart, 'id'> = {
          name: sparepartName,
          mileageInstalled: mileageInstalledNum,
          estimatedMileage: estimatedMileageNum,
          dateInstalled: sparepartDateInstalled,
          note: sparepartNote || undefined,
          status: 'active',
          motorcycleId: selectedMotorcycleId || undefined  // Include motorcycleId
        };

        await DataModel.addSparepart(newSparepart);
      }

      // Reload data to update the UI
      loadSpareparts();

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving sparepart:', error);
      Alert.alert('Error', 'Gagal menyimpan data sparepart');
    }
  };

  // Function to reset form
  const resetForm = () => {
    setSparepartName('');
    setSparepartMileageInstalled('');
    setSparepartEstimatedMileage('');
    setSparepartDateInstalled(new Date().toISOString().split('T')[0]);
    setSparepartNote('');
    setSparepartStatus('active');
    setEditingSparepart(null);
    setShowForm(false);
  };

  // Function to edit a sparepart
  const handleEditSparepart = (sparepart: Sparepart) => {
    setSparepartName(sparepart.name);
    setSparepartMileageInstalled(sparepart.mileageInstalled.toString());
    setSparepartEstimatedMileage(sparepart.estimatedMileage.toString());
    setSparepartDateInstalled(sparepart.dateInstalled);
    setSparepartNote(sparepart.note || '');
    setSparepartStatus(sparepart.status);
    setEditingSparepart(sparepart);
    setShowForm(true);
  };

  // Function to delete a sparepart
  const handleDeleteSparepart = async (id: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus sparepart ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataModel.deleteSparepart(id);
              // Reload data to update the UI
              loadSpareparts();
            } catch (error) {
              console.error('Error deleting sparepart:', error);
              Alert.alert('Error', 'Gagal menghapus data sparepart');
            }
          }
        }
      ]
    );
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSpareparts();
    setRefreshing(false);
  };

  // Get theme-appropriate colors
  const getThemeColors = () => {
    return isDarkMode ? darkTheme : lightTheme;
  };

  const themeColors = getThemeColors();

  // Filter spareparts based on search text
  const filteredSpareparts = spareparts.filter(sparepart =>
    (sparepart.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (sparepart.note || '').toLowerCase().includes(searchText.toLowerCase()) ||
    sparepart.mileageInstalled.toString().includes(searchText) ||
    sparepart.estimatedMileage.toString().includes(searchText) ||
    new Date(sparepart.dateInstalled).toLocaleDateString().includes(searchText)
  );

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
      <Text style={[styles.title, { color: themeColors.text }]}>Pelacak Sparepart</Text>

      {/* Motorcycle Selector */}
      <MotorcycleSelector
        onMotorcycleSelect={(motorcycle) => {
          setSelectedMotorcycleId(motorcycle?.id || null);
        }}
        selectedMotorcycleId={selectedMotorcycleId}
      />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
            placeholder="Cari sparepart..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={themeColors.placeholderText}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}
          onPress={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          <Text style={[styles.addButtonText, { color: themeColors.buttonText }]}>{showForm ? "Batal" : "Tambah Sparepart"}</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={styles.formSection}>
          <View style={[styles.formContainer, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }]}>
            <Text style={[styles.label, { color: themeColors.text }]}>Nama Sparepart</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
              value={sparepartName}
              onChangeText={setSparepartName}
              placeholder="Contoh: Kampas Rem Depan"
              placeholderTextColor={themeColors.placeholderText}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>Kilometer saat Dipasang</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
              value={sparepartMileageInstalled}
              onChangeText={setSparepartMileageInstalled}
              placeholder="Kilometer saat pemasangan"
              keyboardType="numeric"
              placeholderTextColor={themeColors.placeholderText}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>Estimasi Kilometer Penggantian</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
              value={sparepartEstimatedMileage}
              onChangeText={setSparepartEstimatedMileage}
              placeholder="Estimasi km sebelum penggantian (contoh: 20000)"
              keyboardType="numeric"
              placeholderTextColor={themeColors.placeholderText}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>Tanggal Pemasangan</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
              value={sparepartDateInstalled}
              onChangeText={setSparepartDateInstalled}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={themeColors.placeholderText}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>Catatan (opsional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBackground, borderColor: themeColors.borderColor, color: themeColors.text }]}
              value={sparepartNote}
              onChangeText={setSparepartNote}
              placeholder="Catatan tambahan"
              placeholderTextColor={themeColors.placeholderText}
            />

            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [styles.submitButton, pressed && styles.pressedButton, { backgroundColor: themeColors.positive }]}
                onPress={handleAddUpdateSparepart}
              >
                <Text style={[styles.submitButtonText, { color: themeColors.buttonText }]}>{editingSparepart ? 'Perbarui' : 'Simpan'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative }]}
                onPress={resetForm}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.buttonText }]}>Batal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Active Spareparts List */}
      {filteredSpareparts.filter(sp => sp.status === 'active').length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Sparepart Aktif:</Text>
          {filteredSpareparts
            .filter(sp => sp.status === 'active')
            .map((sparepart) => {
              const distance = calculateDistanceToReplacement(sparepart);
              return (
                <View key={sparepart.id} style={[styles.sparepartItem, { backgroundColor: themeColors.cardBackground, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemName, { color: themeColors.text, fontWeight: 'bold', fontSize: 16 }]}>{sparepart.name}</Text>
                  </View>
                  <Text style={[styles.itemDetail, { color: themeColors.textSecondary }]}>
                    Dipasang: {sparepart.mileageInstalled} km | Estimasi ganti: {sparepart.mileageInstalled + sparepart.estimatedMileage} km
                  </Text>
                  {distance !== null ? (
                    <Text style={{
                      color: distance <= 0 ? themeColors.negative : (distance < 1000 ? themeColors.negative : themeColors.positive),
                      fontWeight: distance <= 0 ? 'bold' : 'normal'
                    }}>
                      {distance <= 0
                        ? `Waktunya ganti! (${Math.abs(distance)} km melewati batas)`
                        : `Sisa: ${distance} km`}
                    </Text>
                  ) : null}
                  {sparepart.note ? <Text style={[styles.itemNote, { color: themeColors.textSecondary }]}>{sparepart.note}</Text> : null}
                  <View style={styles.itemActions}>
                    <Pressable onPress={() => handleEditSparepart(sparepart)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}>
                      <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteSparepart(sparepart.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative }]}>
                      <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>Hapus</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
        </View>
      )}

      {/* Replaced Spareparts List */}
      {filteredSpareparts.filter(sp => sp.status === 'replaced').length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Sparepart Diganti:</Text>
          {filteredSpareparts
            .filter(sp => sp.status === 'replaced')
            .map((sparepart) => (
              <View key={sparepart.id} style={[styles.sparepartItem, { backgroundColor: themeColors.cardBackground, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemName, { color: themeColors.text, fontWeight: 'bold', fontSize: 16, textDecorationLine: 'line-through' }]}>{sparepart.name}</Text>
                </View>
                <Text style={[styles.itemDetail, { color: themeColors.textSecondary }]}>
                  Diganti: {sparepart.mileageReplaced} km | Tanggal: {sparepart.dateReplaced}
                </Text>
                {sparepart.note ? <Text style={[styles.itemNote, { color: themeColors.textSecondary }]}>{sparepart.note}</Text> : null}
                <View style={styles.itemActions}>
                  <Pressable onPress={() => handleEditSparepart(sparepart)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton }]}>
                    <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteSparepart(sparepart.id)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative }]}>
                    <Text style={[styles.actionButtonText, { color: themeColors.buttonText }]}>Hapus</Text>
                  </Pressable>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Empty state */}
      {filteredSpareparts.length === 0 && (
        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>Tidak ada sparepart ditemukan</Text>
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
  sparepartItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemNote: {
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
  formSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pressedButton: {
    opacity: 0.7,
  }
});
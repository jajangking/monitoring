import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Pressable, ScrollView, RefreshControl, Appearance } from 'react-native';
import { DataModel, OilChange } from '../models/DataModel';
import { DailyMileage } from '../models/DataModelSupabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabaseClient';

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
  // State untuk monitoring harian
  const [showMileageForm, setShowMileageForm] = useState(false);
  const [currentMileage, setCurrentMileage] = useState<string>('');
  const [mileageNote, setMileageNote] = useState<string>('');
  const [dailyMileages, setDailyMileages] = useState<DailyMileage[]>([]);
  // State untuk monitoring penggantian oli
  const [nextOilChangeMileage, setNextOilChangeMileage] = useState<number | null>(null);
  const [distanceToNextChange, setDistanceToNextChange] = useState<number | null>(null);
  const [customInterval, setCustomInterval] = useState<number | null>(null);
  const [showCustomIntervalForm, setShowCustomIntervalForm] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  useEffect(() => {
    loadChanges();
    loadDailyMileages(); // Load daily mileage data
    loadCustomInterval(); // Load custom interval from Supabase

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

  // Function to load custom interval from Supabase
  const loadCustomInterval = async () => {
    try {
      setIsLoadingPreferences(true);

      // Try to load from Supabase first
      if (supabase) {
        // Get user ID first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error getting user ID or no user session:', userError?.message || 'No user');
          // For guest users (no session), only load from local storage
        } else {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('preference_value')
            .match({
              preference_key: 'oil_change_interval',
              user_id: user.id
            })
            .limit(1);

          if (error) {
            console.error('Error loading custom interval from Supabase:', error);
          } else if (data && data.length > 0) {
            const value = parseFloat(data[0].preference_value);
            if (!isNaN(value)) {
              setCustomInterval(value);
              return; // Successfully loaded from Supabase
            }
          }
        }
      }

      // Load from local storage as fallback or primary for non-authenticated users
      const savedInterval = await AsyncStorage.getItem('custom_oil_change_interval');
      if (savedInterval) {
        const value = parseFloat(savedInterval);
        if (!isNaN(value)) {
          setCustomInterval(value);
        }
      }
    } catch (error) {
      console.error('Error in loadCustomInterval:', error);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Calculate next oil change and distance to it
  useEffect(() => {
    if (changes.length > 0) {
      // Sort oil changes by date to get the latest one
      const sortedChanges = [...changes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestChange = sortedChanges[0];

      if (latestChange && latestChange.mileage !== undefined) {
        // Use custom interval if set, otherwise use standard 4000km interval
        const interval = customInterval || 4000; // Default to 4000km if no custom interval
        const nextChangeMileage = latestChange.mileage + interval;
        setNextOilChangeMileage(nextChangeMileage);

        // Get the latest daily mileage record
        if (dailyMileages.length > 0) {
          // Use same sorting logic as in getDailyMileagesLimited for consistency
          const sortedDaily = [...dailyMileages].sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
            const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
            return timeB - timeA; // newest first
          });
          const latestDailyMileage = sortedDaily[0];
          if (latestDailyMileage) {
            const distanceToNext = nextChangeMileage - latestDailyMileage.mileage;
            setDistanceToNextChange(distanceToNext);
          }
        } else {
          // If no daily mileage records, use the last oil change mileage
          setDistanceToNextChange(interval);
        }
      } else if (dailyMileages.length > 0) {
        // If no oil changes but have daily mileage, estimate next change
        // Use same sorting logic as in getDailyMileagesLimited for consistency
        const sortedDaily = [...dailyMileages].sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.date).getTime();
          const timeB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.date).getTime();
          return timeB - timeA; // newest first
        });
        const latestDailyMileage = sortedDaily[0];
        if (latestDailyMileage) {
          const interval = customInterval || 4000; // Default to 4000km if no custom interval
          const nextChangeMileage = latestDailyMileage.mileage + interval;
          setNextOilChangeMileage(nextChangeMileage);
          setDistanceToNextChange(interval);
        }
      }
    }
  }, [changes, dailyMileages, customInterval]);

  // Load daily mileage data from AsyncStorage
  const loadDailyMileages = async () => {
    try {
      // Use the updated DataModelSupabase.getDailyMileagesLimited function
      // which combines both Supabase and local storage data and limits to 3 most recent
      const mileageData = await DataModel.getDailyMileagesLimited(3);
      setDailyMileages(mileageData);
    } catch (error) {
      console.error('Error loading daily mileages:', error);
      setDailyMileages([]);
    }
  };

  // Function to save current daily mileage to database
  const handleAddDailyMileage = async () => {
    if (!currentMileage || isNaN(parseFloat(currentMileage))) {
      Alert.alert('Error', 'Silakan masukkan kilometer yang valid');
      return;
    }

    const newMileage: Omit<DailyMileage, 'id'> = {
      date: new Date().toISOString().split('T')[0], // Today's date
      mileage: parseFloat(currentMileage),
      note: mileageNote || undefined
    };

    try {
      await DataModel.addDailyMileage(newMileage);
      // Reload data to update the UI
      loadDailyMileages();

      // Reset form
      setCurrentMileage('');
      setMileageNote('');
      setShowMileageForm(false);
    } catch (error) {
      console.error('Error saving daily mileage:', error);
      Alert.alert('Error', 'Gagal menyimpan kilometer harian');
    }
  };

  // Function to delete a daily mileage record
  const handleDeleteDailyMileage = async (id: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus catatan kilometer harian ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataModel.deleteDailyMileage(id);
              // Reload data to update the UI
              loadDailyMileages();
            } catch (error) {
              console.error('Error deleting daily mileage:', error);
              Alert.alert('Error', 'Gagal menghapus kilometer harian');
            }
          }
        }
      ]
    );
  };

  // Function to set custom oil change interval
  const handleSetCustomInterval = async () => {
    if (!customInterval || customInterval <= 0) {
      Alert.alert('Error', 'Silakan masukkan interval kilometer yang valid');
      return;
    }

    Alert.alert(
      'Konfirmasi',
      `Apakah Anda ingin mengatur interval ganti oli ke ${customInterval} km?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Atur',
          onPress: async () => {
            try {
              // Try to save to Supabase first
              if (supabase) {
                // Get user ID first
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                  console.error('Error getting user ID or no user session:', userError?.message || 'No user');
                  // For guest users (no session), we don't perform Supabase operations
                  // Save to local storage as fallback
                  await AsyncStorage.setItem('custom_oil_change_interval', customInterval.toString());
                  Alert.alert('Info', 'Preferensi disimpan secara lokal. Login untuk menyimpan ke server.');
                } else {
                  // First, try to delete any existing record for this user and key
                  await supabase
                    .from('user_preferences')
                    .delete()
                    .match({
                      preference_key: 'oil_change_interval',
                      user_id: user.id
                    });

                  // Then insert the new record
                  const { error } = await supabase
                    .from('user_preferences')
                    .insert({
                      preference_key: 'oil_change_interval',
                      preference_value: customInterval.toString(),
                      user_id: user.id
                    });

                  if (error) {
                    console.error('Error saving custom interval to Supabase:', error);
                    // If Supabase fails, save to local storage as fallback
                    await AsyncStorage.setItem('custom_oil_change_interval', customInterval.toString());
                    Alert.alert('Info', 'Preferensi disimpan secara lokal karena server tidak merespons. Akan disinkronkan saat koneksi tersedia.');
                  }
                }
              } else {
                // If Supabase is not available, save to local storage
                await AsyncStorage.setItem('custom_oil_change_interval', customInterval.toString());
              }
            } catch (error) {
              console.error('Error saving custom interval:', error);
              Alert.alert('Error', 'Gagal menyimpan preferensi. Silakan coba lagi.');
            }

            setShowCustomIntervalForm(false);
          }
        }
      ]
    );
  };

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

      {/* Oil Change Monitoring Summary */}
      <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 16 }]}>
        <View style={styles.cardContent}>
          <Text style={[styles.summaryTitle, { color: themeColors.text, fontSize: 18, fontWeight: 'bold' }]}>Monitoring Penggantian Oli</Text>

          {nextOilChangeMileage !== null ? (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: themeColors.text, fontSize: 16 }}>
                Kilometer berikutnya: <Text style={{ fontWeight: 'bold' }}>{nextOilChangeMileage} km</Text>
              </Text>
              {distanceToNextChange !== null && distanceToNextChange > 0 ? (
                <Text style={{ color: themeColors.text, fontSize: 16, marginTop: 5 }}>
                  Sisa jarak: <Text style={{ fontWeight: 'bold', color: distanceToNextChange < 500 ? themeColors.negative : themeColors.positive }}>{distanceToNextChange} km</Text>
                </Text>
              ) : distanceToNextChange !== null ? (
                <Text style={{ color: themeColors.negative, fontSize: 16, fontWeight: 'bold', marginTop: 5 }}>
                  Waktunya ganti oli! ({Math.abs(distanceToNextChange)} km melewati batas)
                </Text>
              ) : null}
              {customInterval && (
                <Text style={{ color: themeColors.text, fontSize: 14, marginTop: 5, fontStyle: 'italic' }}>
                  (Berdasarkan interval kustom: {customInterval} km)
                </Text>
              )}
            </View>
          ) : (
            <Text style={{ color: themeColors.text, fontSize: 16, marginTop: 5 }}>
              Tidak ada data penggantian oli sebelumnya
            </Text>
          )}
        </View>
      </View>

      {/* Custom Oil Change Interval */}
      <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 16 }]}>
        <View style={styles.cardContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.summaryTitle, { color: themeColors.text, fontSize: 18, fontWeight: 'bold' }]}>Interval Ganti Oli</Text>
            <Pressable
              style={({ pressed }) => [styles.addMileageButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }]}
              onPress={() => setShowCustomIntervalForm(!showCustomIntervalForm)}
            >
              <Text style={{ color: themeColors.buttonText, fontWeight: '600' }}>{showCustomIntervalForm ? "Batal" : "Atur Interval"}</Text>
            </Pressable>
          </View>

          {showCustomIntervalForm && (
            <View style={[styles.mileageForm, { marginTop: 10, padding: 15, backgroundColor: themeColors.inputBackground, borderRadius: 8 }]}>
              <Text style={[styles.label, { color: themeColors.text, marginBottom: 8 }]}>Interval Ganti Oli (km)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderColor, color: themeColors.text, marginBottom: 10 }]}
                value={customInterval ? customInterval.toString() : ''}
                onChangeText={(text) => setCustomInterval(text ? parseFloat(text) : null)}
                placeholder="Masukkan interval (misal: 2000, 3000, 5000)"
                keyboardType="numeric"
                placeholderTextColor={themeColors.placeholderText}
              />
              <Pressable
                style={({ pressed }) => [styles.submitButton, pressed && styles.pressedButton, { backgroundColor: themeColors.positive, paddingVertical: 12, borderRadius: 8, marginBottom: 10 }]}
                onPress={handleSetCustomInterval}
              >
                <Text style={{ color: themeColors.buttonText, fontWeight: '600', textAlign: 'center' }}>Atur Interval</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative, paddingVertical: 12, borderRadius: 8 }]}
                onPress={() => setShowCustomIntervalForm(false)}
              >
                <Text style={{ color: themeColors.buttonText, fontWeight: '600', textAlign: 'center' }}>Batal</Text>
              </Pressable>
            </View>
          )}

          {/* Display current custom interval */}
          {customInterval !== null ? (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: themeColors.text, fontSize: 16 }}>
                Interval ganti oli: <Text style={{ fontWeight: 'bold', color: themeColors.positive }}>{customInterval} km</Text>
              </Text>
              <Pressable
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressedButton, { backgroundColor: themeColors.negative, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 }]}
                onPress={() => {
                  Alert.alert(
                    'Konfirmasi',
                    'Apakah Anda ingin menghapus pengaturan interval ganti oli kustom?',
                    [
                      { text: 'Batal', style: 'cancel' },
                      {
                        text: 'Hapus',
                        onPress: async () => {
                          try {
                            // Try to delete from Supabase first
                            if (supabase) {
                              // Get user ID first
                              const { data: { user }, error: userError } = await supabase.auth.getUser();
                              if (userError || !user) {
                                console.error('Error getting user ID or no user session:', userError?.message || 'No user');
                                // For guest users (no session), only delete from local storage
                                await AsyncStorage.removeItem('custom_oil_change_interval');
                              } else {
                                const { error } = await supabase
                                  .from('user_preferences')
                                  .delete()
                                  .match({
                                    preference_key: 'oil_change_interval',
                                    user_id: user.id
                                  });

                                if (error) {
                                  console.error('Error deleting custom interval from Supabase:', error);
                                  // If Supabase fails, delete from local storage as fallback
                                  await AsyncStorage.removeItem('custom_oil_change_interval');
                                  Alert.alert('Info', 'Preferensi dihapus dari lokal karena server tidak merespons. Akan disinkronkan saat koneksi tersedia.');
                                } else {
                                  // If Supabase succeeds, also delete from local storage
                                  await AsyncStorage.removeItem('custom_oil_change_interval');
                                }
                              }
                            } else {
                              // If Supabase is not available, delete from local storage
                              await AsyncStorage.removeItem('custom_oil_change_interval');
                            }
                          } catch (error) {
                            console.error('Error deleting custom interval:', error);
                          }

                          setCustomInterval(null);
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={{ color: themeColors.buttonText, fontWeight: '600' }}>Hapus Interval Kustom</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={{ color: themeColors.text, fontSize: 16, marginTop: 10 }}>
              Tidak ada interval kustom - menggunakan interval standar 4000 km
            </Text>
          )}
        </View>
      </View>

      {/* Daily Mileage Monitoring */}
      <View style={[styles.summaryCard, { backgroundColor: themeColors.cardBackground, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 16 }]}>
        <View style={styles.cardContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.summaryTitle, { color: themeColors.text, fontSize: 18, fontWeight: 'bold' }]}>Monitoring Harian KM</Text>
            <Pressable
              style={({ pressed }) => [styles.addMileageButton, pressed && styles.pressedButton, { backgroundColor: themeColors.primaryButton, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }]}
              onPress={() => setShowMileageForm(!showMileageForm)}
            >
              <Text style={{ color: themeColors.buttonText, fontWeight: '600' }}>{showMileageForm ? "Batal" : "Tambah KM Harian"}</Text>
            </Pressable>
          </View>

          {showMileageForm && (
            <View style={[styles.mileageForm, { marginTop: 10, padding: 15, backgroundColor: themeColors.inputBackground, borderRadius: 8 }]}>
              <Text style={[styles.label, { color: themeColors.text, marginBottom: 8 }]}>Kilometer Hari Ini</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderColor, color: themeColors.text, marginBottom: 10 }]}
                value={currentMileage}
                onChangeText={setCurrentMileage}
                placeholder="Masukkan kilometer saat ini"
                keyboardType="numeric"
                placeholderTextColor={themeColors.placeholderText}
              />
              <Text style={[styles.label, { color: themeColors.text, marginBottom: 8 }]}>Catatan (opsional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.background, borderColor: themeColors.borderColor, color: themeColors.text, marginBottom: 15 }]}
                value={mileageNote}
                onChangeText={setMileageNote}
                placeholder="Catatan tambahan"
                placeholderTextColor={themeColors.placeholderText}
              />
              <Pressable
                style={({ pressed }) => [styles.submitButton, pressed && styles.pressedButton, { backgroundColor: themeColors.positive, paddingVertical: 12, borderRadius: 8 }]}
                onPress={handleAddDailyMileage}
              >
                <Text style={{ color: themeColors.buttonText, fontWeight: '600', textAlign: 'center' }}>Simpan Kilometer</Text>
              </Pressable>
            </View>
          )}

          {/* Latest Daily Mileage */}
          {dailyMileages.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: themeColors.text, fontWeight: '600', marginBottom: 5 }}>Kilometer Harian (3 Terbaru):</Text>
              {dailyMileages.map((entry, index) => (
                <View key={entry.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: themeColors.text }}>
                      {entry.mileage} km
                    </Text>
                    <Text style={{ color: themeColors.text, fontSize: 12, opacity: 0.7 }}>
                      {entry.created_at ?
                        new Date(entry.created_at).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        }) :
                        new Date(entry.date).toLocaleDateString()
                      }
                    </Text>
                    {entry.note && (
                      <Text style={{ color: themeColors.text, fontSize: 12, opacity: 0.8 }}>
                        {entry.note}
                      </Text>
                    )}
                  </View>
                  <Pressable onPress={() => handleDeleteDailyMileage(entry.id)}>
                    <Text style={{ color: themeColors.negative }}>Hapus</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

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
  cardContent: {
    padding: 16,
  },
  mileageForm: {
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
  },
});
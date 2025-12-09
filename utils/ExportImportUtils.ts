import { DataModel, Order, FuelExpense, OilChange, DailyMileage, Sparepart } from '../models/DataModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface for export data structure
export interface ExportData {
  orders: Order[];
  fuelExpenses: FuelExpense[];
  oilChanges: OilChange[];
  dailyMileages: DailyMileage[];
  spareparts: Sparepart[];
  exportDate: string;
  appVersion: string;
}

// Interface for daily data in REKAP ANTARAN
interface DailyRekapData {
  day: number;
  klik: number; // Always a number, including 0
  paket: number; // Always a number, including 0
  hasPaketOrders: boolean; // Whether this day had any Paket orders
}

// Interface for REKAP ANTARAN export format
export interface RekapAntaranData {
  employeeName: string;
  employeeNik: string;
  employeeNikDms: string;
  location: string;
  dateRange: string;
  dailyData: DailyRekapData[];
  totalAntaran: number;
  totalKlik: number;
  totalPaket: number;
  exportDate: string;
}

export class ExportImportUtils {
  // Export all data in a structured JSON format
  static async exportAllData(): Promise<string> {
    try {
      const [orders, fuelExpenses, oilChanges, dailyMileages, spareparts] = await Promise.all([
        DataModel.getOrders(),
        DataModel.getFuelExpenses(),
        DataModel.getOilChanges(),
        DataModel.getDailyMileages(),
        DataModel.getSpareparts()
      ]);

      const exportData: ExportData = {
        orders,
        fuelExpenses,
        oilChanges,
        dailyMileages,
        spareparts,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0' // This should match your package.json version
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  // Import data from JSON format
  static async importData(jsonData: string): Promise<void> {
    try {
      // Try to parse as JSON first
      const parsedData: ExportData = JSON.parse(jsonData);

      // Clear existing data first
      await DataModel.resetAllData();

      // Import orders
      for (const order of parsedData.orders) {
        await DataModel.addLocalOrderWithId(order);
      }

      // Import fuel expenses
      for (const expense of parsedData.fuelExpenses) {
        await DataModel.addLocalFuelExpenseWithId(expense);
      }

      // Import oil changes
      for (const change of parsedData.oilChanges) {
        await DataModel.addLocalOilChangeWithId(change);
      }

      // Import daily mileages
      for (const mileage of parsedData.dailyMileages) {
        await DataModel.addLocalDailyMileageWithId(mileage);
      }

      // Import spareparts
      for (const sparepart of parsedData.spareparts) {
        await DataModel.addLocalSparepartWithId(sparepart);
      }
    } catch (jsonError) {
      // If JSON parsing fails, try to parse as REKAP ANTARAN format
      try {
        await ExportImportUtils.importRekapAntaran(jsonData);
      } catch (rekapError) {
        console.error('Error importing data in both JSON and REKAP ANTARAN format:', jsonError, rekapError);
        throw new Error('Failed to import data. The file may be corrupted or in an unsupported format.');
      }
    }
  }

  // Import data from REKAP ANTARAN format
  static async importRekapAntaran(rekapData: string): Promise<void> {
    try {
      // This is a basic implementation - you might need to enhance this based on your needs
      // For now, we'll just parse the structure but not actually import data since
      // the REKAP format doesn't contain all the necessary details for import

      // Clear existing data first
      await DataModel.resetAllData();

      // Parse the REKAP ANTARAN format
      const lines = rekapData.split('\n');
      let dateRange: string | null = null;
      let employeeName: string | null = null;
      let employeeNik: string | null = null;
      let employeeNikDms: string | null = null;

      // Extract header information
      for (const line of lines) {
        if (line.startsWith('NAMA : ')) {
          employeeName = line.substring(7).trim();
        } else if (line.startsWith('NIK : ')) {
          employeeNik = line.substring(6).trim();
        } else if (line.startsWith('NIK DMS : ')) {
          employeeNikDms = line.substring(10).trim();
        }
      }

      // Extract date range from the header
      const headerLines = lines.slice(0, 5);
      for (const line of headerLines) {
        if (line.includes('TGL')) {
          dateRange = line.trim();
          break;
        }
      }

      console.log('Imported REKAP ANTARAN data:', {
        employeeName,
        employeeNik,
        employeeNikDms,
        dateRange
      });

      // Since the REKAP format is a summary and doesn't contain the raw data,
      // we cannot reconstruct the original orders, expenses, etc. from it.
      // This function serves more as a placeholder and could be enhanced
      // based on specific requirements.
    } catch (error) {
      console.error('Error importing REKAP ANTARAN data:', error);
      throw new Error('Failed to import REKAP ANTARAN data. The format may be incorrect.');
    }
  }

  // Export in REKAP ANTARAN format (as requested by the user)
  static async exportRekapAntaran(
    employeeName: string = 'Jajang Nurdiana',
    employeeNik: string = '3207103103000001',
    employeeNikDms: string = '32071031',
    location: string = 'DELIMAN HL',
    dateRange: string = 'DESEMBER TGL 1-15'
  ): Promise<string> {
    try {
      // Get all orders for the current month to calculate daily data
      const orders = await DataModel.getOrders();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Filter orders for current month
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });

      // For REKAP ANTARAN, we'll focus only on the first 15 days of the month as specified in the example
      // Create daily data structure for 15 days (1-15)
      const dailyData = Array.from({ length: 15 }, (_, i) => {
        const day = i + 1;
        const dayOrders = monthOrders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.getDate() === day &&
                 orderDate.getMonth() === currentMonth &&
                 orderDate.getFullYear() === currentYear;
        });

        let totalKlik = 0;
        let totalPaket = 0;

        // Calculate klik and paket from orders using the 'quantity' field and 'orderType'
        for (const order of dayOrders) {
          // Only use the 'quantity' field as specified in your request
          const qty = order.quantity || 0;

          // Use the orderType field to separate Regular and Paket orders
          if (order.orderType === 'Paket') {
            totalPaket += qty;
          } else {
            // Consider all other orders as 'Regular' (klik)
            totalKlik += qty;
          }
        }

        return {
          day,
          klik: totalKlik,  // Always store the value, even if 0
          paket: totalPaket,  // Always store the value, even if 0
          hasPaketOrders: dayOrders.some(order => order.orderType === 'Paket') // Track if any Paket orders exist
        };
      });

      // Calculate totals
      const totalKlik = dailyData.reduce((sum, day) => sum + (day.klik || 0), 0);
      const totalPaket = dailyData.reduce((sum, day) => sum + (day.paket || 0), 0);
      const totalAntaran = totalKlik + totalPaket;

      // Format the output as requested
      let output = `*REKAP ANTARAN*\n`;
      output += `*${location}*\n`;
      output += `*${dateRange}*\n\n`;
      output += `NAMA : ${employeeName}\n`;
      output += `NIK : ${employeeNik}\n`;
      output += `NIK DMS : ${employeeNikDms}\n\n`;

      output += `TGL_KLIK_PAKET\n`;
      for (const day of dailyData) {
        const klik = day.klik.toString();  // Always a number, so convert to string
        const paket = day.paket.toString(); // Always a number, so convert to string
        // Format according to the example:
        // - Show day.klik_paket when day has Paket orders (even if 0)
        // - Show day.klik when day has no Paket orders at all
        // - Show day. when no klik values
        if (klik !== '0' || day.klik > 0) { // If there are any klik orders
          // Show both if this day had Paket orders (even if 0), otherwise just klik
          if (day.hasPaketOrders) {
            output += `${day.day}.${klik}_${paket}\n`;
          } else {
            output += `${day.day}.${klik}\n`;
          }
        } else {
          output += `${day.day}.\n`; // No klik values for this day
        }
      }

      output += `\nTOTAL ANTARAN : ${totalAntaran}\n`;
      output += `KLIK     : ${totalKlik}\n`;
      output += `PAKET : ${totalPaket}\n`;
      
      return output;
    } catch (error) {
      console.error('Error exporting REKAP ANTARAN:', error);
      throw new Error('Failed to export REKAP ANTARAN data');
    }
  }

  // Function to export data to a file (platform-specific implementation would go here)
  static async exportToFile(content: string, fileName: string): Promise<void> {
    // This would be implemented differently for different platforms
    // For React Native, you might use react-native-fs or similar
    console.log(`Exported file: ${fileName}\nContent:\n${content}`);
    // In a real implementation, you would save the file to the device's storage
  }
}
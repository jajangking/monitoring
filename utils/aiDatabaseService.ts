import { DataModel } from '../models/DataModel';
import { Order, FuelExpense, OilChange } from '../models/DataModel';

interface ParsedIntent {
  intent: 'order' | 'fuel_expense' | 'oil_change' | 'query' | 'unknown';
  entities: {
    amount?: number;
    date?: string;
    description?: string;
    liters?: number;
    mileage?: number;
    quantity?: number;
    pricePerItem?: number;
  };
}

interface PendingAction {
  type: 'add' | 'update';
  dataType: 'order' | 'fuel_expense' | 'oil_change';
  data: any;
  sessionId: string;
}

export class AIDatabaseService {
  private static instance: AIDatabaseService;
  private pendingActions: Map<string, PendingAction> = new Map(); // Key: sessionId

  public static getInstance(): AIDatabaseService {
    if (!AIDatabaseService.instance) {
      AIDatabaseService.instance = new AIDatabaseService();
    }
    return AIDatabaseService.instance;
  }

  /**
   * Parse user input to understand intent and extract entities
   */
  async parseUserInput(userInput: string): Promise<ParsedIntent> {
    const lowerInput = userInput.toLowerCase();
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Define patterns for different intents
    const intentPatterns = {
      order: [
        'pesan', 'order', 'transaksi', 'jual', 'jualan', 'penjualan', 'dagang', 'tambah pesanan',
        'catat pesanan', 'tambah order', 'catat order', 'tambahkan pesanan', 'tambahkan order'
      ],
      fuel_expense: [
        'bbm', 'bensin', 'bahan bakar', 'isi bensin', 'isi bbm', 'tambah bbm', 'catat bbm',
        'tambah bensin', 'catat bensin', 'isi ulang', 'pengeluaran bbm', 'pengeluaran bensin'
      ],
      oil_change: [
        'oli', 'oli mesin', 'ganti oli', 'penggantian oli', 'tambah oli', 'catat oli',
        'servis oli', 'minyak pelumas', 'kendaraan oli'
      ]
    };

    // Determine intent with improved matching
    let intent: ParsedIntent['intent'] = 'unknown';

    // Check for more specific phrases and keywords
    for (const [intentType, keywords] of Object.entries(intentPatterns)) {
      for (const keyword of keywords) {
        if (lowerInput.includes(keyword)) {
          intent = intentType as ParsedIntent['intent'];

          // If we found a strong match, break early
          if (keyword.length >= 4) { // Stronger matches have longer keywords
            break;
          }
        }
      }

      if (intent !== 'unknown') {
        break; // Break after finding the first matching intent type
      }
    }

    // Check for common recording phrases at the beginning of the sentence
    if (intent === 'unknown') {
      const recordingPhrases = [
        'tolong catat', 'mohon dicatat', 'catatkan', 'tambahkan',
        'tambah', 'masukkan', 'input', 'rekam', 'simpan', 'catat'
      ];

      for (const phrase of recordingPhrases) {
        if (lowerInput.includes(phrase)) {
          // If we found a recording phrase, look for entity keywords in the rest of the sentence
          if (lowerInput.includes('bbm') || lowerInput.includes('bensin') ||
              lowerInput.includes('liter') || lowerInput.includes('bensin')) {
            intent = 'fuel_expense';
          } else if (lowerInput.includes('oli') || lowerInput.includes('ganti oli') ||
                    lowerInput.includes('mesin')) {
            intent = 'oil_change';
          } else if (lowerInput.includes('order') || lowerInput.includes('pesan') ||
                    lowerInput.includes('jualan') || lowerInput.includes('dagang') ||
                    lowerInput.includes('pendapatan')) {
            intent = 'order';
          }
          break;
        }
      }
    }

    // Also check for common data entry phrases
    if (intent === 'unknown') {
      if (lowerInput.includes('pengeluaran') || lowerInput.includes('keluar') || lowerInput.includes('biaya') ||
          lowerInput.includes('bayar') || lowerInput.includes('harga')) {
        if (lowerInput.includes('bbm') || lowerInput.includes('bensin') || lowerInput.includes('liter')) {
          intent = 'fuel_expense';
        } else if (lowerInput.includes('oli') || lowerInput.includes('ganti oli') || lowerInput.includes('servis')) {
          intent = 'oil_change';
        }
      } else if (lowerInput.includes('pendapatan') || lowerInput.includes('masuk') ||
                 lowerInput.includes('jual') || lowerInput.includes('order') || lowerInput.includes('pesan')) {
        intent = 'order';
      }
    }

    // Extract entities using regex patterns
    const entities = this.extractEntities(userInput);

    // Log for debugging
    console.log('Parsed input:', { userInput, intent, entities });

    return { intent, entities };
  }

  /**
   * Extract entities from user input using regex patterns
   */
  private extractEntities(input: string): ParsedIntent['entities'] {
    const entities: ParsedIntent['entities'] = {};

    // Extract amount (Rp, rupiah, or numbers with improved parsing)
    const amountRegex = /(?:Rp\s*|IDR\s*)?([\d.,\s]+juta|[\d.,\s]+jt|[\d.,\s]+k|[\d.,\s]+ribu|[\d.,\s]+)/gi;
    const amounts = [...input.matchAll(amountRegex)];

    if (amounts.length > 0) {
      // Process the first amount match
      let amountStr = amounts[0][1].replace(/\s+/g, ''); // Remove all whitespace

      if (amountStr) {
        // Handle various formats like "1.500.000", "1,500,000", "1500000", "1,5jt", "30rb", etc.
        let amountValue = amountStr.replace(/[.,]/g, '');

        if (amountValue.toLowerCase().includes('juta') || amountValue.toLowerCase().includes('jt')) {
          // Handle million values
          const millionValue = parseFloat(amountValue.replace(/[a-zA-Z]/g, '').replace(/\s+/g, ''));
          entities.amount = Math.round(millionValue * 1_000_000);
        } else if (amountValue.toLowerCase().includes('k') || amountValue.toLowerCase().includes('rb')) {
          // Handle thousand values (k or rb for ribu)
          const thousandValue = parseFloat(amountValue.replace(/[a-zA-Z]/g, '').replace(/\s+/g, ''));
          entities.amount = Math.round(thousandValue * 1_000);
        } else {
          entities.amount = parseInt(amountValue, 10) || 0;
        }
      }
    }

    // If no amount was found but the input contains "untuk" or "seharga", check after those words
    if (!entities.amount && (input.includes('untuk') || input.includes('seharga'))) {
      const afterForMatch = input.match(/(?:untuk|seharga)\s*(?:Rp\s*)?([\d.,\s]+juta|[\d.,\s]+jt|[\d.,\s]+k|[\d.,\s]+ribu|[\d.,\s]+)/i);
      if (afterForMatch && afterForMatch[1]) {
        let amountStr = afterForMatch[1].replace(/\s+/g, '');
        let amountValue = amountStr.replace(/[.,]/g, '');

        if (amountValue.toLowerCase().includes('juta') || amountValue.toLowerCase().includes('jt')) {
          const millionValue = parseFloat(amountValue.replace(/[a-zA-Z]/g, ''));
          entities.amount = Math.round(millionValue * 1_000_000);
        } else if (amountValue.toLowerCase().includes('k') || amountValue.toLowerCase().includes('rb')) {
          const thousandValue = parseFloat(amountValue.replace(/[a-zA-Z]/g, ''));
          entities.amount = Math.round(thousandValue * 1_000);
        } else {
          entities.amount = parseInt(amountValue, 10) || 0;
        }
      }
    }

    // Extract description - improved logic to avoid capturing amount as description
    const descriptionMatches = input.match(/(?:deskripsi|keterangan|untuk|keperluan):\s*([^,;.]+)/i);
    if (descriptionMatches) {
      entities.description = descriptionMatches[1].trim();
    } else {
      // Improved description extraction to avoid capturing amount as description
      // Split the input and remove the amount part before extracting description
      if (entities.amount && entities.amount > 0) {
        // Find the amount in the text and extract what comes before and after it
        const amountRegexExact = /(?:Rp\s*)?[\d.,]+(?:\s*(?:juta|jt|k|ribu))?/gi;
        const parts = input.split(amountRegexExact);
        // Use the part that contains context words like "bensin", "oli", etc. or the non-amount part
        for (const part of parts) {
          if (part.trim() &&
              (part.toLowerCase().includes('bensin') ||
               part.toLowerCase().includes('bbm') ||
               part.toLowerCase().includes('oli') ||
               part.toLowerCase().includes('order') ||
               part.toLowerCase().includes('pesan') ||
               part.toLowerCase().includes('ganti') ||
               part.toLowerCase().includes('hari'))) {
            entities.description = part.trim();
            break;
          }
        }

        // If no context-specific description found, use the first significant part
        if (!entities.description && parts.length > 0) {
          const nonEmptyParts = parts.filter(p => p.trim().length > 0);
          entities.description = nonEmptyParts.length > 0 ? nonEmptyParts[0].trim() : input.slice(0, 50);
        }
      } else {
        // If no amount was found, use the entire input as description
        entities.description = input.slice(0, 100); // Limit length
      }
    }

    // Extract liters for fuel expenses
    const litersRegex = /(\d+(?:[.,]\d+)?)\s*(?:liter|L|lt|ltr)/i;
    const litersMatch = input.match(litersRegex);
    if (litersMatch) {
      entities.liters = parseFloat(litersMatch[1].replace(',', '.'));
    }

    // Extract mileage for oil changes
    const mileageRegex = /(\d{1,4})\s*(?:km|kilometer|kilomter|kilometer|kilo meter)/i;
    const mileageMatch = input.match(mileageRegex);
    if (mileageMatch) {
      entities.mileage = parseInt(mileageMatch[1], 10);
    }

    // Extract quantity for orders
    const quantityRegex = /(\d+)\s*(?:buah|item|pcs|pcs?|quantity|jumlah|qty)/i;
    const quantityMatch = input.match(quantityRegex);
    if (quantityMatch) {
      entities.quantity = parseInt(quantityMatch[1], 10);
    }

    // Extract price per item for orders (when explicitly mentioned)
    const pricePerItemRegex = /(?:per\s+item|per\s+buah|per\s+pcs|per\s+unit|@)\s*Rp?\s*([\d.,]+)/i;
    const pricePerItemMatch = input.match(pricePerItemRegex);
    if (pricePerItemMatch) {
      let priceStr = pricePerItemMatch[1].replace(/[.,]/g, '');
      entities.pricePerItem = parseInt(priceStr, 10) || 0;
    }

    // Extract date (today, yesterday, specific date)
    const dateRegex = /(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})|(\d{2}-\d{2}-\d{4})/;
    const dateMatch = input.match(dateRegex);
    if (dateMatch) {
      entities.date = dateMatch[0];
    } else if (input.includes('kemarin') || input.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      entities.date = yesterday.toISOString().split('T')[0];
    } else if (input.includes('hari ini') || input.includes('today') || input.includes('sekarang')) {
      entities.date = new Date().toISOString().split('T')[0];
    }

    return entities;
  }

  /**
   * Process user intent and store data to database
   */
  async processIntent(userInput: string, sessionId: string = 'default'): Promise<{ success: boolean; message: string }> {
    try {
      // Check if the user is confirming or rejecting a pending action
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.includes('ya') || lowerInput.includes('oke') || lowerInput.includes('confirm') ||
          lowerInput.includes('iya') || lowerInput.includes('setuju') || lowerInput.includes('benar') ||
          lowerInput.trim() === 'y') {  // Added single 'y' as confirmation
        return await this.confirmAction(sessionId);
      } else if (lowerInput.includes('tidak') || lowerInput.includes('batal') ||
                 lowerInput.includes('cancel') || lowerInput.includes('hapus') ||
                 lowerInput.includes('no') || lowerInput.includes('tolak')) {
        return await this.rejectAction(sessionId);
      }

      // Check for universal data queries that can be handled without intent classification
      const universalQueryResult = await this.handleUniversalQuery(userInput);
      if (universalQueryResult) {
        return { success: true, message: universalQueryResult };
      }

      // Enhanced intent detection for data entry - improved pattern matching
      let intent: ParsedIntent['intent'] = 'unknown';

      // Check if this is a query about data (not data entry)
      if (this.isDataQuery(lowerInput)) {
        const queryResult = await this.handleDataQuery(userInput);
        if (queryResult) {
          return { success: true, message: queryResult };
        }
      }

      // Priority-based intent detection with more comprehensive keywords
      if (lowerInput.includes('bbm') || lowerInput.includes('bensin')) {
        intent = 'fuel_expense';
      } else if (lowerInput.includes('oli') || lowerInput.includes('ganti oli') || lowerInput.includes('oli mesin')) {
        intent = 'oil_change';
      } else if (lowerInput.includes('pesan') || lowerInput.includes('order') || lowerInput.includes('jualan')) {
        intent = 'order';
      }
      // Check for common recording patterns with context
      else if (lowerInput.includes('catat') || lowerInput.includes('tambah') || lowerInput.includes('rekam') ||
               lowerInput.includes('simpan') || lowerInput.includes('masuk') || lowerInput.includes('input')) {
        if (lowerInput.includes('bbm') || lowerInput.includes('bensin') || lowerInput.includes('liter')) {
          intent = 'fuel_expense';
        } else if (lowerInput.includes('oli') || lowerInput.includes('ganti')) {
          intent = 'oil_change';
        } else if (lowerInput.includes('pesan') || lowerInput.includes('order') || lowerInput.includes('jual')) {
          intent = 'order';
        } else if (this.extractAmount(userInput)) {
          // If there's an amount but no clear category, check for other context clues
          if (lowerInput.includes('hari') || lowerInput.includes('ini')) {
            // If user says "hari ini" with amount, check for context
            if (lowerInput.includes('bensin') || lowerInput.includes('bbm')) {
              intent = 'fuel_expense';
            } else if (lowerInput.includes('oli')) {
              intent = 'oil_change';
            } else {
              intent = 'order'; // Default to order
            }
          } else {
            // Default to order for general money transactions
            intent = 'order';
          }
        }
      }

      // Additional checks for specific patterns that might have been missed
      if (intent === 'unknown') {
        if (lowerInput.includes('isi bensin') || lowerInput.includes('beli bensin') ||
            lowerInput.includes('pengisian bbm') || lowerInput.includes('bensin berapa liter')) {
          intent = 'fuel_expense';
        } else if (lowerInput.includes('ganti oli') || lowerInput.includes('servis oli') ||
                   lowerInput.includes('oli berapa km') || lowerInput.includes('cek oli')) {
          intent = 'oil_change';
        } else if (lowerInput.includes('tambah pesan') || lowerInput.includes('order baru') ||
                   lowerInput.includes('pesan baru') || lowerInput.includes('jualan baru')) {
          intent = 'order';
        }
      }

      // If we determined an intent, process it
      if (intent !== 'unknown') {
        // Extract entities after determining intent to ensure consistency
        const entities = this.extractEntities(userInput);

        // Log for debugging
        console.log('Processing intent:', { intent, entities, userInput });

        switch (intent) {
          case 'order':
            return await this.handleOrder({ intent, entities }, sessionId);
          case 'fuel_expense':
            return await this.handleFuelExpense({ intent, entities }, sessionId);
          case 'oil_change':
            return await this.handleOilChange({ intent, entities }, sessionId);
        }
      }

      // If no specific data entry intent was detected, return as query
      return { success: false, message: 'Permintaan Anda adalah permintaan informasi yang akan ditangani oleh layanan AI standar.' };
    } catch (error) {
      console.error('Error processing intent:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.'
      };
    }
  }

  /**
   * Check if the user input is a data query (asking for information)
   */
  private isDataQuery(lowerInput: string): boolean {
    // Keywords that indicate a query for information
    const queryKeywords = [
      'berapa', 'berapa kali', 'berapa km', 'berapa liter', 'berapa harga', 'berapa biaya',
      'berapa jumlah', 'berapa total', 'berapa rata', 'berapa banyak', 'berapa kali',
      'kapan', 'tanggal', 'waktu', 'lama', 'terakhir', 'sejak kapan',
      'cek', 'lihat', 'tampilkan', 'show', 'info', 'informasi',
      'ringkasan', 'report', 'laporan', 'statistik', 'data',
      'berapa sering', 'berapa sering ganti', 'berapa jarak', 'berapa jarak ganti'
    ];

    return queryKeywords.some(keyword => lowerInput.includes(keyword));
  }

  /**
   * Handle data queries that ask for information about stored data
   */
  private async handleDataQuery(userInput: string): Promise<string | null> {
    const lowerInput = userInput.toLowerCase();

    try {
      // Check for oil change related queries
      if (lowerInput.includes('oli') || lowerInput.includes('ganti oli') ||
          lowerInput.includes('berapa km') || lowerInput.includes('berapa sering')) {
        if (lowerInput.includes('ganti oli') || lowerInput.includes('berapa km') ||
            lowerInput.includes('berapa sering') || lowerInput.includes('jarak ganti')) {
          return await this.handleOilChangeQuery();
        }
      }

      // Check for fuel expense related queries
      if (lowerInput.includes('bbm') || lowerInput.includes('bensin') ||
          lowerInput.includes('berapa liter') || lowerInput.includes('konsumsi')) {
        if (lowerInput.includes('bbm') || lowerInput.includes('bensin') ||
            lowerInput.includes('berapa liter') || lowerInput.includes('konsumsi')) {
          return await this.handleFuelExpenseQuery();
        }
      }

      // Check for order related queries
      if (lowerInput.includes('pendapatan') || lowerInput.includes('order') ||
          lowerInput.includes('pesan') || lowerInput.includes('jualan')) {
        if (lowerInput.includes('pendapatan') || lowerInput.includes('jumlah') ||
            lowerInput.includes('total')) {
          return await this.handleOrderQuery();
        }
      }

      // General summary query
      if (lowerInput.includes('ringkasan') || lowerInput.includes('total') ||
          lowerInput.includes('laporan') || lowerInput.includes('statistik')) {
        return await this.handleGeneralSummaryQuery();
      }

      return null;
    } catch (error) {
      console.error('Error handling data query:', error);
      return null;
    }
  }

  /**
   * Handle oil change related queries
   */
  private async handleOilChangeQuery(): Promise<string> {
    try {
      const oilChanges = await DataModel.getOilChanges();

      if (oilChanges.length === 0) {
        return '❌ Belum ada data penggantian oli yang dicatat. Anda bisa menambahkan penggantian oli baru dengan perintah seperti: "Ganti oli seharga 100.000 dengan kilometer 15.000".';
      }

      // Sort by date to get the most recent
      oilChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate average interval between oil changes if we have multiple records
      let avgIntervalKm = 0;
      let totalIntervals = 0;

      if (oilChanges.length > 1) {
        for (let i = 1; i < oilChanges.length; i++) {
          if (oilChanges[i].mileage !== undefined && oilChanges[i-1].mileage !== undefined) {
            const interval = oilChanges[i-1].mileage - oilChanges[i].mileage;
            if (interval > 0) {
              avgIntervalKm += interval;
              totalIntervals++;
            }
          }
        }

        if (totalIntervals > 0) {
          avgIntervalKm = Math.round(avgIntervalKm / totalIntervals);
        }
      }

      const lastOilChange = oilChanges[0]; // Most recent
      const lastChangeInfo = lastOilChange.mileage ?
        `Kilometer terakhir: ${lastOilChange.mileage} km\n` : '';

      let response = `🔧 Informasi Penggantian Oli:\n`;
      response += `- Jumlah data: ${oilChanges.length} kali penggantian\n`;
      response += `- Terakhir: ${lastOilChange.date} dengan biaya Rp ${lastOilChange.amount.toLocaleString('id-ID')}\n`;
      response += lastChangeInfo;

      if (avgIntervalKm > 0) {
        response += `- Rata-rata jarak ganti oli: ${avgIntervalKm} km\n`;
        response += `- Rekomendasi: Ganti oli setiap ${avgIntervalKm} km atau sesuai jadwal perawatan kendaraan Anda.`;
      } else {
        response += `- Rekomendasi umum: Ganti oli setiap 5.000 - 10.000 km (tergantung jenis oli dan kondisi penggunaan).`;
      }

      // Provide custom next oil change recommendation based on user's input pattern or default
      if (lastOilChange.mileage !== undefined) {
        const suggestedNextChange = lastOilChange.mileage + (avgIntervalKm > 0 ? avgIntervalKm : 5000);
        response += `\n- Rekomendasi ganti oli berikutnya: sekitar ${suggestedNextChange} km.`;
      }

      return response;
    } catch (error) {
      console.error('Error getting oil change data:', error);
      return '❌ Gagal mengambil data penggantian oli.';
    }
  }

  /**
   * Handle fuel expense related queries
   */
  private async handleFuelExpenseQuery(): Promise<string> {
    try {
      const fuelExpenses = await DataModel.getFuelExpenses();

      if (fuelExpenses.length === 0) {
        return '❌ Belum ada data pengeluaran BBM yang dicatat. Anda bisa menambahkan pengeluaran BBM baru dengan perintah seperti: "Isi bensin 10 liter seharga 15.000".';
      }

      // Calculate statistics
      let totalAmount = 0;
      let totalLiters = 0;
      let avgPricePerLiter = 0;

      for (const expense of fuelExpenses) {
        totalAmount += expense.amount || 0;
        if (expense.liters !== undefined) {
          totalLiters += expense.liters;
        }
      }

      if (totalLiters > 0) {
        avgPricePerLiter = totalAmount / totalLiters;
      }

      let response = `⛽ Informasi Pengeluaran BBM:\n`;
      response += `- Jumlah data: ${fuelExpenses.length} kali pengisian\n`;
      response += `- Total pengeluaran: Rp ${totalAmount.toLocaleString('id-ID')}\n`;

      if (totalLiters > 0) {
        response += `- Total liter: ${totalLiters.toFixed(2)} liter\n`;
        response += `- Rata-rata harga per liter: Rp ${Math.round(avgPricePerLiter).toLocaleString('id-ID')}\n`;
      }

      // Find most recent fuel expense
      fuelExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recentExpense = fuelExpenses[0];
      response += `- Terakhir: ${recentExpense.date}, ${recentExpense.liters || 0} liter, Rp ${recentExpense.amount?.toLocaleString('id-ID') || 0}`;

      return response;
    } catch (error) {
      console.error('Error getting fuel expense data:', error);
      return '❌ Gagal mengambil data pengeluaran BBM.';
    }
  }

  /**
   * Handle order related queries
   */
  private async handleOrderQuery(): Promise<string> {
    try {
      const orders = await DataModel.getOrders();

      if (orders.length === 0) {
        return '❌ Belum ada data pesanan yang dicatat. Anda bisa menambahkan pesanan baru dengan perintah seperti: "Saya mendapat pesanan seharga 200.000".';
      }

      // Calculate statistics
      let totalAmount = 0;
      for (const order of orders) {
        totalAmount += order.amount || 0;
      }

      let response = `💰 Informasi Pesanan:\n`;
      response += `- Jumlah data: ${orders.length} pesanan\n`;
      response += `- Total pendapatan: Rp ${totalAmount.toLocaleString('id-ID')}\n`;

      if (orders.length > 0) {
        // Find most recent order
        orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recentOrder = orders[0];
        response += `- Pesanan terakhir: ${recentOrder.date}, Rp ${recentOrder.amount.toLocaleString('id-ID')}`;
      }

      return response;
    } catch (error) {
      console.error('Error getting order data:', error);
      return '❌ Gagal mengambil data pesanan.';
    }
  }

  /**
   * Handle general summary queries
   */
  private async handleGeneralSummaryQuery(): Promise<string> {
    try {
      const orders = await DataModel.getOrders();
      const fuelExpenses = await DataModel.getFuelExpenses();
      const oilChanges = await DataModel.getOilChanges();

      let totalOrders = 0;
      for (const order of orders) {
        totalOrders += order.amount || 0;
      }

      let totalFuel = 0;
      for (const expense of fuelExpenses) {
        totalFuel += expense.amount || 0;
      }

      let totalOli = 0;
      for (const change of oilChanges) {
        totalOli += change.amount || 0;
      }

      const netIncome = totalOrders - totalFuel - totalOli;

      let response = `📊 Ringkasan Keuangan:\n`;
      response += `- Pendapatan (Pesanan): Rp ${totalOrders.toLocaleString('id-ID')} (${orders.length} transaksi)\n`;
      response += `- Pengeluaran (BBM): Rp ${totalFuel.toLocaleString('id-ID')} (${fuelExpenses.length} pengisian)\n`;
      response += `- Pengeluaran (Oli): Rp ${totalOli.toLocaleString('id-ID')} (${oilChanges.length} penggantian)\n`;
      response += `- Pendapatan Bersih: Rp ${netIncome.toLocaleString('id-ID')}`;

      return response;
    } catch (error) {
      console.error('Error getting general summary:', error);
      return '❌ Gagal mengambil ringkasan keuangan.';
    }
  }

  /**
   * Enhanced data query handler for universal questions
   */
  async handleUniversalQuery(userInput: string): Promise<string | null> {
    const lowerInput = userInput.toLowerCase();

    try {
      // Handle custom oil change recommendations first
      const customOilRecommendation = await this.handleCustomOilChangeRecommendation(userInput);
      if (customOilRecommendation) {
        return customOilRecommendation;
      }

      // Handle specific queries about km for oil change
      if (lowerInput.includes('berapa km') && (lowerInput.includes('ganti oli') || lowerInput.includes('oli'))) {
        return await this.handleOilChangeQuery();
      }

      // Handle queries about fuel consumption
      if (lowerInput.includes('berapa liter') && (lowerInput.includes('bbm') || lowerInput.includes('bensin'))) {
        return await this.handleFuelExpenseQuery();
      }

      // Handle queries about income
      if (lowerInput.includes('berapa') && (lowerInput.includes('pendapatan') || lowerInput.includes('order'))) {
        return await this.handleOrderQuery();
      }

      // Handle general financial summary
      if (lowerInput.includes('ringkasan') || lowerInput.includes('total') || lowerInput.includes('berapa')) {
        return await this.handleGeneralSummaryQuery();
      }

      // Handle "when was last" queries
      if (lowerInput.includes('kapan') || lowerInput.includes('terakhir')) {
        // Check for last oil change
        if (lowerInput.includes('oli')) {
          return await this.handleLastOilChangeQuery();
        }
        // Check for last fuel expense
        if (lowerInput.includes('bbm') || lowerInput.includes('bensin')) {
          return await this.handleLastFuelExpenseQuery();
        }
        // Check for last order
        if (lowerInput.includes('order') || lowerInput.includes('pesan')) {
          return await this.handleLastOrderQuery();
        }
      }

      return null;
    } catch (error) {
      console.error('Error in universal query handler:', error);
      return null;
    }
  }

  /**
   * Handle query about last oil change
   */
  private async handleLastOilChangeQuery(): Promise<string> {
    try {
      const oilChanges = await DataModel.getOilChanges();

      if (oilChanges.length === 0) {
        return '❌ Belum ada data penggantian oli yang dicatat.';
      }

      // Sort by date to get the most recent
      oilChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastOilChange = oilChanges[0]; // Most recent
      const mileageInfo = lastOilChange.mileage ? ` pada kilometer ${lastOilChange.mileage}` : '';

      return `🔧 Penggantian oli terakhir: ${lastOilChange.date}${mileageInfo} dengan biaya Rp ${lastOilChange.amount.toLocaleString('id-ID')}`;
    } catch (error) {
      console.error('Error getting last oil change:', error);
      return '❌ Gagal mengambil data penggantian oli terakhir.';
    }
  }

  /**
   * Handle custom oil change recommendation queries
   */
  private async handleCustomOilChangeRecommendation(userInput: string): Promise<string | null> {
    const lowerInput = userInput.toLowerCase();

    // Look for patterns like "ganti oli berikutnya di 2000km" or "berapa km untuk ganti oli dengan interval 3000"
    const customKmPattern = /(?:di|pada|pada\s+km|di\s+km|setelah|setelah\s+km)\s*(\d{1,4})\s*(?:km|kilometer)/i;
    const customKmMatch = userInput.match(customKmPattern);

    if (customKmMatch) {
      const customKm = parseInt(customKmMatch[1], 10);

      // Check if the user is asking for a specific recommendation
      if (lowerInput.includes('berapa') || lowerInput.includes('kapan') || lowerInput.includes('waktu') || lowerInput.includes('jadwal')) {
        // Get the last oil change to calculate from that point
        const oilChanges = await DataModel.getOilChanges();
        if (oilChanges.length > 0) {
          // Sort by date to get the most recent
          oilChanges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const lastOilChange = oilChanges[0]; // Most recent

          if (lastOilChange.mileage !== undefined) {
            const nextChangeKm = lastOilChange.mileage + customKm;
            const kmRemaining = nextChangeKm - lastOilChange.mileage; // This should be the same as customKm

            return `🔧 Rekomendasi ganti oli berdasarkan interval ${customKm} km:\n`
              + `- Kilometer ganti oli terakhir: ${lastOilChange.mileage} km\n`
              + `- Rekomendasi ganti oli berikutnya: ${nextChangeKm} km\n`
              + `- Interval yang disarankan: ${customKm} km`;
          }
        }

        // If no previous data, just return the custom interval info
        return `🔧 Rekomendasi ganti oli berdasarkan interval ${customKm} km:\n`
          + `- Ganti oli setiap ${customKm} km\n`
          + `- Ini adalah interval kustom yang Anda tentukan`;
      }
    }

    // Check for specific queries about custom intervals
    if (lowerInput.includes('custom') || lowerInput.includes('atur') || lowerInput.includes('set') || lowerInput.includes('manual')) {
      // Look for numbers in the query that could represent km intervals
      const kmNumberPattern = /(\d{3,4})\s*(?:km|kilometer)/i;
      const kmNumberMatch = userInput.match(kmNumberPattern);

      if (kmNumberMatch) {
        const kmValue = parseInt(kmNumberMatch[1], 10);
        return `🔧 Interval ganti oli kustom yang disarankan: ${kmValue} km\n`
          + `- Anda dapat menyesuaikan interval ini sesuai kebutuhan kendaraan Anda\n`
          + `- Pastikan interval ini sesuai dengan jenis oli dan kondisi penggunaan kendaraan`;
      }
    }

    return null;
  }

  /**
   * Handle query about last fuel expense
   */
  private async handleLastFuelExpenseQuery(): Promise<string> {
    try {
      const fuelExpenses = await DataModel.getFuelExpenses();

      if (fuelExpenses.length === 0) {
        return '❌ Belum ada data pengeluaran BBM yang dicatat.';
      }

      // Sort by date to get the most recent
      fuelExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastFuelExpense = fuelExpenses[0]; // Most recent
      const litersInfo = lastFuelExpense.liters ? ` sebanyak ${lastFuelExpense.liters} liter` : '';

      return `⛽ Pengeluaran BBM terakhir: ${lastFuelExpense.date}${litersInfo} dengan biaya Rp ${lastFuelExpense.amount?.toLocaleString('id-ID') || 0}`;
    } catch (error) {
      console.error('Error getting last fuel expense:', error);
      return '❌ Gagal mengambil data pengeluaran BBM terakhir.';
    }
  }

  /**
   * Handle query about last order
   */
  private async handleLastOrderQuery(): Promise<string> {
    try {
      const orders = await DataModel.getOrders();

      if (orders.length === 0) {
        return '❌ Belum ada data pesanan yang dicatat.';
      }

      // Sort by date to get the most recent
      orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastOrder = orders[0]; // Most recent

      return `💰 Pesanan terakhir: ${lastOrder.date} sebesar Rp ${lastOrder.amount.toLocaleString('id-ID')}`;
    } catch (error) {
      console.error('Error getting last order:', error);
      return '❌ Gagal mengambil data pesanan terakhir.';
    }
  }

  /**
   * Extract amount from input for direct checking
   */
  private extractAmount(input: string): number | null {
    // This function will try to find numeric values in the input that could represent money amounts
    // First try the main amount pattern
    const amountRegex = /(?:Rp\s*|IDR\s*)?([\d.,\s]+juta|[\d.,\s]+jt|[\d.,\s]+k|[\d.,\s]+ribu|[\d.,\s]+)/gi;
    const amounts = [...input.matchAll(amountRegex)];

    if (amounts.length > 0) {
      let amountStr = amounts[0][1].replace(/\s+/g, '');
      let amountValue = amountStr.replace(/[.,]/g, '');

      if (amountValue.toLowerCase().includes('juta') || amountValue.toLowerCase().includes('jt')) {
        const millionValue = parseFloat(amountValue.replace(/[a-zA-Z]/g, '').replace(/\s+/g, ''));
        return Math.round(millionValue * 1_000_000);
      } else if (amountValue.toLowerCase().includes('k') || amountValue.toLowerCase().includes('rb')) {
        const thousandValue = parseFloat(amountValue.replace(/[a-zA-Z]/g, '').replace(/\s+/g, ''));
        return Math.round(thousandValue * 1_000);
      } else {
        return parseInt(amountValue, 10) || 0;
      }
    }

    // If the main pattern didn't work, try a more general number pattern for Indonesian context
    // Looking for patterns like "30.000", "150,000", etc.
    const generalNumberRegex = /(?:Rp\s*)?(\d{1,3}(?:[.,]\d{3})+)/g;
    const generalNumbers = [...input.matchAll(generalNumberRegex)];

    if (generalNumbers.length > 0) {
      // Find the most likely amount by filtering out dates and other non-amount numbers
      for (const match of generalNumbers) {
        const numStr = match[1].replace(/[.,]/g, ''); // Remove formatting to get the raw number
        const numValue = parseInt(numStr, 10);

        // Filter out numbers that look like dates (like 2023, 2024) or too small to be money amounts
        if (numValue >= 1000) { // Minimum amount for a money transaction
          return numValue;
        }
      }
    }

    return null;
  }

  /**
   * Confirm a pending action
   */
  private async confirmAction(sessionId: string): Promise<{ success: boolean; message: string }> {
    const pendingAction = this.pendingActions.get(sessionId);

    if (!pendingAction) {
      console.log(`No pending action found for session ${sessionId}`);

      // Instead of using fallback from other sessions, be explicit that no action exists for this session
      // This prevents cross-session data issues
      return {
        success: false,
        message: 'Tidak ada aksi yang menunggu konfirmasi untuk percakapan ini. Silakan masukkan perintah yang ingin Anda lakukan.'
      };
    }

    return await this.executeAction(pendingAction, sessionId);
  }

  /**
   * Execute the pending action and save to database
   */
  private async executeAction(pendingAction: PendingAction, sessionId: string): Promise<{ success: boolean; message: string }> {
    console.log(`Confirming action for session ${sessionId}:`, pendingAction);

    try {
      // Double-check that the pending action matches the session ID
      if (pendingAction.sessionId !== sessionId) {
        console.warn(`Session ID mismatch: expected ${sessionId}, got ${pendingAction.sessionId}`);
        return {
          success: false,
          message: 'Terjadi kesalahan: tidak dapat mengkonfirmasi data karena perbedaan percakapan. Silakan coba lagi.'
        };
      }

      switch (pendingAction.dataType) {
        case 'order':
          await DataModel.addOrder(pendingAction.data);
          console.log('Order added successfully');
          break;
        case 'fuel_expense':
          await DataModel.addFuelExpense(pendingAction.data);
          console.log('Fuel expense added successfully');
          break;
        case 'oil_change':
          await DataModel.addOilChange(pendingAction.data);
          console.log('Oil change added successfully');
          break;
      }

      // Clear the pending action
      this.pendingActions.delete(sessionId);

      return {
        success: true,
        message: pendingAction.type === 'add'
          ? `✅ Data ${pendingAction.dataType.replace('_', ' ')} berhasil ditambahkan:\n- Jumlah: Rp ${pendingAction.data.amount.toLocaleString('id-ID')}\n- Tanggal: ${pendingAction.data.date}\n- Deskripsi: ${pendingAction.data.description || 'Tanpa keterangan'}`
          : `✅ Data ${pendingAction.dataType.replace('_', ' ')} berhasil diperbarui.`
      };
    } catch (error) {
      console.error('Error confirming action:', error);
      return {
        success: false,
        message: 'Gagal menyimpan data. Silakan coba lagi.'
      };
    }
  }

  /**
   * Reject a pending action
   */
  private async rejectAction(sessionId: string): Promise<{ success: boolean; message: string }> {
    const pendingAction = this.pendingActions.get(sessionId);

    if (!pendingAction) {
      return {
        success: false,
        message: 'Tidak ada aksi yang menunggu konfirmasi untuk percakapan ini.'
      };
    }

    // Clear the pending action
    this.pendingActions.delete(sessionId);

    return {
      success: true,
      message: 'Aksi dibatalkan. Silakan masukkan perintah baru.'
    };
  }

  /**
   * Handle order creation
   */
  private async handleOrder(parsed: ParsedIntent, sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate that we have a proper amount
      if (!parsed.entities.amount || parsed.entities.amount <= 0) {
        // If no amount is provided, try to calculate from either pricePerItem or quantity if one is missing
        if (parsed.entities.pricePerItem && parsed.entities.quantity) {
          parsed.entities.amount = parsed.entities.pricePerItem * parsed.entities.quantity;
        } else {
          // Return error if no amount can be determined
          return {
            success: false,
            message: `Tidak dapat menemukan jumlah uang dalam perintah Anda. Silakan ulangi perintah dengan menyebutkan jumlahnya, contoh: "Saya mendapat pesanan 150.000"`
          };
        }
      }

      // Determine the amount to use - if pricePerItem and quantity are provided, calculate the total
      let calculatedAmount = parsed.entities.amount || 0;
      if (parsed.entities.pricePerItem && parsed.entities.quantity) {
        calculatedAmount = parsed.entities.pricePerItem * parsed.entities.quantity;
      }

      const order: Omit<Order, 'id'> = {
        amount: calculatedAmount,
        date: parsed.entities.date || new Date().toISOString().split('T')[0],
        description: parsed.entities.description || 'Pesanan dari chatbot',
        quantity: parsed.entities.quantity,
        pricePerItem: parsed.entities.pricePerItem
      };

      // Store the action as pending for confirmation
      const pendingAction: PendingAction = {
        type: 'add',
        dataType: 'order',
        data: order,
        sessionId
      };
      this.pendingActions.set(sessionId, pendingAction);

      const quantityText = order.quantity !== undefined ? ` (Jumlah: ${order.quantity})` : '';
      const pricePerItemText = order.pricePerItem ? ` @ Rp ${order.pricePerItem.toLocaleString('id-ID')}/item` : '';
      return {
        success: true,
        message: `📝 Konfirmasi pesanan:${quantityText}${pricePerItemText}\n- Total: Rp ${order.amount.toLocaleString('id-ID')}\n- Tanggal: ${order.date}\n- Deskripsi: ${order.description}\n\n✅ Balas dengan "ya" untuk menyimpan atau "tidak" untuk membatalkan.`
      };
    } catch (error) {
      console.error('Error preparing order:', error);
      return { success: false, message: 'Gagal menyiapkan pesanan untuk konfirmasi.' };
    }
  }

  /**
   * Handle fuel expense creation
   */
  private async handleFuelExpense(parsed: ParsedIntent, sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate that we have a proper amount
      if (!parsed.entities.amount || parsed.entities.amount <= 0) {
        // Try to re-extract amount from the original input
        return {
          success: false,
          message: `Tidak dapat menemukan jumlah uang dalam perintah Anda. Silakan ulangi perintah dengan menyebutkan jumlahnya, contoh: "Catat bensin hari ini sebesar 30.000"`
        };
      }

      const expense: Omit<FuelExpense, 'id'> = {
        amount: parsed.entities.amount,
        date: parsed.entities.date || new Date().toISOString().split('T')[0],
        liters: parsed.entities.liters,
        description: parsed.entities.description || 'Pengeluaran BBM dari chatbot'
      };

      // Store the action as pending for confirmation
      const pendingAction: PendingAction = {
        type: 'add',
        dataType: 'fuel_expense',
        data: expense,
        sessionId
      };
      this.pendingActions.set(sessionId, pendingAction);

      const litersText = expense.liters !== undefined ? ` (${expense.liters} liter)` : '';
      return {
        success: true,
        message: `⛽ Konfirmasi pengeluaran BBM:\n- Jumlah: Rp ${expense.amount.toLocaleString('id-ID')}${litersText}\n- Tanggal: ${expense.date}\n- Deskripsi: ${expense.description}\n\n✅ Balas dengan "ya" untuk menyimpan atau "tidak" untuk membatalkan.`
      };
    } catch (error) {
      console.error('Error preparing fuel expense:', error);
      return { success: false, message: 'Gagal menyiapkan pengeluaran BBM untuk konfirmasi.' };
    }
  }

  /**
   * Handle oil change creation
   */
  private async handleOilChange(parsed: ParsedIntent, sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate that we have a proper amount
      if (!parsed.entities.amount || parsed.entities.amount <= 0) {
        return {
          success: false,
          message: `Tidak dapat menemukan jumlah uang dalam perintah Anda. Silakan ulangi perintah dengan menyebutkan jumlahnya, contoh: "Catat ganti oli hari ini sebesar 75.000"`
        };
      }

      const change: Omit<OilChange, 'id'> = {
        amount: parsed.entities.amount,
        date: parsed.entities.date || new Date().toISOString().split('T')[0],
        mileage: parsed.entities.mileage,
        description: parsed.entities.description || 'Ganti oli dari chatbot'
      };

      // Store the action as pending for confirmation
      const pendingAction: PendingAction = {
        type: 'add',
        dataType: 'oil_change',
        data: change,
        sessionId
      };
      this.pendingActions.set(sessionId, pendingAction);

      const mileageText = change.mileage !== undefined ? ` (km: ${change.mileage})` : '';
      return {
        success: true,
        message: `🔧 Konfirmasi penggantian oli:\n- Jumlah: Rp ${change.amount.toLocaleString('id-ID')}${mileageText}\n- Tanggal: ${change.date}\n- Deskripsi: ${change.description}\n\n✅ Balas dengan "ya" untuk menyimpan atau "tidak" untuk membatalkan.`
      };
    } catch (error) {
      console.error('Error preparing oil change:', error);
      return { success: false, message: 'Gagal menyiapkan penggantian oli untuk konfirmasi.' };
    }
  }

  /**
   * Reset pending action for a specific session
   * @param sessionId The session ID to reset
   */
  resetSession(sessionId: string): void {
    console.log(`Resetting session ${sessionId}`);
    this.pendingActions.delete(sessionId);
  }
}

export const aiDatabaseService = AIDatabaseService.getInstance();
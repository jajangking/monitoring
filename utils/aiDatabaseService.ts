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

    // Determine intent
    let intent: ParsedIntent['intent'] = 'unknown';
    for (const [intentType, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        intent = intentType as ParsedIntent['intent'];
        break;
      }
    }

    // Extract entities using regex patterns
    const entities = this.extractEntities(userInput);

    return { intent, entities };
  }

  /**
   * Extract entities from user input using regex patterns
   */
  private extractEntities(input: string): ParsedIntent['entities'] {
    const entities: ParsedIntent['entities'] = {};

    // Extract amount (Rp, rupiah, or numbers)
    const amountRegex = /(?:Rp|IDR)?\s*([\d.,]+)(?:\s*(?:ribu|ratusan|juta|k|jutaan|ribuan|000|,|\.))*|(\d+)\s*(?:ribu|k)/gi;
    const amounts = [...input.matchAll(amountRegex)];
    
    if (amounts.length > 0) {
      const amountStr = amounts[0][1] || amounts[0][2] || '';
      if (amountStr) {
        // Handle various formats like "1.500.000", "1,500,000", "1500000", "1,5jt", etc.
        let amountValue = amountStr.replace(/[.,]/g, '');
        if (amountValue.toLowerCase().includes('jt') || amountValue.toLowerCase().includes('j')) {
          // Handle million values
          const millionValue = parseFloat(amountValue.replace(/[a-zA-Z]/g, ''));
          entities.amount = Math.round(millionValue * 1_000_000);
        } else if (amountValue.toLowerCase().includes('k') && !amountValue.toLowerCase().includes('jt')) {
          // Handle thousand values
          const thousandValue = parseFloat(amountValue.replace(/[a-zA-Z]/g, ''));
          entities.amount = Math.round(thousandValue * 1_000);
        } else {
          entities.amount = parseInt(amountValue, 10) || 0;
        }
      }
    }

    // Extract description
    const descriptionMatches = input.match(/(?:deskripsi|keterangan|untuk|keperluan):\s*([^,;.]+)/i);
    if (descriptionMatches) {
      entities.description = descriptionMatches[1].trim();
    } else {
      // If no explicit description, try to extract what follows amount or date
      const amountMatch = input.match(/(?:Rp|IDR)?\s*[\d.,]+\s*(.*)/i);
      if (amountMatch && amountMatch[1].trim()) {
        entities.description = amountMatch[1].trim();
      } else {
        entities.description = input.slice(0, 50); // Use first 50 chars as description
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
          lowerInput.includes('iya') || lowerInput.includes('setuju') || lowerInput.includes('benar')) {
        return await this.confirmAction(sessionId);
      } else if (lowerInput.includes('tidak') || lowerInput.includes('batal') ||
                 lowerInput.includes('cancel') || lowerInput.includes('hapus')) {
        return await this.rejectAction(sessionId);
      }

      const parsed = await this.parseUserInput(userInput);

      switch (parsed.intent) {
        case 'order':
          return await this.handleOrder(parsed, sessionId);
        case 'fuel_expense':
          return await this.handleFuelExpense(parsed, sessionId);
        case 'oil_change':
          return await this.handleOilChange(parsed, sessionId);
        case 'query':
          return { success: false, message: 'Permintaan Anda adalah permintaan informasi yang akan ditangani oleh layanan AI standar.' };
        case 'unknown':
          return { success: false, message: 'Saya tidak mengenali maksud dari permintaan Anda. Coba sebutkan kata kunci seperti "pesan", "bbm", atau "oli".' };
        default:
          return { success: false, message: 'Tidak dapat memproses permintaan Anda.' };
      }
    } catch (error) {
      console.error('Error processing intent:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.'
      };
    }
  }

  /**
   * Confirm a pending action
   */
  private async confirmAction(sessionId: string): Promise<{ success: boolean; message: string }> {
    const pendingAction = this.pendingActions.get(sessionId);

    if (!pendingAction) {
      console.log(`No pending action found for session ${sessionId}`);
      return {
        success: false,
        message: 'Tidak ada aksi yang menunggu konfirmasi. Silakan masukkan perintah yang ingin Anda lakukan.'
      };
    }

    console.log(`Confirming action for session ${sessionId}:`, pendingAction);

    try {
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
          ? `✅ Data ${pendingAction.dataType.replace('_', ' ')} berhasil ditambahkan: Rp ${pendingAction.data.amount.toLocaleString('id-ID')} - ${pendingAction.data.description || 'Tanpa keterangan'}`
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
        message: 'Tidak ada aksi yang menunggu konfirmasi.'
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
      // Determine the amount to use - if pricePerItem and quantity are provided, calculate the total
      let calculatedAmount = parsed.entities.amount || 0;
      if (parsed.entities.pricePerItem && parsed.entities.quantity) {
        calculatedAmount = parsed.entities.pricePerItem * parsed.entities.quantity;
      } else if (!parsed.entities.amount) {
        // If no amount is provided, try to calculate from either pricePerItem or quantity if one is missing
        if (parsed.entities.pricePerItem && parsed.entities.quantity) {
          calculatedAmount = parsed.entities.pricePerItem * parsed.entities.quantity;
        } else if (parsed.entities.amount) {
          calculatedAmount = parsed.entities.amount;
        }
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
        message: `Konfirmasi pesanan:${quantityText}${pricePerItemText}\n- Total: Rp ${order.amount.toLocaleString('id-ID')}\n- Tanggal: ${order.date}\n- Deskripsi: ${order.description}\n\nApakah data ini sudah benar? Silakan balas dengan "ya" untuk menyetujui atau "tidak" untuk membatalkan.`
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
      const expense: Omit<FuelExpense, 'id'> = {
        amount: parsed.entities.amount || 0,
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
        message: `Konfirmasi pengeluaran BBM:\n- Jumlah: Rp ${expense.amount.toLocaleString('id-ID')}${litersText}\n- Tanggal: ${expense.date}\n- Deskripsi: ${expense.description}\n\nApakah data ini sudah benar? Silakan balas dengan "ya" untuk menyetujui atau "tidak" untuk membatalkan.`
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
      const change: Omit<OilChange, 'id'> = {
        amount: parsed.entities.amount || 0,
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
        message: `Konfirmasi penggantian oli:\n- Jumlah: Rp ${change.amount.toLocaleString('id-ID')}${mileageText}\n- Tanggal: ${change.date}\n- Deskripsi: ${change.description}\n\nApakah data ini sudah benar? Silakan balas dengan "ya" untuk menyetujui atau "tidak" untuk membatalkan.`
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
    this.pendingActions.delete(sessionId);
  }
}

export const aiDatabaseService = AIDatabaseService.getInstance();
// enhancedAI.ts - Enhanced AI service with improved capabilities
import { aiService } from './aiService';

interface AIContext {
  lastUserMessage?: string;
  lastBotResponse?: string;
  conversationHistory?: Array<{role: string, content: string}>;
  userData?: Record<string, any>;
}

export class EnhancedAIService {
  private static instance: EnhancedAIService;
  
  public static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  /**
   * Enhanced AI response that understands the monitoring app context
   */
  async getEnhancedAIResponse(userInput: string, context?: AIContext): Promise<string> {
    try {
      // Process user input to determine intent
      const processedInput = this.processUserInput(userInput, context);
      
      // Use the AI service directly
      return await this.callAIServiceEnhanced(userInput, processedInput, context);
    } catch (error) {
      console.error('Error in enhanced AI service:', error);
      return 'Maaf, saya sedang mengalami kendala teknis. Bisakah Anda coba ulang permintaan Anda?';
    }
  }

  /**
   * Process user input to understand intent
   */
  private processUserInput(userInput: string, context?: AIContext): { intent: string, entities: string[] } {
    const lowerInput = userInput.toLowerCase();
    
    // Define intents and keywords
    const intents = {
      greeting: ['halo', 'hai', 'hi', 'hello', 'selamat', 'pagi', 'siang', 'malam'],
      order: ['pesan', 'order', 'transaksi', 'jualan', 'penjualan', 'dagang', 'usaha'],
      fuel: ['bbm', 'bahan bakar', 'bensin', 'solar', 'pertamax', 'premium', 'harga bbm', 'isi bensin'],
      oil: ['oli', 'oli mesin', 'ganti oli', 'penggantian oli', 'minyak pelumas'],
      dashboard: ['ringkasan', 'laporan', 'keuangan', 'uang', 'pendapatan', 'pengeluaran', 'balance', 'data'],
      help: ['bantuan', 'tolong', 'cara pakai', 'panduan', 'manual', 'cara', 'bagaimana', 'gunakan'],
      date_time: ['tanggal', 'hari', 'waktu', 'jam', 'kapan', 'sekarang', 'saat ini'],
      reset: ['reset', 'hapus', 'bersihkan', 'kosongkan', 'ulang'],
      settings: ['pengaturan', 'setting', 'ubah', 'konfigurasi', 'atur']
    };
    
    const detectedEntities: string[] = [];
    let matchedIntent = 'general';
    
    // Check for intent matches
    for (const [intent, keywords] of Object.entries(intents)) {
      for (const keyword of keywords) {
        if (lowerInput.includes(keyword)) {
          matchedIntent = intent;
          detectedEntities.push(keyword);
          break;
        }
      }
    }
    
    return { intent: matchedIntent, entities: detectedEntities };
  }

  /**
   * Call AI service with enhanced prompting
   */
  private async callAIServiceEnhanced(userInput: string, processedInput: { intent: string, entities: string[] }, context?: AIContext): Promise<string> {
    // Create a more contextual prompt for the AI
    const enhancedPrompt = this.createEnhancedPrompt(userInput, processedInput, context);
    
    return aiService.getAIResponse(enhancedPrompt, context?.conversationHistory);
  }

  /**
   * Create enhanced prompt with context
   */
  private createEnhancedPrompt(userInput: string, processedInput: { intent: string, entities: string[] }, context?: AIContext): string {
    const basePrompt = `Anda adalah asisten virtual untuk aplikasi monitoring keuangan harian. Aplikasi ini membantu pengguna mencatat pesanan, pengeluaran bahan bakar (BBM), dan penggantian oli. 
    
Berikut adalah pertanyaan pengguna: "${userInput}"

Inten: ${processedInput.intent}
Entitas: ${processedInput.entities.join(', ')}

Silakan berikan jawaban yang membantu dan relevan dalam konteks aplikasi monitoring keuangan.`;

    if (context?.lastUserMessage) {
      return basePrompt + `\n\nPesan sebelumnya: "${context.lastUserMessage}"`;
    }
    
    return basePrompt;
  }

  /**
   * Enhanced fallback responses with better context understanding
   */
  private getEnhancedFallbackResponse(userInput: string, context?: AIContext): string {
    const input = userInput.toLowerCase();
    const processedInput = this.processUserInput(userInput, context);
    
    switch (processedInput.intent) {
      case 'greeting':
        return this.handleGreeting(input);
        
      case 'order':
        return this.handleOrderQuestion(input);
        
      case 'fuel':
        return this.handleFuelQuestion(input);
        
      case 'oil':
        return this.handleOilQuestion(input);
        
      case 'dashboard':
        return this.handleDashboardQuestion(input);
        
      case 'help':
        return this.handleHelpQuestion(input);
        
      case 'date_time':
        return this.handleDateTimeQuestion();
        
      case 'settings':
        return this.handleSettingsQuestion();
        
      case 'reset':
        return this.handleResetQuestion();
        
      default:
        return this.handleGeneralQuestion(input);
    }
  }

  private handleGreeting(input: string): string {
    const greetings = [
      'Halo! Saya asisten virtual untuk aplikasi monitoring keuangan Anda. Saya bisa membantu Anda dengan mencatat pesanan, pengeluaran BBM, atau penggantian oli. Ada yang bisa saya bantu?',
      'Selamat datang! Saya di sini untuk membantu mengelola keuangan harian Anda. Anda bisa bertanya tentang fitur pesanan, BBM, atau oli.',
      'Hai! Saya asisten keuangan harian Anda. Ingin saya bantu mencatat pesanan baru atau mengecek pengeluaran BBM Anda?'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private handleOrderQuestion(input: string): string {
    if (input.includes('baru') || input.includes('tambah')) {
      return 'Untuk menambah pesanan baru, buka tab "Pesanan" lalu ketuk tombol +. Isi detail pesanan seperti nama pelanggan, tanggal, dan jumlah pembayaran. Data akan otomatis disimpan.';
    } else if (input.includes('lihat') || input.includes('cek') || input.includes('berapa')) {
      return 'Untuk melihat daftar pesanan, buka tab "Pesanan". Anda bisa melihat semua pesanan beserta tanggal dan jumlah pembayaran.';
    } else {
      return 'Fitur pesanan memungkinkan Anda mencatat transaksi harian. Buka tab "Pesanan" untuk menambah, mengedit, atau melihat pesanan Anda. Setiap pesanan akan dihitung dalam ringkasan keuangan.';
    }
  }

  private handleFuelQuestion(input: string): string {
    if (input.includes('baru') || input.includes('tambah') || input.includes('isi')) {
      return 'Untuk mencatat pengeluaran BBM baru, buka tab "BBM" lalu ketuk tombol +. Isi jumlah liter dan biaya pengisian. Aplikasi akan menghitung rata-rata konsumsi BBM Anda.';
    } else if (input.includes('lihat') || input.includes('cek') || input.includes('berapa')) {
      return 'Untuk melihat riwayat pengeluaran BBM, buka tab "BBM". Anda bisa melihat tanggal, jumlah liter, dan biaya pengisian BBM.';
    } else {
      return 'Fitur BBM membantu Anda mencatat pengeluaran bahan bakar. Buka tab "BBM" untuk menambahkan pengeluaran BBM baru. Aplikasi juga akan menampilkan statistik konsumsi BBM Anda.';
    }
  }

  private handleOilQuestion(input: string): string {
    if (input.includes('baru') || input.includes('ganti') || input.includes('tambah')) {
      return 'Untuk mencatat penggantian oli baru, buka tab "Oli" lalu ketuk tombol +. Isi biaya penggantian oli dan kilometer saat penggantian. Ini penting untuk perawatan kendaraan.';
    } else if (input.includes('lihat') || input.includes('cek') || input.includes('jadwal')) {
      return 'Untuk melihat riwayat penggantian oli, buka tab "Oli". Anda bisa melihat tanggal dan kilometer terakhir saat oli diganti.';
    } else {
      return 'Fitur Oli membantu Anda mencatat biaya penggantian oli dan menjaga jadwal perawatan kendaraan. Buka tab "Oli" untuk menambahkan data penggantian oli.';
    }
  }

  private handleDashboardQuestion(input: string): string {
    if (input.includes('total') || input.includes('jumlah') || input.includes('semua')) {
      return 'Tab "Dasbor" menampilkan ringkasan keuangan Anda termasuk total pendapatan dari pesanan, total pengeluaran BBM dan oli, serta pendapatan bersih.';
    } else if (input.includes('grafik') || input.includes('statistik') || input.includes('gambar')) {
      return 'Fitur dasbor saat ini menampilkan data dalam bentuk kartu informasi. Anda bisa melihat tren pendapatan dan pengeluaran harian serta bulanan.';
    } else {
      return 'Tab "Dasbor" menampilkan ringkasan keuangan harian dan bulanan Anda. Di sinilah Anda bisa melihat pendapatan bersih setelah dikurangi pengeluaran BBM dan oli.';
    }
  }

  private handleHelpQuestion(input: string): string {
    return 'Saya di sini untuk membantu Anda menggunakan aplikasi monitoring keuangan harian ini. Berikut beberapa hal yang bisa Anda tanyakan:\n\n• Cara menambah pesanan baru\n• Cara mencatat pengeluaran BBM\n• Cara mencatat penggantian oli\n• Cara melihat ringkasan keuangan\n\nSilakan tanyakan apa pun tentang penggunaan aplikasi ini!';
  }

  private handleDateTimeQuestion(): string {
    const now = new Date();
    return `Hari ini adalah ${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Jam sekarang ${now.toLocaleTimeString('id-ID')}. Pastikan Anda mencatat transaksi dengan tanggal yang tepat agar laporan keuangan akurat.`;
  }

  private handleSettingsQuestion(): string {
    return 'Untuk pengaturan aplikasi, buka tab "Pengaturan". Di sana Anda bisa mereset data, mengganti tema aplikasi antara mode terang dan gelap, serta mengakses pengaturan lainnya.';
  }

  private handleResetQuestion(): string {
    return 'Fitur reset data ada di tab "Pengaturan". Gunakan dengan hati-hati karena semua data pesanan, BBM, dan oli akan dihapus permanen. Pastikan Anda sudah mencadangkan data penting sebelum melakukan reset.';
  }

  private handleGeneralQuestion(input: string): string {
    const generalResponses = [
      'Terima kasih atas pertanyaan Anda. Aplikasi monitoring ini membantu Anda mencatat pesanan, pengeluaran BBM, dan penggantian oli. Buka menu sesuai kebutuhan Anda untuk mulai mencatat.',
      'Saya siap membantu! Jika Anda ingin mencatat pesanan baru, buka tab "Pesanan". Untuk mencatat BBM, buka tab "BBM". Untuk mencatat penggantian oli, buka tab "Oli".',
      'Jika Anda mencari fitur tertentu, coba jelaskan lebih spesifik. Misalnya "cara menambah pesanan" atau "lihat pengeluaran BBM minggu ini".',
      'Aplikasi ini dirancang untuk membantu pengelolaan keuangan harian. Setiap catatan yang Anda buat akan terakumulasi di dasbor untuk memberikan gambaran keuangan keseluruhan.'
    ];
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }
}

export const enhancedAIService = EnhancedAIService.getInstance();
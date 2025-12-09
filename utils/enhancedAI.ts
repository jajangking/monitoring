// enhancedAI.ts - Enhanced AI service with improved capabilities
import { aiService } from './aiService';
import { aiDatabaseService } from './aiDatabaseService';

interface AIContext {
  lastUserMessage?: string;
  lastBotResponse?: string;
  conversationHistory?: Array<{role: string, content: string}>;
  userData?: Record<string, any>;
}

// Define a class to manage conversation context for a single session
class ConversationContext {
  private history: Array<{role: 'user' | 'assistant', content: string}> = [];
  private readonly maxLength: number = 10; // Keep last 10 exchanges

  addMessage(role: 'user' | 'assistant', content: string): void {
    this.history.push({ role, content });
    // Limit history to avoid memory issues
    if (this.history.length > this.maxLength) {
      this.history = this.history.slice(-this.maxLength);
    }
  }

  getHistory(): Array<{role: 'user' | 'assistant', content: string}> {
    return [...this.history]; // Return a copy
  }

  clear(): void {
    this.history = [];
  }
}

export class EnhancedAIService {
  private static instance: EnhancedAIService;
  private globalContext: AIContext = {};
  private conversationContexts: Map<string, ConversationContext> = new Map(); // Key could be user session ID

  public static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  /**
   * Reset the conversation context for a specific session
   * @param sessionId The session ID to reset
   */
  resetConversationContext(sessionId: string): void {
    const conversationContext = this.conversationContexts.get(sessionId);
    if (conversationContext) {
      conversationContext.clear();
    } else {
      // If no context exists for the session, create an empty one
      this.conversationContexts.set(sessionId, new ConversationContext());
    }
  }

  /**
   * Clear all conversation contexts (useful for app reset)
   */
  clearAllConversationContexts(): void {
    this.conversationContexts.clear();
  }

  /**
   * Enhanced AI response that understands the monitoring app context
   */
  async getEnhancedAIResponse(userInput: string, context?: AIContext, sessionId: string = 'default'): Promise<string> {
    try {
      // Check if user wants to reset the conversation
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.includes('reset percakapan') || lowerInput.includes('ulang percakapan') ||
          lowerInput.includes('baru percakapan') || lowerInput.includes('hapus percakapan') ||
          lowerInput.includes('reset session') || lowerInput.includes('baru session')) {
        this.resetConversationContext(sessionId);
        // Also reset the database service context for this session
        this.resetAIDatabaseContext(sessionId);
        return '✅ Percakapan telah direset. Mari kita mulai dari awal. Bagaimana saya bisa membantu Anda hari ini?';
      }

      // Get or create conversation context for this session
      let conversationContext = this.conversationContexts.get(sessionId);
      if (!conversationContext) {
        conversationContext = new ConversationContext();
        this.conversationContexts.set(sessionId, conversationContext);
      }

      // Add user message to conversation history
      conversationContext.addMessage('user', userInput);

      // First, check if the user wants to add data (order, fuel expense, or oil change)
      // or if they're asking for information about existing data
      const databaseResult = await aiDatabaseService.processIntent(userInput, sessionId);

      if (databaseResult.success) {
        // If the intent was successfully processed (either data addition or query), return the success message
        // Add the response to conversation history
        conversationContext.addMessage('assistant', databaseResult.message);
        return databaseResult.message;
      } else if (databaseResult.message.includes('Permintaan informasi')) {
        // If it's an information query, first try to check for data reading queries
        const dataReadingResult = await this.checkForDataReadingQuery(userInput);
        if (dataReadingResult) {
          conversationContext.addMessage('assistant', dataReadingResult);
          return dataReadingResult;
        }

        // If not a data reading query, proceed with normal AI processing
        // Process user input to determine intent
        const processedInput = this.processUserInput(userInput, context);

        // Use the AI service with conversation history
        const response = await this.callAIServiceEnhanced(userInput, processedInput, {
          ...context,
          conversationHistory: conversationContext.getHistory().map(msg => ({ role: msg.role, content: msg.content }))
        });

        // Add the response to conversation history
        conversationContext.addMessage('assistant', response);
        return response;
      } else {
        // If database processing failed for data entry but it was an intent to add data, return the error
        // Otherwise, proceed with normal AI processing
        const parsed = await aiDatabaseService.parseUserInput(userInput);

        // Check if the input contains keywords for data entry but failed for other reasons
        if (parsed.intent !== 'query' && parsed.intent !== 'unknown') {
          // Add the response to conversation history
          conversationContext.addMessage('assistant', databaseResult.message);
          return databaseResult.message;
        } else {
          // First try to check for data reading queries before falling back to AI
          const dataReadingResult = await this.checkForDataReadingQuery(userInput);
          if (dataReadingResult) {
            conversationContext.addMessage('assistant', dataReadingResult);
            return dataReadingResult;
          }

          // Process user input to determine intent
          const processedInput = this.processUserInput(userInput, context);

          // Use the AI service with conversation history
          const response = await this.callAIServiceEnhanced(userInput, processedInput, {
            ...context,
            conversationHistory: conversationContext.getHistory().map(msg => ({ role: msg.role, content: msg.content }))
          });

          // Add the response to conversation history
          conversationContext.addMessage('assistant', response);
          return response;
        }
      }
    } catch (error) {
      console.error('Error in enhanced AI service:', error);
      return 'Maaf, saya sedang mengalami kendala teknis. Bisakah Anda coba ulang permintaan Anda?';
    }
  }

  /**
   * Reset the AI database context for a specific session
   * @param sessionId The session ID to reset
   */
  private resetAIDatabaseContext(sessionId: string): void {
    console.log(`Resetting AI database context for session ${sessionId}`);
    aiDatabaseService.resetSession(sessionId);
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

    // Extract content from conversation history for the AI service
    const conversationHistoryText = context?.conversationHistory?.map(msg => msg.content) || [];
    return aiService.getAIResponse(enhancedPrompt, conversationHistoryText);
  }

  /**
   * Check if the user input is asking for data that we can read from the database
   */
  private async checkForDataReadingQuery(userInput: string): Promise<string | null> {
    // Check if the database service can handle this query
    const lowerInput = userInput.toLowerCase();

    // Check if this is a query about data (not data entry)
    const queryKeywords = [
      'berapa', 'berapa kali', 'berapa km', 'berapa liter', 'berapa harga', 'berapa biaya',
      'berapa jumlah', 'berapa total', 'berapa rata', 'berapa banyak', 'berapa kali',
      'kapan', 'tanggal', 'waktu', 'lama', 'terakhir', 'sejak kapan',
      'cek', 'lihat', 'tampilkan', 'show', 'info', 'informasi',
      'ringkasan', 'report', 'laporan', 'statistik', 'data',
      'berapa sering', 'berapa sering ganti', 'berapa jarak', 'berapa jarak ganti'
    ];

    const isDataQuery = queryKeywords.some(keyword => lowerInput.includes(keyword));

    if (isDataQuery) {
      // Try to handle it with the database service
      const result = await aiDatabaseService.handleUniversalQuery(userInput);
      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * Create enhanced prompt with context
   */
  private createEnhancedPrompt(userInput: string, processedInput: { intent: string, entities: string[] }, context?: AIContext): string {
    const basePrompt = `Anda adalah asisten virtual untuk aplikasi monitoring keuangan harian. Aplikasi ini membantu pengguna mencatat pesanan, pengeluaran bahan bakar (BBM), dan penggantian oli. Berikan jawaban yang membantu dan relevan dalam konteks pengelolaan keuangan harian. Gunakan bahasa Indonesia yang sopan dan mudah dimengerti. Jika pengguna menyebut 'itu', 'tersebut', 'tadi', atau konteks sebelumnya, gunakan percakapan sebelumnya untuk memahami maksud mereka.

Berikut adalah pertanyaan pengguna: "${userInput}"

Inten: ${processedInput.intent}
Entitas: ${processedInput.entities.join(', ')}

Silakan berikan jawaban yang membantu dan relevan dalam konteks aplikasi monitoring keuangan.`;

    // Add conversation history if available
    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      const historyText = context.conversationHistory
        .slice(-4) // Take last 4 exchanges to avoid overwhelming the prompt
        .map(msg => `${msg.role === 'user' ? 'Pengguna' : 'Asisten'}: ${msg.content}`)
        .join('\n');

      if (historyText) {
        return basePrompt + `\n\nRiwayat percakapan:\n${historyText}`;
      }
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
      return 'Anda dapat menambah pesanan baru dengan dua cara:\n1. Buka tab "Pesanan" dan ketuk tombol +, atau\n2. Beri perintah ke saya seperti: "Saya mendapat pesanan seharga 150.000" atau "Tambahkan order dari Pak Budi 85.000". Saya akan meminta konfirmasi sebelum menyimpan.';
    } else if (input.includes('lihat') || input.includes('cek') || input.includes('berapa')) {
      return 'Untuk melihat daftar pesanan, buka tab "Pesanan". Anda bisa melihat semua pesanan beserta tanggal dan jumlah pembayaran.';
    } else {
      return 'Fitur pesanan memungkinkan Anda mencatat transaksi harian. Gunakan perintah seperti "Saya mendapat pesanan 200.000" atau buka tab "Pesanan" secara langsung. Setiap pesanan akan dihitung dalam ringkasan keuangan.';
    }
  }

  private handleFuelQuestion(input: string): string {
    if (input.includes('baru') || input.includes('tambah') || input.includes('isi')) {
      return 'Anda dapat menambahkan pengeluaran BBM baru dengan dua cara:\n1. Buka tab "BBM" dan ketuk tombol +, atau\n2. Cukup beri perintah ke saya seperti: "Saya mengisi bensin 3 liter seharga 30.000" atau "Catat pengeluaran BBM 50.000 untuk 4 liter". Saya akan meminta konfirmasi sebelum menyimpan.';
    } else if (input.includes('lihat') || input.includes('cek') || input.includes('berapa')) {
      return 'Untuk melihat riwayat pengeluaran BBM, buka tab "BBM". Anda bisa melihat tanggal, jumlah liter, dan biaya pengisian BBM.';
    } else {
      return 'Fitur BBM membantu Anda mencatat pengeluaran bahan bakar. Gunakan perintah seperti "Saya mengeluarkan uang 75.000 untuk bensin 6 liter" atau buka tab "BBM" secara langsung. Aplikasi juga akan menampilkan statistik konsumsi BBM Anda.';
    }
  }

  private handleOilQuestion(input: string): string {
    if (input.includes('baru') || input.includes('ganti') || input.includes('tambah')) {
      return 'Anda dapat menambahkan penggantian oli baru dengan dua cara:\n1. Buka tab "Oli" dan ketuk tombol +, atau\n2. Cukup beri perintah ke saya seperti: "Saya ganti oli seharga 100.000 dengan kilometer 15.000" atau "Catat penggantian oli 75.000". Saya akan meminta konfirmasi sebelum menyimpan.';
    } else if (input.includes('lihat') || input.includes('cek') || input.includes('jadwal')) {
      return 'Untuk melihat riwayat penggantian oli, buka tab "Oli". Anda bisa melihat tanggal dan kilometer terakhir saat oli diganti.';
    } else if (input.includes('berapa') && input.includes('km')) {
      // Handle the specific question "berapa km sekali untuk ganti oli?"
      return 'Jarak antar penggantian oli biasanya antara 5.000 - 10.000 km, tergantung jenis oli dan kondisi penggunaan kendaraan. Namun, untuk informasi akurat berdasarkan riwayat Anda, saya bisa cek data sebelumnya. Anda bisa bertanya: "berapa jarak rata-rata ganti oli saya sebelumnya?" atau "kapan terakhir kali ganti oli?"';
    } else if (input.includes('berikutnya') || input.includes('selanjutnya') || input.includes('selanjutnya')) {
      if (input.match(/\d{3,5}\s*(km|kilometer)/i)) {
        // Detect custom km values in the query
        const kmMatch = input.match(/(\d{3,5})\s*(km|kilometer)/i);
        if (kmMatch) {
          const kmValue = kmMatch[1];
          return `Anda dapat mengatur jadwal ganti oli berikutnya sesuai kebutuhan. Jika Anda ingin interval ${kmValue} km, Anda bisa bertanya: "rekomendasi ganti oli berikutnya di ${kmValue} km" untuk informasi lebih lanjut berdasarkan data Anda.`;
        }
      }
      return 'Anda bisa menentukan jadwal ganti oli berikutnya berdasarkan kilometer yang Anda inginkan. Misalnya, Anda bisa bertanya: "berapa km untuk ganti oli berikutnya di 3000km" untuk mendapatkan rekomendasi khusus.';
    } else {
      return 'Fitur Oli membantu Anda mencatat biaya penggantian oli dan menjaga jadwal perawatan kendaraan. Gunakan perintah seperti "Ganti oli dengan biaya 80.000" atau buka tab "Oli" secara langsung.';
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
    // Check if the input contains "berapa km" followed by "ganti oli" or "oli" to handle the specific issue
    if (input.includes('berapa km') && (input.includes('ganti oli') || input.includes('oli'))) {
      return 'Anda ingin tahu seberapa sering atau pada jarak berapa sebaiknya ganti oli? Berdasarkan standar umum, oli sebaiknya diganti setiap 5.000 - 10.000 km. Namun, jika Anda ingin informasi berdasarkan data Anda sebelumnya, silakan tanyakan: "berapa jarak rata-rata ganti oli saya sebelumnya?" atau saya bisa bantu cek riwayat penggantian oli Anda.';
    }

    // Check for custom oil change recommendations
    if (input.match(/(?:ganti|berikutnya|selanjutnya).*?(\d{3,5})\s*(km|kilometer)/i)) {
      const kmMatch = input.match(/(\d{3,5})\s*(km|kilometer)/i);
      if (kmMatch) {
        const kmValue = kmMatch[1];
        return `Saya bisa memberikan rekomendasi ganti oli berdasarkan interval ${kmValue} km. Anda bisa bertanya secara spesifik: "rekomendasi ganti oli berikutnya di ${kmValue} km" untuk informasi yang lebih detail berdasarkan data riwayat Anda.`;
      }
    }

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
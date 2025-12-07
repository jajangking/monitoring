// aiService.ts - AI service interface for Groq API using fetch
// Note: For development only - API keys in client is not secure for production


interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export class AIService {
  private static instance: AIService;
  private isInitialized = false;
  private apiKey: string | null = null;

  // Singleton pattern
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Initialize with API key for development
  async initialize(): Promise<void> {
    try {
      // Import the API key from environment
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

      if (!apiKey) {
        console.warn('EXPO_PUBLIC_GROQ_API_KEY not found in environment. Using fallback responses.');
        this.isInitialized = false;
        return;
      }

      this.apiKey = apiKey;
      this.isInitialized = true;
      console.log('Groq AI service initialized with direct fetch');
    } catch (error) {
      console.error('Error initializing Groq AI:', error);
      this.isInitialized = false;
    }
  }

  // Get AI response based on user input
  async getAIResponse(userInput: string, context?: string[]): Promise<string> {
    if (this.isInitialized && this.apiKey) {
      try {
        const systemPrompt = "Anda adalah asisten virtual untuk aplikasi monitoring keuangan harian. Aplikasi ini membantu pengguna mencatat pesanan, pengeluaran bahan bakar (BBM), dan penggantian oli. Berikan jawaban yang membantu dan relevan dalam konteks pengelolaan keuangan harian. Gunakan bahasa Indonesia yang sopan dan mudah dimengerti.";

        const messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput }
        ];

        // Add context if available
        if (context) {
          context.forEach((msg, index) => {
            const role = index % 2 === 0 ? "user" : "assistant";
            messages.push({ role, content: msg });
          });
        }

        // Log the request for debugging
        console.log('Making request to Groq API with model:', "llama-3.1-8b-instant");

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant", // Using a currently supported model
            messages: messages
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Groq API error - status: ${response.status}, body: ${errorText}`);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
          throw new Error("No response from AI");
        }

        return data.choices[0].message.content || this.getFallbackResponse(userInput);
      } catch (error) {
        console.error('Error calling Groq API directly:', error);
        // Provide more specific error handling for common 400 errors
        if (error.message.includes('400')) {
          console.warn('400 error suggests issue with API key or request format - using fallback response');
          return this.getFallbackResponse(userInput);
        }
        return this.getFallbackResponse(userInput);
      }
    } else {
      // Provide a helpful response when AI is not available
      return this.getFallbackResponse(userInput);
    }
  }

  // Fallback responses when AI is not available
  private getFallbackResponse(userInput: string): string {
    const input = userInput.toLowerCase();

    if (input.includes('halo') || input.includes('hai') || input.includes('hi')) {
      return 'Halo! Saya adalah asisten virtual. Apakah Anda ingin bantuan dengan aplikasi monitoring Anda?';
    } else if (input.includes('order') || input.includes('pesanan')) {
      return 'Anda dapat mengelola pesanan melalui tab "Pesanan" di aplikasi. Di sana Anda bisa menambah, mengedit, atau menghapus pesanan.';
    } else if (input.includes('bbm') || input.includes('fuel') || input.includes('bahan bakar')) {
      return 'Di tab BBM, Anda bisa mencatat pengeluaran bahan bakar Anda. Gunakan tombol + untuk menambahkan pengeluaran BBM baru.';
    } else if (input.includes('oli') || input.includes('oli mesin')) {
      return 'Tab Oli memungkinkan Anda mencatat penggantian oli. Anda bisa menambahkan biaya dan kilometer saat penggantian oli.';
    } else if (input.includes('laporan') || input.includes('ringkasan') || input.includes('uang')) {
      return 'Di tab Dasbor, Anda bisa melihat ringkasan keuangan Anda termasuk pendapatan, pengeluaran, dan pendapatan bersih.';
    } else if (input.includes('bantuan') || input.includes('help')) {
      return 'Saya di sini untuk membantu Anda menggunakan aplikasi monitoring ini. Anda bisa bertanya tentang pesanan, pengeluaran BBM, penggantian oli, atau laporan.';
    } else if (input.includes('tanggal') || input.includes('waktu')) {
      return `Sekarang tanggal ${new Date().toLocaleDateString('id-ID')}. Pastikan Anda mencatat tanggal dengan benar untuk laporan yang akurat.`;
    } else {
      return 'Terima kasih atas pesan Anda. Jika Anda memiliki pertanyaan tentang penggunaan aplikasi monitoring ini, saya siap membantu. Apakah Anda ingin informasi tentang pesanan, pengeluaran BBM, atau penggantian oli?';
    }
  }
}

// Export a singleton instance
export const aiService = AIService.getInstance();
import { enhancedAIService } from './utils/enhancedAI';
import { aiDatabaseService } from './utils/aiDatabaseService';
import { DataModel } from './models/DataModel';

// Test function to simulate chatbot interaction
async function testChatbot() {
  console.log('=== Testing Chatbot with Data Reading Capabilities ===\n');
  
  // First, let's add some test data to the database
  console.log('Adding test data...\n');
  
  // Add test oil change
  await DataModel.addOilChange({
    amount: 75000,
    date: '2024-01-15',
    mileage: 15000,
    description: 'Ganti oli mobil pertama'
  });
  
  await DataModel.addOilChange({
    amount: 80000,
    date: '2024-06-20',
    mileage: 20000,
    description: 'Ganti oli mobil kedua'
  });
  
  // Add test fuel expense
  await DataModel.addFuelExpense({
    amount: 75000,
    date: '2024-01-10',
    liters: 5,
    description: 'Isi bensin pertama'
  });
  
  await DataModel.addFuelExpense({
    amount: 120000,
    date: '2024-01-25',
    liters: 8,
    description: 'Isi bensin kedua'
  });
  
  // Add test order
  await DataModel.addOrder({
    amount: 150000,
    date: '2024-01-05',
    description: 'Order pertama'
  });
  
  await DataModel.addOrder({
    amount: 200000,
    date: '2024-01-18',
    description: 'Order kedua'
  });
  
  console.log('Test data added successfully!\n');
  
  // Test various queries
  const testQueries = [
    'berapa km sekali untuk ganti oli?',
    'berapa jarak antar ganti oli saya?',
    'kapan terakhir kali ganti oli?',
    'berapa total pengeluaran oli?',
    'berapa liter bbm saya?',
    'berapa total pengeluaran bbm?',
    'berapa banyak order yang saya punya?',
    'berapa total pendapatan dari order?',
    'berapa pendapatan bersih saya?',
    'ringkasan keuangan',
    'berapa km untuk ganti oli terakhir?',
    'kapan terakhir ganti oli?',
    'berapa sering saya ganti oli?'
  ];
  
  console.log('Testing various queries...\n');
  
  for (const query of testQueries) {
    console.log(`Query: ${query}`);
    
    try {
      const response = await enhancedAIService.getEnhancedAIResponse(query, undefined, 'test-session');
      console.log(`Response: ${response}\n`);
    } catch (error) {
      console.error(`Error processing query '${query}':`, error);
    }
  }
  
  console.log('=== Testing Complete ===');
}

// Run the test
testChatbot().catch(console.error);
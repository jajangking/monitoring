import { enhancedAIService } from './utils/enhancedAI';
import { DataModel } from './models/DataModel';

// Test function to simulate chatbot interaction with custom oil change queries
async function testCustomOilChange() {
  console.log('=== Testing Chatbot with Custom Oil Change Recommendations ===\n');
  
  // Add test data with mileage for oil changes
  console.log('Adding test oil change data with mileage...\n');
  
  // Add test oil change with specific mileage
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
  
  console.log('Test data added successfully!\n');
  
  // Test various custom oil change queries
  const testQueries = [
    'ganti oli berikutnya di 2000km',
    'berapa km untuk ganti oli berikutnya di 3000km',
    'rekomendasi ganti oli berikutnya di 5000km',
    'berapa km sekali untuk ganti oli?',
    'ganti oli selanjutnya di 4000 km',
    'jadwal ganti oli custom di 2500km'
  ];
  
  console.log('Testing custom oil change queries...\n');
  
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
testCustomOilChange().catch(console.error);
import { DataModel, Motorcycle } from './models/DataModel';

// Test function to verify motorcycle functionality
async function testMotorcycleFunctionality() {
  console.log('=== Testing Motorcycle Functionality ===\n');

  // Test creating a motorcycle
  console.log('Creating test motorcycle...');
  const testMotorcycleData = {
    name: 'Honda Vario 150',
    brand: 'Honda',
    model: 'Vario 150',
    year: 2022,
    licensePlate: 'B 1234 CD',
    description: 'Test motorcycle for development'
  };

  try {
    const motorcycle = await DataModel.addMotorcycle(testMotorcycleData);
    console.log('Test motorcycle created successfully!');
    
    // Get all motorcycles
    const motorcycles = await DataModel.getMotorcycles();
    console.log(`Found ${motorcycles.length} motorcycles`);
    
    if (motorcycles.length > 0) {
      const firstMotorcycle = motorcycles[0];
      console.log(`Using motorcycle: ${firstMotorcycle.name}`);
      
      // Test adding oil change with motorcycle ID
      console.log('Testing oil change with motorcycle association...');
      await DataModel.addOilChange({
        amount: 75000,
        date: '2024-01-15',
        mileage: 15000,
        description: 'Test oil change',
        motorcycleId: firstMotorcycle.id
      });
      
      // Test adding spare part with motorcycle ID
      console.log('Testing spare part with motorcycle association...');
      await DataModel.addSparepart({
        name: 'Kampas Rem Depan',
        mileageInstalled: 15000,
        estimatedMileage: 20000,
        dateInstalled: '2024-01-15',
        note: 'Test spare part',
        status: 'active',
        motorcycleId: firstMotorcycle.id
      });
      
      // Test getting oil changes for specific motorcycle
      const oilChanges = await DataModel.getOilChanges(firstMotorcycle.id);
      console.log(`Found ${oilChanges.length} oil changes for motorcycle ${firstMotorcycle.name}`);
      
      // Test getting spare parts for specific motorcycle
      const spareparts = await DataModel.getSpareparts(firstMotorcycle.id);
      console.log(`Found ${spareparts.length} spare parts for motorcycle ${firstMotorcycle.name}`);
      
      console.log('Motorcycle functionality test completed successfully!');
    }
  } catch (error) {
    console.error('Error during motorcycle functionality test:', error);
  }
}

// Run the test
testMotorcycleFunctionality().catch(console.error);
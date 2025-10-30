import { MenuItemService } from '@/lib/firestore';
import { MenuItemFormData } from '@/lib/types';

// Initial menu items data
const initialMenuItems: MenuItemFormData[] = [
  // Mutton Items
  { name: "Mutton Biryani (Special) 2 pc", price: 300.00, category: "mutton", description: "Special mutton biryani with 2 pieces", isActive: true },
  { name: "Mutton Egg Biryani", price: 180.00, category: "mutton", description: "Mutton biryani with egg", isActive: true },
  { name: "Mutton Biryani", price: 170.00, category: "mutton", description: "Classic mutton biryani", isActive: true },
  { name: "Mutton Biryani (Half)", price: 150.00, category: "mutton", description: "Half portion mutton biryani", isActive: true },
  { name: "Mutton Chaap", price: 120.00, category: "mutton", description: "Tender mutton chaap", isActive: true },

  // Chicken Items
  { name: "Chicken Biryani (Special) 2 pc", price: 160.00, category: "chicken", description: "Special chicken biryani with 2 pieces", isActive: true },
  { name: "Chicken Egg Biryani", price: 110.00, category: "chicken", description: "Chicken biryani with egg", isActive: true },
  { name: "Chicken Biryani", price: 100.00, category: "chicken", description: "Classic chicken biryani", isActive: true },
  { name: "Chicken Biryani (Half)", price: 80.00, category: "chicken", description: "Half portion chicken biryani", isActive: true },
  { name: "Chicken Chaap", price: 50.00, category: "chicken", description: "Tender chicken chaap", isActive: true },

  // Egg & Veg Items
  { name: "Egg Biryani", price: 80.00, category: "egg", description: "Delicious egg biryani", isActive: true },
  { name: "Half Egg Biryani", price: 60.00, category: "egg", description: "Half portion egg biryani", isActive: true },
  { name: "Aloo Biryani", price: 70.00, category: "veg", description: "Vegetarian potato biryani", isActive: true },
  { name: "Half Aloo Biryani", price: 50.00, category: "veg", description: "Half portion potato biryani", isActive: true },

  // Beverages
  { name: "Water Bottle", price: 10.00, category: "beverages", description: "Fresh water bottle", isActive: true },
  { name: "Water Bottle (Large)", price: 20.00, category: "beverages", description: "Large water bottle", isActive: true },
  { name: "Soft Drink (Small)", price: 10.00, category: "beverages", description: "Small soft drink", isActive: true },
  { name: "Soft Drink (Medium)", price: 15.00, category: "beverages", description: "Medium soft drink", isActive: true },
  { name: "Soft Drink (Large)", price: 20.00, category: "beverages", description: "Large soft drink", isActive: true },
  { name: "Soft Drink (Premium)", price: 50.00, category: "beverages", description: "Premium soft drink", isActive: true },

  // Extras
  { name: "Extra Rice", price: 50.00, category: "extras", description: "Additional rice portion", isActive: true },
  { name: "Mutton Extra", price: 110.00, category: "extras", description: "Extra mutton pieces", isActive: true },
  { name: "Chicken Extra", price: 40.00, category: "extras", description: "Extra chicken pieces", isActive: true },
  { name: "Gravy", price: 10.00, category: "extras", description: "Extra gravy/curry", isActive: true },
  { name: "Raita", price: 10.00, category: "extras", description: "Fresh raita", isActive: true },
  { name: "Aloo Extra", price: 5.00, category: "extras", description: "Extra potato", isActive: true },
  { name: "Salad", price: 10.00, category: "extras", description: "Fresh salad", isActive: true }
];

export async function addInitialMenuItems() {
  console.log('Starting to add initial menu items...');
  
  try {
    const results = await Promise.allSettled(
      initialMenuItems.map(async (item, index) => {
        try {
          const id = await MenuItemService.createMenuItem(item);
          console.log(`✅ Added: ${item.name} (ID: ${id})`);
          return { success: true, item: item.name, id };
        } catch (error) {
          console.error(`❌ Failed to add: ${item.name}`, error);
          return { success: false, item: item.name, error };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully added: ${successful} items`);
    console.log(`❌ Failed to add: ${failed} items`);
    console.log(`\n🎉 Initial menu items setup complete!`);

    return { successful, failed, total: initialMenuItems.length };
  } catch (error) {
    console.error('Error adding initial menu items:', error);
    throw error;
  }
}
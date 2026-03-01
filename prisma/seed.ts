import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Countries
  const india = await prisma.country.upsert({
    where: { name: 'India' },
    update: {},
    create: { name: 'India' },
  });

  const america = await prisma.country.upsert({
    where: { name: 'America' },
    update: {},
    create: { name: 'America' },
  });

  // 2. Create Users
  const password = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin.in@example.com', role: 'ADMIN', countryId: india.id },
    { email: 'manager.in@example.com', role: 'MANAGER', countryId: india.id },
    { email: 'member.in@example.com', role: 'MEMBER', countryId: india.id },
    { email: 'admin.us@example.com', role: 'ADMIN', countryId: america.id },
    { email: 'manager.us@example.com', role: 'MANAGER', countryId: america.id },
    { email: 'member.us@example.com', role: 'MEMBER', countryId: america.id },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password,
        role: u.role,
        countryId: u.countryId,
      },
    });
  }

  // 3. Create Restaurants & Menu Items
  const restaurantData = [
    { 
      name: 'Spice Garden', 
      address: '123 Curry Lane, New Delhi', 
      phone: '+91 11 2345 6789', 
      hours: '11:00 AM - 11:00 PM',
      countryId: india.id, 
      items: ['Butter Chicken', 'Paneer Tikka', 'Dal Makhani', 'Naan', 'Biryani'] 
    },
    { 
      name: 'Dosa Plaza', 
      address: '45 Sambar Street, Bangalore', 
      phone: '+91 80 9876 5432', 
      hours: '7:00 AM - 10:00 PM',
      countryId: india.id, 
      items: ['Masala Dosa', 'Idli Sambhar', 'Vada', 'Uttapam', 'Filter Coffee'] 
    },
    { 
      name: 'Punjab Grill', 
      address: '78 Lassi Road, Chandigarh', 
      phone: '+91 172 555 0123', 
      hours: '12:00 PM - 12:00 AM',
      countryId: india.id, 
      items: ['Tandoori Chicken', 'Lassi', 'Sarson ka Saag', 'Makki di Roti', 'Gulab Jamun'] 
    },
    { 
      name: 'Royal Thali', 
      address: '12 Dhokla Circle, Ahmedabad', 
      phone: '+91 79 4444 8888', 
      hours: '11:30 AM - 10:30 PM',
      countryId: india.id, 
      items: ['Gujarati Thali', 'Dhokla', 'Khandvi', 'Thepla', 'Shrikhand'] 
    },
    { 
      name: 'Burger King US', 
      address: '101 Burger Ave, New York', 
      phone: '+1 212 555 0199', 
      hours: '24 Hours',
      countryId: america.id, 
      items: ['Whopper', 'Chicken Fries', 'Onion Rings', 'Hershey Pie', 'Coke'] 
    },
    { 
      name: 'Pizza Hut US', 
      address: '202 Pepperoni Blvd, Chicago', 
      phone: '+1 312 555 0188', 
      hours: '10:00 AM - 11:00 PM',
      countryId: america.id, 
      items: ['Pepperoni Pizza', 'Garlic Bread', 'Wings', 'Pasta', 'Pepsi'] 
    },
    { 
      name: 'Taco Bell US', 
      address: '303 Nacho Way, Los Angeles', 
      phone: '+1 213 555 0177', 
      hours: '9:00 AM - 2:00 AM',
      countryId: america.id, 
      items: ['Crunchwrap Supreme', 'Soft Taco', 'Burrito', 'Nachos', 'Mountain Dew'] 
    },
    { 
      name: 'Subway US', 
      address: '404 Healthy St, San Francisco', 
      phone: '+1 415 555 0166', 
      hours: '8:00 AM - 9:00 PM',
      countryId: america.id, 
      items: ['Italian BMT', 'Meatball Marinara', 'Turkey Breast', 'Cookies', 'Sprite'] 
    },
  ];

  for (const r of restaurantData) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: r.name,
        address: r.address,
        phone: r.phone,
        hours: r.hours,
        countryId: r.countryId,
      },
    });

    for (const itemName of r.items) {
      await prisma.menuItem.create({
        data: {
          name: itemName,
          price: Math.floor(Math.random() * 20) + 5,
          restaurantId: restaurant.id,
        },
      });
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

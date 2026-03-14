require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create default users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const editorPassword = await bcrypt.hash('editor123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: adminPassword, name: 'Admin User', role: 'Admin' },
  });

  await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: { email: 'editor@example.com', password: editorPassword, name: 'Editor User', role: 'Editor' },
  });

  await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: { email: 'viewer@example.com', password: viewerPassword, name: 'Viewer User', role: 'Viewer' },
  });

  // Seed products
  const products = [
    { name: 'Wireless Headphones', sku: 'WH-001', price: 79.99, category: 'Electronics', inStock: true, description: 'Premium wireless headphones with noise cancellation' },
    { name: 'Running Shoes', sku: 'RS-001', price: 129.99, category: 'Sports', inStock: true, description: 'Lightweight running shoes for daily training' },
    { name: 'Cotton T-Shirt', sku: 'CT-001', price: 24.99, category: 'Clothing', inStock: true, description: 'Comfortable 100% cotton t-shirt' },
    { name: 'Organic Coffee', sku: 'OC-001', price: 14.99, category: 'Food', inStock: true, description: 'Fair trade organic coffee beans, 1lb bag' },
    { name: 'Desk Lamp', sku: 'DL-001', price: 45.99, category: 'Home', inStock: false, description: 'Adjustable LED desk lamp with USB charging' },
    { name: 'Bluetooth Speaker', sku: 'BS-001', price: 59.99, category: 'Electronics', inStock: true, description: 'Portable waterproof bluetooth speaker' },
    { name: 'Yoga Mat', sku: 'YM-001', price: 34.99, category: 'Sports', inStock: true, description: 'Non-slip yoga mat, 6mm thick' },
    { name: 'Winter Jacket', sku: 'WJ-001', price: 189.99, category: 'Clothing', inStock: true, description: 'Insulated winter jacket, waterproof' },
    { name: 'Green Tea', sku: 'GT-001', price: 9.99, category: 'Food', inStock: true, description: 'Japanese green tea, 100 bags' },
    { name: 'Bookshelf', sku: 'BK-001', price: 149.99, category: 'Home', inStock: true, description: '5-tier wooden bookshelf' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: products.indexOf(p) + 1 },
      update: {},
      create: p,
    });
  }

  // Seed orders
  const orders = [
    { orderNumber: 'ORD-001', customerName: 'John Smith', customerEmail: 'john@example.com', status: 'Delivered', totalAmount: 159.98, notes: 'Gift wrapping requested' },
    { orderNumber: 'ORD-002', customerName: 'Jane Doe', customerEmail: 'jane@example.com', status: 'Shipped', totalAmount: 79.99, notes: '' },
    { orderNumber: 'ORD-003', customerName: 'Bob Wilson', customerEmail: 'bob@example.com', status: 'Processing', totalAmount: 234.97, notes: 'Express shipping' },
    { orderNumber: 'ORD-004', customerName: 'Alice Brown', customerEmail: 'alice@example.com', status: 'Pending', totalAmount: 45.99, notes: '' },
    { orderNumber: 'ORD-005', customerName: 'Charlie Lee', customerEmail: 'charlie@example.com', status: 'Cancelled', totalAmount: 189.99, notes: 'Customer requested cancellation' },
  ];

  for (const o of orders) {
    await prisma.order.upsert({
      where: { id: orders.indexOf(o) + 1 },
      update: {},
      create: o,
    });
  }

  console.log('Database seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

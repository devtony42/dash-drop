const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  // Seed Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "MacBook Pro 16\"",
        price: 2499.99,
        category: "Electronics",
        inStock: true,
        description: "Apple M3 Pro chip, 18GB RAM, 512GB SSD",
      },
    }),
    prisma.product.create({
      data: {
        name: "Nike Air Max 90",
        price: 129.99,
        category: "Clothing",
        inStock: true,
        description: "Classic sneakers with Air Max cushioning",
      },
    }),
    prisma.product.create({
      data: {
        name: "Organic Granola",
        price: 8.49,
        category: "Food",
        inStock: true,
        description: "Honey almond clusters, 12oz bag",
      },
    }),
    prisma.product.create({
      data: {
        name: "Sony WH-1000XM5",
        price: 349.99,
        category: "Electronics",
        inStock: false,
        description: "Noise-cancelling wireless headphones",
      },
    }),
    prisma.product.create({
      data: {
        name: "Patagonia Down Jacket",
        price: 279.0,
        category: "Clothing",
        inStock: true,
        description: "800-fill-power recycled down, slim fit",
      },
    }),
    prisma.product.create({
      data: {
        name: "Cold Brew Concentrate",
        price: 14.99,
        category: "Food",
        inStock: true,
        description: "32oz bottle, makes 8 servings",
      },
    }),
    prisma.product.create({
      data: {
        name: "Logitech MX Master 3S",
        price: 99.99,
        category: "Electronics",
        inStock: true,
        description: "Wireless ergonomic mouse, USB-C charging",
      },
    }),
    prisma.product.create({
      data: {
        name: "Levi's 501 Original",
        price: 69.5,
        category: "Clothing",
        inStock: true,
        description: "Straight fit, button fly, medium wash",
      },
    }),
  ]);

  // Seed Orders
  await Promise.all([
    prisma.order.create({
      data: {
        customerName: "Alice Johnson",
        orderDate: new Date("2025-01-15"),
        total: 2629.98,
        status: "Delivered",
        notes: "Express shipping requested",
      },
    }),
    prisma.order.create({
      data: {
        customerName: "Bob Martinez",
        orderDate: new Date("2025-02-03"),
        total: 408.99,
        status: "Shipped",
        notes: null,
      },
    }),
    prisma.order.create({
      data: {
        customerName: "Carol Chen",
        orderDate: new Date("2025-02-28"),
        total: 23.48,
        status: "Pending",
        notes: "Gift wrap please",
      },
    }),
    prisma.order.create({
      data: {
        customerName: "David Kim",
        orderDate: new Date("2025-03-10"),
        total: 349.99,
        status: "Cancelled",
        notes: "Customer changed mind",
      },
    }),
    prisma.order.create({
      data: {
        customerName: "Eva Rossi",
        orderDate: new Date("2025-03-12"),
        total: 1599.48,
        status: "Pending",
        notes: "Corporate purchase order #4401",
      },
    }),
  ]);

  console.log(`Seeded ${products.length} products and 5 orders`);
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Salary', type: 'INCOME', icon: 'ic_salary', is_default: true },
  { name: 'Freelance', type: 'INCOME', icon: 'ic_freelance', is_default: true },
  { name: 'Business', type: 'INCOME', icon: 'ic_business', is_default: true },
  { name: 'Food & Dining', type: 'EXPENSE', icon: 'ic_food', is_default: true },
  { name: 'Transportation', type: 'EXPENSE', icon: 'ic_transport', is_default: true },
  { name: 'Shopping', type: 'EXPENSE', icon: 'ic_shopping', is_default: true },
  { name: 'Bills & Utilities', type: 'EXPENSE', icon: 'ic_bills', is_default: true },
  { name: 'Subscriptions', type: 'EXPENSE', icon: 'ic_subscription', is_default: true },
  { name: 'Entertainment', type: 'EXPENSE', icon: 'ic_entertainment', is_default: true },
  { name: 'Travel', type: 'EXPENSE', icon: 'ic_travel', is_default: true },
  { name: 'Healthcare', type: 'EXPENSE', icon: 'ic_health', is_default: true },
  { name: 'Education', type: 'EXPENSE', icon: 'ic_education', is_default: true }
];

async function main() {
  console.log('Seeding default categories...');
  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, is_default: true }
    });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

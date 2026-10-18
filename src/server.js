require('dotenv').config();
const app = require('./app');
const prisma = require('./prisma');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check database connection before listening
    await prisma.$connect();
    console.log('Connected to PostgreSQL successfully via Prisma!');

    app.listen(PORT, () => {
      console.log(`E-Commerce MVP API is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

const express = require('express');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const shipmentRoutes = require('./routes/shipment.routes');

const app = express();
app.use(express.json());

// Routes mapping
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to E-Commerce MVP API' });
});

module.exports = app;

const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// 1. Get all products (Public)
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 2. Get product by pid (Public)
router.get('/:pid', async (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    const product = await prisma.product.findUnique({ where: { pid } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 3. Create product (Protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { pname, price, quantity } = req.body;
    if (!pname || price === undefined || quantity === undefined) {
      return res.status(400).json({ message: 'Missing required fields: pname, price, quantity' });
    }

    const product = await prisma.product.create({
      data: {
        pname,
        price: parseFloat(price),
        quantity: parseInt(quantity)
      }
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 4. Update product (Protected)
router.put('/:pid', authenticateToken, async (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    const { pname, price, quantity } = req.body;

    const data = {};
    if (pname !== undefined) data.pname = pname;
    if (price !== undefined) data.price = parseFloat(price);
    if (quantity !== undefined) data.quantity = parseInt(quantity);

    const product = await prisma.product.update({
      where: { pid },
      data
    });

    return res.status(200).json(product);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(500).json({ message: error.message });
  }
});

// 5. Delete product (Protected)
router.delete('/:pid', authenticateToken, async (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    const deletedProduct = await prisma.product.delete({
      where: { pid }
    });

    return res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

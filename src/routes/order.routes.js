const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// 1. Create Order (Place Order)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body; // items: [ { pid, qty } ]
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    const uid = req.user.uid;

    // Use Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: { uid }
      });

      // Process order details and update product quantities
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { pid: parseInt(item.pid) }
        });

        if (!product) {
          throw new Error(`Product with ID ${item.pid} not found`);
        }

        if (product.quantity < item.qty) {
          throw new Error(`Insufficient stock for product '${product.pname}'`);
        }

        // Create OrderDetail
        await tx.orderDetail.create({
          data: {
            oid: newOrder.oid,
            pid: product.pid,
            qty: parseInt(item.qty),
            unit_price: product.price
          }
        });

        // Decrement product stock
        await tx.product.update({
          where: { pid: product.pid },
          data: { quantity: product.quantity - parseInt(item.qty) }
        });
      }

      // Create Shipment with initial status
      const shipment = await tx.shipment.create({
        data: {
          oid: newOrder.oid,
          status: 'Pending'
        }
      });

      // Retrieve full created order
      const fullOrder = await tx.order.findUnique({
        where: { oid: newOrder.oid },
        include: {
          orderDetails: {
            include: { product: true }
          },
          shipments: true
        }
      });

      return fullOrder;
    });

    return res.status(201).json({ message: 'Order created successfully', order: result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// 2. Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const orders = await prisma.order.findMany({
      where: req.user.rolename === 'Admin' ? {} : { uid },
      include: {
        orderDetails: {
          include: { product: true }
        },
        shipments: true
      },
      orderBy: { createat: 'desc' }
    });

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 3. Get single order & details by oid
router.get('/:oid', authenticateToken, async (req, res) => {
  try {
    const oid = parseInt(req.params.oid);
    const order = await prisma.order.findUnique({
      where: { oid },
      include: {
        orderDetails: {
          include: { product: true }
        },
        shipments: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

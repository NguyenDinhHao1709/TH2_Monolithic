const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// 1. Get all shipments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({
      include: {
        order: {
          include: {
            orderDetails: {
              include: { product: true }
            }
          }
        }
      },
      orderBy: { shipid: 'desc' }
    });
    return res.status(200).json(shipments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 2. Get shipment by Order ID (oid)
router.get('/:oid', authenticateToken, async (req, res) => {
  try {
    const oid = parseInt(req.params.oid);
    const shipments = await prisma.shipment.findMany({
      where: { oid },
      include: {
        order: {
          include: {
            orderDetails: {
              include: { product: true }
            }
          }
        }
      }
    });
    return res.status(200).json(shipments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 3. Create or update shipment status for an order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { oid, status } = req.body;
    if (!oid) {
      return res.status(400).json({ message: 'Missing required field: oid' });
    }
    const existing = await prisma.shipment.findFirst({ where: { oid: parseInt(oid) } });
    let shipment;
    if (existing) {
      shipment = await prisma.shipment.update({
        where: { shipid: existing.shipid },
        data: { status: status || 'Shipping' },
        include: { order: { include: { orderDetails: true } } }
      });
    } else {
      shipment = await prisma.shipment.create({
        data: { oid: parseInt(oid), status: status || 'Shipping' },
        include: { order: { include: { orderDetails: true } } }
      });
    }
    return res.status(200).json({ message: 'Shipment processed successfully', shipment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;


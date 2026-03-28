import { Router } from 'express';
import {
  getInstrumentsController,
  getInstrumentByIdController,
} from '../controllers/instrument.controller';

const router = Router();

/**
 * @swagger
 * /api/instruments:
 *   get:
 *     summary: Get all instruments
 *     tags: [Instruments]
 *     responses:
 *       200:
 *         description: List of instruments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Instrument'
 */
router.get('/', getInstrumentsController);

/**
 * @swagger
 * /api/instruments/{id}:
 *   get:
 *     summary: Get instrument by ID
 *     tags: [Instruments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Instrument details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Instrument'
 *       404:
 *         description: Instrument not found
 */
router.get('/:id', getInstrumentByIdController);

export default router;

/**
 * This file contains additional Swagger/OpenAPI annotations for routes
 * that are too large to fit inline in route files
 */

/**
 * @swagger
 * /api/sheets:
 *   get:
 *     summary: Get all sheet music
 *     tags: [Sheet Music]
 *     parameters:
 *       - in: query
 *         name: instrument
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [Beginner, Intermediate, Advanced]
 *       - in: query
 *         name: is_premium
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of sheet music
 */

/**
 * @swagger
 * /api/sheets/search:
 *   get:
 *     summary: Search sheet music
 *     tags: [Sheet Music]
 */

/**
 * @swagger
 * /api/sheets/{id}:
 *   get:
 *     summary: Get sheet music by ID
 *     tags: [Sheet Music]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/sheets/{id}/download:
 *   get:
 *     summary: Download sheet music PDF
 *     tags: [Sheet Music]
 *     security:
 *       - bearerAuth: []
 */

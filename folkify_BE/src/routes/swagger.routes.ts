import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

const router = Router();

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Swagger UI documentation
 *     description: Interactive API documentation
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI HTML page
 */
router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FOLKIFY API Documentation',
  })
);

export default router;

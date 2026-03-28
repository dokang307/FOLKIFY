import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../config/swagger';

/**
 * Export OpenAPI specification to JSON file
 * This can be used to generate Postman collections
 */
export function exportOpenAPISpec() {
  const outputPath = path.join(__dirname, '../../openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  console.log(`OpenAPI spec exported to: ${outputPath}`);
}

// Run if executed directly
if (require.main === module) {
  exportOpenAPISpec();
}

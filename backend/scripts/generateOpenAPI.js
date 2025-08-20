import swaggerJsdoc from 'swagger-jsdoc';
import YAML from 'yamljs';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SynapEvents API',
      version: '1.0.0',
      description: 'API documentation for SynapEvents - A platform for managing hackathons and coding competitions',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
  },
  apis: [
    join(__dirname, '../src/routes/*.js'),
    join(__dirname, '../src/controllers/*.js'),
    join(__dirname, '../src/models/*.js'),
  ],
};

const openapiSpecification = swaggerJsdoc(options);

// Save as JSON
writeFileSync(
  join(__dirname, '../docs/openapi.json'),
  JSON.stringify(openapiSpecification, null, 2)
);

// Save as YAML
writeFileSync(
  join(__dirname, '../docs/openapi.yaml'),
  YAML.stringify(openapiSpecification, 2)
);

console.log('OpenAPI documentation generated successfully!');

import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = 5001;

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SynapEvents API',
    version: '1.0.0',
    description: 'API documentation for SynapEvents',
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server',
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  console.log(`Swagger JSON available at http://localhost:${PORT}/api-docs.json`);
});

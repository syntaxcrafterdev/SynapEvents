import express from 'express';
import { setupSwagger } from './src/config/swagger.js';

const app = express();
const PORT = 5001; // Use a different port to avoid conflicts

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Test server is running');
});

// Setup Swagger
setupSwagger(app);

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

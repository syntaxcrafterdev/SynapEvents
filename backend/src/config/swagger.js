const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SynapEvents API',
      version: '1.0.0',
      description: 'API documentation for SynapEvents - A platform for managing hackathons and coding competitions',
      contact: {
        name: 'SynapEvents Support',
        email: 'support@synapevents.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.synapevents.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { 
              type: 'string', 
              enum: ['user', 'organizer', 'admin'],
              default: 'user'
            },
            avatar: { type: 'string', format: 'uri', nullable: true },
            isEmailVerified: { type: 'boolean', default: false },
            isActive: { type: 'boolean', default: true },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 5, maxLength: 200 },
            slug: { type: 'string' },
            description: { type: 'string' },
            shortDescription: { type: 'string', maxLength: 500, nullable: true },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            registrationStart: { type: 'string', format: 'date-time' },
            registrationEnd: { type: 'string', format: 'date-time' },
            submissionDeadline: { type: 'string', format: 'date-time', nullable: true },
            isOnline: { type: 'boolean', default: true },
            location: { type: 'string', nullable: true },
            onlineLink: { type: 'string', format: 'uri', nullable: true },
            status: { 
              type: 'string', 
              enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'],
              default: 'draft'
            },
            isPublished: { type: 'boolean', default: false },
            maxTeamSize: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
            minTeamSize: { type: 'integer', minimum: 1, default: 1 },
            maxParticipants: { type: 'integer', nullable: true },
            registrationFee: { type: 'number', minimum: 0, default: 0 },
            currency: { type: 'string', default: 'USD' },
            timezone: { type: 'string', default: 'UTC' },
            organizerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 3, maxLength: 100 },
            description: { type: 'string', nullable: true },
            logo: { type: 'string', format: 'uri', nullable: true },
            inviteCode: { type: 'string' },
            inviteExpires: { type: 'string', format: 'date-time' },
            isLocked: { type: 'boolean', default: false },
            status: {
              type: 'string',
              enum: ['active', 'disqualified', 'withdrawn'],
              default: 'active'
            },
            eventId: { type: 'string', format: 'uuid' },
            leaderId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Submission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: 'string' },
            githubUrl: { type: 'string', format: 'uri', nullable: true },
            videoUrl: { type: 'string', format: 'uri', nullable: true },
            fileUrl: { type: 'string', format: 'uri', nullable: true },
            fileType: { type: 'string', nullable: true },
            fileSize: { type: 'integer', nullable: true },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'under_review', 'accepted', 'rejected'],
              default: 'draft'
            },
            isPublic: { type: 'boolean', default: false },
            submissionNote: { type: 'string', nullable: true },
            averageScore: { type: 'number', format: 'float', nullable: true },
            totalEvaluations: { type: 'integer', default: 0 },
            eventId: { type: 'string', format: 'uuid' },
            teamId: { type: 'string', format: 'uuid' },
            submittedById: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 3, maxLength: 200 },
            slug: { type: 'string', readOnly: true },
            description: { type: 'string' },
            shortDescription: { type: 'string', maxLength: 300 },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            registrationStart: { type: 'string', format: 'date-time' },
            registrationEnd: { type: 'string', format: 'date-time' },
            submissionDeadline: { type: 'string', format: 'date-time' },
            status: { 
              type: 'string', 
              enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'] 
            },
            isPublished: { type: 'boolean', default: false },
            isOnline: { type: 'boolean', default: false },
            location: { type: 'string' },
            onlineLink: { type: 'string', format: 'uri' },
            maxParticipants: { type: 'integer', minimum: 1 },
            registrationFee: { type: 'number', minimum: 0 },
            currency: { type: 'string', default: 'USD' },
            timezone: { type: 'string', default: 'UTC' },
            tags: { 
              type: 'array',
              items: { type: 'string' }
            },
            bannerImage: { type: 'string' },
            logo: { type: 'string' },
            rules: { type: 'string' },
            prizes: { type: 'string' },
            schedule: { type: 'string' },
            sponsors: { type: 'string' },
            judgingCriteria: { type: 'string' },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 3, maxLength: 100 },
            description: { type: 'string' },
            logo: { type: 'string' },
            inviteCode: { type: 'string', readOnly: true },
            inviteExpires: { type: 'string', format: 'date-time' },
            status: { 
              type: 'string', 
              enum: ['active', 'inactive', 'disqualified'],
              default: 'active'
            },
            eventId: { type: 'string', format: 'uuid' },
            leaderId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            members: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TeamMember'
              }
            }
          }
        },
        TeamMember: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            teamId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            role: { 
              type: 'string',
              enum: ['member', 'admin'],
              default: 'member'
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
              default: 'pending'
            },
            joinedAt: { type: 'string', format: 'date-time' },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Submission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 3, maxLength: 200 },
            description: { type: 'string' },
            status: { 
              type: 'string',
              enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
              default: 'draft'
            },
            githubUrl: { type: 'string', format: 'uri' },
            demoUrl: { type: 'string', format: 'uri' },
            videoUrl: { type: 'string', format: 'uri' },
            fileUrl: { type: 'string' },
            fileName: { type: 'string' },
            fileType: { type: 'string' },
            fileSize: { type: 'integer' },
            technologies: {
              type: 'array',
              items: { type: 'string' }
            },
            eventId: { type: 'string', format: 'uuid' },
            teamId: { type: 'string', format: 'uuid' },
            submittedById: { type: 'string', format: 'uuid' },
            submittedAt: { type: 'string', format: 'date-time' },
            averageScore: { type: 'number', readOnly: true },
            evaluationCount: { type: 'integer', readOnly: true },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            evaluations: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Evaluation'
              }
            }
          }
        },
        Evaluation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            score: { 
              type: 'number', 
              minimum: 0, 
              maximum: 100,
              description: 'Overall score (0-100)'
            },
            feedback: { 
              type: 'string',
              description: 'Detailed feedback for the submission'
            },
            criteria: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  score: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 10
                  },
                  comment: { type: 'string' }
                },
                required: ['name', 'score']
              }
            },
            submissionId: { type: 'string', format: 'uuid' },
            evaluatedById: { type: 'string', format: 'uuid' },
            evaluatedBy: {
              $ref: '#/components/schemas/User'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string', nullable: true },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              },
              nullable: true
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Authentication required',
                error: 'No token provided'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: 'You do not have permission to perform this action'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found',
                error: 'No event found with the specified ID'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  { field: 'email', message: 'Invalid email format' },
                  { field: 'password', message: 'Password must be at least 8 characters long' }
                ]
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJSDoc(options);

const swaggerUiOptions = {
  explorer: true,
  customSiteTitle: 'SynapEvents API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  customfavIcon: '/favicon.ico'
};

const setupSwagger = (app) => {
  // Serve Swagger UI
  app.use('/api-docs', 
    swaggerUi.serve, 
    swaggerUi.setup(specs, swaggerUiOptions)
  );

  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 API documentation available at /api-docs');
};

module.exports = setupSwagger;

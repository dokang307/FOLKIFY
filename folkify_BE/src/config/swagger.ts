import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FOLKIFY Backend API',
      version: '1.0.0',
      description:
        'REST API for FOLKIFY - Vietnamese Folk Music Learning Platform. Supports authentication, premium subscriptions (FREE/BASIC/PRO), lessons with access control, AI grading service, and admin dashboard.',
      contact: {
        name: 'FOLKIFY Team',
        email: 'support@folkify.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.folkify.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Access Token (15 minutes expiration)',
        },
      },
      schemas: {
        // Error Response
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
          },
        },
        // Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
        // Pagination
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
          },
        },
        // User
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            full_name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
            },
            account_type: {
              type: 'string',
              enum: ['free', 'basic', 'pro'],
            },
            account_status: {
              type: 'string',
              enum: ['active', 'banned', 'suspended'],
            },
            premium_started_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            premium_expires_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            last_login_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        // User Stats
        UserStats: {
          type: 'object',
          properties: {
            level: {
              type: 'integer',
            },
            total_xp: {
              type: 'integer',
            },
            lessons_completed: {
              type: 'integer',
            },
            total_practice_minutes: {
              type: 'integer',
            },
            current_streak: {
              type: 'integer',
            },
            longest_streak: {
              type: 'integer',
            },
          },
        },
        // Instrument
        Instrument: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            english_name: {
              type: 'string',
            },
            region: {
              type: 'string',
            },
            category: {
              type: 'string',
            },
            emoji: {
              type: 'string',
              nullable: true,
            },
            color: {
              type: 'string',
              nullable: true,
            },
            bg_gradient: {
              type: 'string',
              nullable: true,
            },
            image: {
              type: 'string',
              nullable: true,
            },
            short_desc: {
              type: 'string',
              nullable: true,
            },
            description: {
              type: 'string',
              nullable: true,
            },
            origin: {
              type: 'string',
              nullable: true,
            },
            material: {
              type: 'string',
              nullable: true,
            },
            sound_range: {
              type: 'string',
              nullable: true,
            },
            difficulty: {
              type: 'string',
              nullable: true,
            },
            popularity: {
              type: 'integer',
            },
            facts: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
            },
            order_index: {
              type: 'integer',
            },
          },
        },
        // Lesson
        Lesson: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            instrument_id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            duration: {
              type: 'integer',
              description: 'Duration in minutes',
            },
            level: {
              type: 'string',
              enum: ['Beginner', 'Intermediate', 'Advanced'],
            },
            status: {
              type: 'string',
              enum: ['draft', 'published'],
            },
            is_premium: {
              type: 'boolean',
            },
            youtube_embed_url: {
              type: 'string',
              nullable: true,
            },
            video_thumb: {
              type: 'string',
              nullable: true,
            },
            description: {
              type: 'string',
              nullable: true,
            },
            xp: {
              type: 'integer',
            },
            order_index: {
              type: 'integer',
            },
            steps: {
              type: 'array',
              items: {
                type: 'object',
              },
              nullable: true,
            },
            tips: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
            },
            has_access: {
              type: 'boolean',
              description: 'Whether the current user has access to this lesson',
            },
            requires_premium: {
              type: 'boolean',
              description: 'Whether this lesson requires premium subscription',
            },
            completed: {
              type: 'boolean',
              description: 'Whether the current user has completed this lesson',
            },
            progress_percentage: {
              type: 'integer',
              description: 'User progress percentage (0-100)',
            },
          },
        },
        // Sheet Music
        SheetMusic: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            instrument_id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            composer: {
              type: 'string',
              nullable: true,
            },
            genre: {
              type: 'string',
            },
            level: {
              type: 'string',
              enum: ['Beginner', 'Intermediate', 'Advanced'],
            },
            is_premium: {
              type: 'boolean',
            },
            file_path: {
              type: 'string',
            },
            preview_url: {
              type: 'string',
              nullable: true,
            },
            description: {
              type: 'string',
              nullable: true,
            },
            has_access: {
              type: 'boolean',
              description: 'Whether the current user has access to this sheet',
            },
            requires_premium: {
              type: 'boolean',
              description: 'Whether this sheet requires premium subscription',
            },
          },
        },
        // AI Grading Session
        AIGradingSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
            },
            lesson_id: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            file_path: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
            },
            ai_score: {
              type: 'integer',
              nullable: true,
              description: 'Overall AI score (0-100)',
            },
            criteria_scores: {
              type: 'object',
              properties: {
                rhythm: {
                  type: 'integer',
                },
                pitch: {
                  type: 'integer',
                },
                technique: {
                  type: 'integer',
                },
                expression: {
                  type: 'integer',
                },
              },
              nullable: true,
            },
            ai_feedback: {
              type: 'string',
              nullable: true,
            },
            improvement_suggestions: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
            },
            submitted_at: {
              type: 'string',
              format: 'date-time',
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        // Practice Session
        PracticeSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
            },
            lesson_id: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            instrument_id: {
              type: 'string',
              format: 'uuid',
            },
            started_at: {
              type: 'string',
              format: 'date-time',
            },
            ended_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            duration_minutes: {
              type: 'integer',
              nullable: true,
            },
            xp_earned: {
              type: 'integer',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'abandoned'],
            },
          },
        },
        // Premium Plan
        PremiumPlan: {
          type: 'object',
          properties: {
            plan_type: {
              type: 'string',
              enum: ['basic', 'pro'],
            },
            name: {
              type: 'string',
            },
            price_monthly: {
              type: 'integer',
              description: 'Price in VND',
            },
            features: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Instruments',
        description: 'Vietnamese folk instruments management',
      },
      {
        name: 'Lessons',
        description: 'Music lessons with access control',
      },
      {
        name: 'Sheet Music',
        description: 'Sheet music library with premium content',
      },
      {
        name: 'Premium',
        description: 'Premium subscription plans and status',
      },
      {
        name: 'AI Grading',
        description: 'AI-powered performance grading (PRO users only)',
      },
      {
        name: 'Practice Sessions',
        description: 'Practice session tracking and history',
      },
      {
        name: 'Admin - Users',
        description: 'Admin user management endpoints',
      },
      {
        name: 'Admin - Content',
        description: 'Admin content management endpoints',
      },
      {
        name: 'Admin - Analytics',
        description: 'Admin analytics and reports',
      },
      {
        name: 'Health',
        description: 'System health and metrics',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

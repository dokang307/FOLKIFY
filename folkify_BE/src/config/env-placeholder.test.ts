import * as fs from 'fs';
import * as path from 'path';

/**
 * Property 3: Environment Variable Placeholder Safety
 *
 * For any environment variable value in .env.example files, the value should be
 * a placeholder (containing keywords like "your-", "change-this", "<", ">",
 * "example", or "placeholder") and not contain actual credentials, API keys,
 * or production values.
 *
 * Validates: Requirements 4.9
 */

describe('Property 3: Environment Variable Placeholder Safety', () => {
  const envExamplePath = path.join(__dirname, '../../.env.example');
  let envExampleContent: string;

  beforeEach(() => {
    if (fs.existsSync(envExamplePath)) {
      envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
    }
  });

  it('should have a .env.example file', () => {
    expect(fs.existsSync(envExamplePath)).toBe(true);
  });

  describe('when .env.example exists', () => {
    it('should not contain real database passwords', () => {
      // Common password patterns that shouldn't be in example files
      const suspiciousPatterns = [
        /password:\w{8,}/i, // password:actualpass
        /:[a-zA-Z0-9]{20,}@/, // :longpassword@
      ];

      suspiciousPatterns.forEach((pattern) => {
        const matches = envExampleContent.match(pattern);
        if (matches) {
          // If it matches, it should contain placeholder indicators
          expect(matches[0]).toMatch(/<|>|your-|example|placeholder|change-this/i);
        }
      });
    });

    it('should not contain real API keys', () => {
      // API keys typically have specific formats
      const apiKeyPatterns = [
        /sk_live_[a-zA-Z0-9]{24,}/, // Stripe live keys
        /pk_live_[a-zA-Z0-9]{24,}/, // Stripe public keys
        /AIza[a-zA-Z0-9_-]{35}/, // Google API keys
        /[0-9a-f]{32}/, // Generic 32-char hex keys
      ];

      apiKeyPatterns.forEach((pattern) => {
        const matches = envExampleContent.match(pattern);
        if (matches) {
          // If it matches an API key pattern, verify it's a placeholder
          expect(matches[0]).toMatch(/<|>|your-|example|placeholder|xxx/i);
        }
      });
    });

    it('should use placeholder indicators for sensitive values', () => {
      const lines = envExampleContent.split('\n');
      const sensitiveKeys = [
        'JWT_SECRET',
        'DATABASE_URL',
        'DIRECT_URL',
        'SUPABASE_ANON_KEY',
        'REDIS_PASSWORD',
      ];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, value] = trimmed.split('=');

          if (sensitiveKeys.some((sk) => key?.includes(sk))) {
            // Sensitive values should contain placeholder indicators
            expect(value || '').toMatch(
              /<|>|your-|example|placeholder|change-this|generate|<.*>|\[.*\]/i
            );
          }
        }
      });
    });
  });

  describe('property-based test: placeholder validation', () => {
    it('should validate all environment variable values are placeholders', () => {
      const lines = envExampleContent.split('\n');
      const envVars = parseEnvFile(lines);

      envVars.forEach(({ key, value }) => {
        // Skip empty values and non-sensitive keys
        if (!value || isNonSensitiveKey(key)) {
          return;
        }

        const isPlaceholder = isPlaceholderValue(value);
        expect(isPlaceholder).toBe(true);
      });
    });

    it('should not contain production-like URLs', () => {
      const productionPatterns = [
        /https:\/\/api\.production\.com/,
        /https:\/\/.*\.railway\.app/,
        /https:\/\/.*\.vercel\.app/,
      ];

      productionPatterns.forEach((pattern) => {
        const matches = envExampleContent.match(pattern);
        if (matches) {
          // If it matches a production URL, it should be clearly a placeholder
          expect(matches[0]).toMatch(/<|>|your-|example/);
        }
      });
    });

    it('should not contain real email addresses', () => {
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = envExampleContent.match(emailPattern);

      if (matches) {
        matches.forEach((email) => {
          // Should be example emails
          expect(email).toMatch(/example\.com|test\.com|placeholder/i);
        });
      }
    });
  });
});

/**
 * Parse environment file into key-value pairs
 */
function parseEnvFile(lines: string[]): Array<{ key: string; value: string }> {
  const envVars: Array<{ key: string; value: string }> = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');

      if (key && value) {
        envVars.push({ key: key.trim(), value: value.trim() });
      }
    }
  });

  return envVars;
}

/**
 * Check if a key is non-sensitive (doesn't need placeholder validation)
 */
function isNonSensitiveKey(key: string): boolean {
  const nonSensitiveKeys = [
    'NODE_ENV',
    'PORT',
    'LOG_LEVEL',
    'EMAIL_MODE',
    'MAX_AUDIO_SIZE',
    'MAX_VIDEO_SIZE',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
    'AUTH_RATE_LIMIT_MAX_REQUESTS',
    'CACHE_TTL_',
    'QUEUE_RETRY_ATTEMPTS',
    'QUEUE_RETRY_DELAY',
    'JWT_ACCESS_EXPIRATION',
    'JWT_REFRESH_EXPIRATION',
    'PREMIUM_EXPIRATION_CRON',
    'UPLOAD_DIR',
    'LOG_DIR',
  ];

  return nonSensitiveKeys.some((nsk) => key.includes(nsk));
}

/**
 * Check if a value is a placeholder (not a real credential)
 */
function isPlaceholderValue(value: string): boolean {
  const placeholderIndicators = [
    '<',
    '>',
    'your-',
    'example',
    'placeholder',
    'change-this',
    'generate',
    'xxx',
    'test-',
    '[',
    ']',
  ];

  return placeholderIndicators.some((indicator) => value.toLowerCase().includes(indicator));
}

import * as fs from 'fs';
import * as path from 'path';

/**
 * Property 4: Migration Failure Prevents Startup
 *
 * For any Railway start command configuration, if the command includes migration
 * execution followed by server startup (using && operator), then a migration
 * failure (non-zero exit code) should prevent the server startup command from
 * executing.
 *
 * Validates: Requirements 5.3
 */

describe('Property 4: Migration Failure Prevents Startup', () => {
  const railwayConfigPath = path.join(__dirname, '../../railway.json');
  let railwayConfig: any;

  beforeEach(() => {
    if (fs.existsSync(railwayConfigPath)) {
      const content = fs.readFileSync(railwayConfigPath, 'utf-8');
      railwayConfig = JSON.parse(content);
    }
  });

  it('should have a railway.json configuration file', () => {
    expect(fs.existsSync(railwayConfigPath)).toBe(true);
  });

  describe('when railway.json exists', () => {
    it('should have a deploy.startCommand', () => {
      expect(railwayConfig.deploy).toBeDefined();
      expect(railwayConfig.deploy.startCommand).toBeDefined();
      expect(typeof railwayConfig.deploy.startCommand).toBe('string');
    });

    it('should include migration command in start command', () => {
      const startCommand = railwayConfig.deploy.startCommand;
      expect(startCommand).toContain('prisma migrate');
    });

    it('should use && operator to chain migration and startup', () => {
      const startCommand = railwayConfig.deploy.startCommand;
      expect(startCommand).toContain('&&');
    });

    it('should run migrations before server startup', () => {
      const startCommand = railwayConfig.deploy.startCommand;
      const parts = startCommand.split('&&').map((p: string) => p.trim());

      // First part should be migration
      expect(parts[0]).toContain('prisma migrate');

      // Second part should be server startup
      expect(parts[1]).toMatch(/npm start|node/);
    });

    it('should not use ; or | operators that allow continuation on failure', () => {
      const startCommand = railwayConfig.deploy.startCommand;

      // Should not use ; (runs next command regardless of failure)
      const hasSemicolon = startCommand.includes(';') && !startCommand.includes('&&');
      expect(hasSemicolon).toBe(false);

      // Should not use | (pipe, different purpose but can mask failures)
      const hasPipe = startCommand.includes('|') && !startCommand.includes('||');
      expect(hasPipe).toBe(false);
    });
  });

  describe('property-based test: command chaining behavior', () => {
    it('should validate && operator prevents execution on failure', () => {
      const testCommands = [
        {
          command: 'npx prisma migrate deploy && npm start',
          shouldPreventStartup: true,
          description: 'migration before startup',
        },
        {
          command: 'npx prisma migrate deploy; npm start',
          shouldPreventStartup: false,
          description: 'semicolon allows continuation',
        },
        {
          command: 'npx prisma migrate deploy || npm start',
          shouldPreventStartup: false,
          description: 'OR operator runs on failure',
        },
      ];

      testCommands.forEach(({ command, shouldPreventStartup, description }) => {
        const preventsStartup = commandPreventsStartupOnFailure(command);
        expect(preventsStartup).toBe(shouldPreventStartup);
      });
    });

    it('should validate migration command comes before startup', () => {
      const startCommand = railwayConfig.deploy.startCommand;
      const migrationIndex = startCommand.indexOf('prisma migrate');
      const startupIndex = startCommand.indexOf('npm start');

      expect(migrationIndex).toBeGreaterThan(-1);
      expect(startupIndex).toBeGreaterThan(-1);
      expect(migrationIndex).toBeLessThan(startupIndex);
    });

    it('should use npx prisma migrate deploy command', () => {
      const startCommand = railwayConfig.deploy.startCommand;
      expect(startCommand).toContain('npx prisma migrate deploy');
    });
  });

  describe('error handling validation', () => {
    it('should not have error suppression in migration command', () => {
      const startCommand = railwayConfig.deploy.startCommand;

      // Should not suppress errors with || true
      expect(startCommand).not.toContain('|| true');

      // Should not redirect errors to /dev/null
      expect(startCommand).not.toContain('2>/dev/null');

      // Should not use try-catch in shell
      expect(startCommand).not.toContain('|| :');
    });

    it('should fail fast on migration errors', () => {
      const startCommand = railwayConfig.deploy.startCommand;

      // Should not have continue-on-error patterns
      const continueOnErrorPatterns = [/\|\| echo/, /\|\| exit 0/, /; exit 0/, /2>&1 \| grep -v/];

      continueOnErrorPatterns.forEach((pattern) => {
        expect(startCommand).not.toMatch(pattern);
      });
    });
  });
});

/**
 * Check if a command prevents startup on migration failure
 */
function commandPreventsStartupOnFailure(command: string): boolean {
  // Commands using && will stop on first failure
  if (command.includes('&&')) {
    const parts = command.split('&&');
    // Check if migration comes before startup
    const migrationIndex = parts.findIndex((p) => p.includes('migrate'));
    const startupIndex = parts.findIndex((p) => p.includes('start') || p.includes('node'));

    return migrationIndex >= 0 && startupIndex > migrationIndex;
  }

  // Commands using ; or | don't prevent continuation
  return false;
}

import * as fs from 'fs';
import * as path from 'path';

/**
 * Property 1: Sensitive File Exclusion
 *
 * For any file path matching sensitive patterns (.env, node_modules/, dist/, logs/,
 * uploads/, *.log, *.pem, *.key), the .gitignore file should contain a pattern
 * that excludes it from version control.
 *
 * Validates: Requirements 1.4
 */

describe('Property 1: Sensitive File Exclusion', () => {
  const gitignorePath = path.join(__dirname, '../../.gitignore');
  let gitignoreContent: string;

  beforeEach(() => {
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    }
  });

  it('should have a .gitignore file', () => {
    expect(fs.existsSync(gitignorePath)).toBe(true);
  });

  describe('when .gitignore exists', () => {
    it('should exclude node_modules directory', () => {
      expect(gitignoreContent).toMatch(/node_modules/);
    });

    it('should exclude .env files', () => {
      expect(gitignoreContent).toMatch(/\.env/);
    });

    it('should exclude dist directory', () => {
      expect(gitignoreContent).toMatch(/dist/);
    });

    it('should exclude logs directory', () => {
      expect(gitignoreContent).toMatch(/logs/);
    });

    it('should exclude uploads directory', () => {
      expect(gitignoreContent).toMatch(/uploads/);
    });

    it('should exclude .log files', () => {
      expect(gitignoreContent).toMatch(/\*\.log/);
    });

    it('should exclude .pem files', () => {
      expect(gitignoreContent).toMatch(/\*\.pem/);
    });

    it('should exclude .key files', () => {
      expect(gitignoreContent).toMatch(/\*\.key/);
    });

    it('should exclude coverage directory', () => {
      expect(gitignoreContent).toMatch(/coverage/);
    });

    it('should exclude build directory', () => {
      expect(gitignoreContent).toMatch(/build/);
    });
  });

  describe('property-based test: sensitive file patterns', () => {
    const sensitivePatterns = [
      { pattern: '.env', description: 'environment files' },
      { pattern: '.env.local', description: 'local environment files' },
      { pattern: '.env.production', description: 'production environment files' },
      { pattern: 'node_modules/', description: 'dependencies' },
      { pattern: 'dist/', description: 'build output' },
      { pattern: 'logs/', description: 'log directory' },
      { pattern: 'uploads/', description: 'upload directory' },
      { pattern: 'test.log', description: 'log files' },
      { pattern: 'private.pem', description: 'certificate files' },
      { pattern: 'secret.key', description: 'key files' },
      { pattern: 'coverage/', description: 'test coverage' },
    ];

    sensitivePatterns.forEach(({ pattern, description }) => {
      it(`should exclude ${description} (${pattern})`, () => {
        const isExcluded = checkIfPatternExcluded(pattern, gitignoreContent);
        expect(isExcluded).toBe(true);
      });
    });
  });
});

/**
 * Check if a file pattern is excluded by .gitignore
 */
function checkIfPatternExcluded(filePath: string, gitignoreContent: string): boolean {
  const lines = gitignoreContent.split('\n').filter((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#');
  });

  for (const line of lines) {
    const pattern = line.trim();

    // Exact match
    if (pattern === filePath) {
      return true;
    }

    // Directory match
    if (pattern.endsWith('/') && filePath.startsWith(pattern)) {
      return true;
    }

    // Wildcard match for extensions
    if (pattern.startsWith('*.')) {
      const ext = pattern.substring(1);
      if (filePath.endsWith(ext)) {
        return true;
      }
    }

    // Glob pattern match (simplified)
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(filePath)) {
        return true;
      }
    }

    // Partial match for directories
    if (filePath.includes(pattern.replace(/\//g, ''))) {
      return true;
    }
  }

  return false;
}

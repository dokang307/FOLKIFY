import { canAccessSheet, getSheetWithAccess, downloadSheet } from './sheet.service';
import * as sheetRepository from '../repositories/sheet.repository';
import * as userRepository from '../repositories/user.repository';
import { ForbiddenError, NotFoundError } from '../utils/errors';

// Mock repositories
jest.mock('../repositories/sheet.repository');
jest.mock('../repositories/user.repository');

describe('Sheet Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canAccessSheet', () => {
    it('should allow access to free sheets for all users', () => {
      const user = {
        id: 'user-1',
        account_type: 'free' as const,
        premium_expires_at: null,
      } as any;

      const sheet = {
        id: 'sheet-1',
        is_premium: false,
      } as any;

      const result = canAccessSheet(user, sheet);

      expect(result).toBe(true);
    });

    it('should deny access to premium sheets for free users', () => {
      const user = {
        id: 'user-1',
        account_type: 'free' as const,
        premium_expires_at: null,
      } as any;

      const sheet = {
        id: 'sheet-1',
        is_premium: true,
      } as any;

      const result = canAccessSheet(user, sheet);

      expect(result).toBe(false);
    });

    it('should allow access to premium sheets for basic users with active subscription', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const user = {
        id: 'user-1',
        account_type: 'basic' as const,
        premium_expires_at: futureDate,
      } as any;

      const sheet = {
        id: 'sheet-1',
        is_premium: true,
      } as any;

      const result = canAccessSheet(user, sheet);

      expect(result).toBe(true);
    });

    it('should allow access to premium sheets for pro users with active subscription', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const user = {
        id: 'user-1',
        account_type: 'pro' as const,
        premium_expires_at: futureDate,
      } as any;

      const sheet = {
        id: 'sheet-1',
        is_premium: true,
      } as any;

      const result = canAccessSheet(user, sheet);

      expect(result).toBe(true);
    });

    it('should deny access to premium sheets for users with expired subscription', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const user = {
        id: 'user-1',
        account_type: 'basic' as const,
        premium_expires_at: pastDate,
      } as any;

      const sheet = {
        id: 'sheet-1',
        is_premium: true,
      } as any;

      const result = canAccessSheet(user, sheet);

      expect(result).toBe(false);
    });
  });

  describe('getSheetWithAccess', () => {
    it('should return sheet with access flags for authorized user', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockUser = {
        id: 'user-1',
        account_type: 'basic' as const,
        premium_expires_at: futureDate,
      } as any;

      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        is_premium: true,
        instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
      } as any;

      (sheetRepository.getSheetById as jest.Mock).mockResolvedValue(mockSheet);
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);

      const result = await getSheetWithAccess('sheet-1', 'user-1');

      expect(result).toEqual({
        ...mockSheet,
        has_access: true,
        requires_premium: false,
      });
    });

    it('should return sheet with requires_premium flag for unauthorized user', async () => {
      const mockUser = {
        id: 'user-1',
        account_type: 'free' as const,
        premium_expires_at: null,
      } as any;

      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        is_premium: true,
        instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
      } as any;

      (sheetRepository.getSheetById as jest.Mock).mockResolvedValue(mockSheet);
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);

      const result = await getSheetWithAccess('sheet-1', 'user-1');

      expect(result).toEqual({
        ...mockSheet,
        has_access: false,
        requires_premium: true,
      });
    });

    it('should throw NotFoundError if sheet does not exist', async () => {
      (sheetRepository.getSheetById as jest.Mock).mockResolvedValue(null);

      await expect(getSheetWithAccess('non-existent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        is_premium: true,
      } as any;

      (sheetRepository.getSheetById as jest.Mock).mockResolvedValue(mockSheet);
      (userRepository.findUserById as jest.Mock).mockResolvedValue(null);

      await expect(getSheetWithAccess('sheet-1', 'non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('downloadSheet', () => {
    it('should return file path for authorized user', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockUser = {
        id: 'user-1',
        account_type: 'basic' as const,
        premium_expires_at: futureDate,
      } as any;

      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        is_premium: true,
        file_path: '/uploads/sheets/sheet-1/test.pdf',
        instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
      } as any;

      (sheetRepository.getSheetById as jest.Mock).mockResolvedValue(mockSheet);
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);

      const result = await downloadSheet('sheet-1', 'user-1');

      expect(result).toBe('/uploads/sheets/sheet-1/test.pdf');
    });

    it('should throw ForbiddenError for unauthorized user', async () => {
      const mockUser = {
        id: 'user-1',
        account_type: 'free' as const,
        premium_expires_at: null,
      } as any;

      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        is_premium: true,
        file_path: '/uploads/sheets/sheet-1/test.pdf',
        instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
      } as any;

      (sheetRepository.getSheetById as jest.Mock).mockResolvedValue(mockSheet);
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);

      await expect(downloadSheet('sheet-1', 'user-1')).rejects.toThrow(ForbiddenError);
    });

    it('should allow free users to download free sheets', async () => {
      const mockUser = {
        id: 'user-1',
        account_type: 'free' as const,
        premium_expires_at: null,
      } as any;

      const mockSheet = {
        id: 'sheet-1',
        title: 'Test Sheet',
        is_premium: false,
        file_path: '/uploads/sheets/sheet-1/test.pdf',
        instrument: { id: 'instrument-1', name: 'Đàn Tranh' },
      } as any;

      (sheetRepository.getSheetById as jest.Mock).mockResolvedValue(mockSheet);
      (userRepository.findUserById as jest.Mock).mockResolvedValue(mockUser);

      const result = await downloadSheet('sheet-1', 'user-1');

      expect(result).toBe('/uploads/sheets/sheet-1/test.pdf');
    });

    it('should throw NotFoundError if sheet does not exist', async () => {
      (sheetRepository.getSheetById as jest.Mock).mockResolvedValue(null);

      await expect(downloadSheet('non-existent', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });
});

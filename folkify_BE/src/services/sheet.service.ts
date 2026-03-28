import { User, SheetMusic, Instrument } from '@prisma/client';
import { getSheetById } from '../repositories/sheet.repository';
import { findUserById } from '../repositories/user.repository';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Check if user can access a sheet
 * @param user - User object
 * @param sheet - SheetMusic object
 * @returns true if user has access
 */
export function canAccessSheet(user: User, sheet: SheetMusic): boolean {
  // Free sheets are accessible to everyone
  if (!sheet.is_premium) {
    return true;
  }

  // Check if premium is active
  const isPremium =
    (user.account_type === 'basic' || user.account_type === 'pro') &&
    user.premium_expires_at !== null &&
    user.premium_expires_at > new Date();

  return isPremium;
}

/**
 * Get sheet with access control
 * @param sheetId - Sheet ID
 * @param userId - User ID
 * @returns Sheet with access flags
 */
export async function getSheetWithAccess(
  sheetId: string,
  userId: string
): Promise<
  SheetMusic & {
    instrument: Instrument;
    has_access: boolean;
    requires_premium: boolean;
  }
> {
  // Get sheet
  const sheet = await getSheetById(sheetId);
  if (!sheet) {
    throw new NotFoundError('Sheet music not found', 'SHEET_NOT_FOUND');
  }

  // Get user
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Check access
  const hasAccess = canAccessSheet(user, sheet);

  return {
    ...sheet,
    has_access: hasAccess,
    requires_premium: !hasAccess && sheet.is_premium,
  };
}

/**
 * Download sheet (serve file if has access)
 * @param sheetId - Sheet ID
 * @param userId - User ID
 * @returns File path if user has access
 */
export async function downloadSheet(sheetId: string, userId: string): Promise<string> {
  // Get sheet
  const sheet = await getSheetById(sheetId);
  if (!sheet) {
    throw new NotFoundError('Sheet music not found', 'SHEET_NOT_FOUND');
  }

  // Get user
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Check access
  if (!canAccessSheet(user, sheet)) {
    throw new ForbiddenError(
      'You do not have access to this sheet music. Upgrade to premium.',
      'SHEET_ACCESS_DENIED'
    );
  }

  logger.info(`User ${userId} downloaded sheet ${sheetId}`);

  return sheet.file_path;
}

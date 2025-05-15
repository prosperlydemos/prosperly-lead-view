import { Lead, User } from '@/types';

/**
 * Calculate commission for a lead based on owner's commission rules or use stored value
 */
export const calculateCommission = (lead: Lead, users: User[]): number => {
  // If we have a stored commission amount, use that
  if (lead.commissionAmount !== undefined && lead.commissionAmount !== null) {
    return lead.commissionAmount;
  }
  
  // Otherwise calculate based on rules
  const owner = users.find(user => user.id === lead.ownerId);
  if (!owner || !owner.commissionRules || owner.commissionRules.length === 0) {
    return 0;
  }

  // Find the base rule (threshold = 0)
  const baseRule = owner.commissionRules.find(rule => rule.threshold === 0);
  if (baseRule) {
    return baseRule.amount;
  }

  // Default commission if no base rule found
  return 249;
};

/**
 * Format a number to currency display
 */
export const safeFormat = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '$0';
  }
  return `$${value.toLocaleString()}`;
};

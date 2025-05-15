
import { Lead, User } from '../types';

/**
 * Calculate commission amount for a lead based on user's commission rules
 */
export const calculateCommission = (lead: Lead, users: User[]): number => {
  // If lead has a custom commission amount, use that
  if (lead.commissionAmount !== undefined && lead.commissionAmount !== null) {
    return lead.commissionAmount;
  }
  
  // If lead is not closed, no commission
  if (lead.status !== 'Closed') {
    return 0;
  }
  
  // Find the owner of the lead
  const owner = users.find(user => user.id === lead.ownerId);
  if (!owner) {
    return 0;
  }
  
  // If owner has commission rules, calculate based on rules
  if (owner.commissionRules && owner.commissionRules.length > 0) {
    // Use the base rule (threshold = 0) as default
    const baseRule = owner.commissionRules.find(rule => rule.threshold === 0);
    if (baseRule) {
      return baseRule.amount;
    }
  }
  
  // Default commission if no rules defined
  return 249; // Default commission of $249 per deal
};

/**
 * Format date for display
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

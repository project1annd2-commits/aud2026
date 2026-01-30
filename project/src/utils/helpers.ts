export const generateId = (): string => {
  return crypto.randomUUID();
};

export const generateAccessCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

import { employees } from '../data/employees';

export const getEmployeeDisplayName = (username: string): string => {
  const employee = employees.find(e => e.username === username);
  return employee ? employee.displayName : username;
};

/**
 * Generates a unique 4-digit access code by checking the database for duplicates.
 * Will attempt up to 100 times to find a unique code before throwing an error.
 * @returns Promise<string> A unique 4-digit access code
 * @throws Error if unable to generate unique code after max attempts
 */
export const generateUniqueAccessCode = async (): Promise<string> => {
  // Dynamic import to avoid circular dependency
  const { storage } = await import('./storage');

  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Check if code already exists in database
    const existing = await storage.getAuditByAccessCode(code);
    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error('Unable to generate unique access code after 100 attempts. Please try again.');
};

export const formatDate = (dateString: string): string => {
  // Handle empty or invalid date strings
  if (!dateString || dateString === 'Invalid Date') {
    return 'Unknown Date';
  }

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculatePercentage = (score: number, maxScore: number): number => {
  if (maxScore === 0 || maxScore < 0) return 0;
  const percentage = (score / maxScore) * 100;
  // Cap percentage at 100% to prevent impossible values
  return Math.round(Math.min(percentage, 100));
};

import { AuditResponse, AuditCriteria } from '../types';

export const calculateAdjustedScore = (responses: AuditResponse[] | null | undefined, criteria: AuditCriteria[]) => {
  // Ensure responses is an array
  if (!Array.isArray(responses)) {
    return {
      totalScore: 0,
      maxScore: Math.max(criteria.length * 4, 1),
      applicableCount: 0,
      notApplicableCount: criteria.length
    };
  }

  // Filter out "Not Applicable" responses (score = 0)
  const applicableResponses = responses.filter(response => response && response.score > 0);
  const applicableCriteria = criteria.filter(criterion => {
    const response = responses.find(r => r && r.criteriaId === criterion.id);
    return response && response.score > 0;
  });

  const totalScore = applicableResponses.reduce((sum, response) => sum + response.score, 0);
  const maxScore = Math.max(applicableCriteria.length * 4, 1); // Prevent division by zero, 4 is the maximum score per criterion

  return {
    totalScore,
    maxScore,
    applicableCount: applicableCriteria.length,
    notApplicableCount: criteria.length - applicableCriteria.length
  };
};

export const getScoreColor = (percentage: number): string => {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const getScoreBadgeColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-100 text-green-800';
  if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};
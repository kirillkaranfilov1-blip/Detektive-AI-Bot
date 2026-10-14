import { DetectiveCase } from './types.js';
import { blackwoodManorCase } from './data/blackwood-manor.js';

const casesRegistry: Map<string, DetectiveCase> = new Map();

// Register built-in cases
casesRegistry.set(blackwoodManorCase.id, blackwoodManorCase);

export function getAllCases(): DetectiveCase[] {
  return Array.from(casesRegistry.values());
}

export function getCaseById(caseId: string): DetectiveCase | undefined {
  return casesRegistry.get(caseId);
}

export function registerCase(detectiveCase: DetectiveCase): void {
  casesRegistry.set(detectiveCase.id, detectiveCase);
}

export * from './types.js';

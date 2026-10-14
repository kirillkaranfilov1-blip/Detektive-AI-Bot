export interface Clue {
  id: string;
  name: string;
  category: 'PHYSICAL' | 'DOCUMENT' | 'TESTIMONY' | 'DIGITAL';
  description: string;
  details: string; // What detective sees upon close examination
  significance: string; // Internal note for LLM evaluator
}

export interface Suspect {
  id: string;
  name: string;
  role: string; // e.g. "Личный врач", "Вдова", "Дворецкий"
  avatarEmoji: string;
  personality: string; // Temperament, speech style, mannerisms
  alibi: string; // Stated alibi (can have flaws or lies)
  secretTruth: string; // What they hide or what their actual action was
  motive: string; // Potential motive to suspect them
  isCulprit: boolean;
  systemPrompt: string; // Core system prompt for in-character interrogation
}

export interface DetectiveCase {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'Легкое' | 'Среднее' | 'Сложное' | 'Эксперт';
  synopsis: string;
  crimeScene: string;
  victim: {
    name: string;
    details: string;
    causeOfDeath: string;
  };
  culpritId: string;
  trueExplanation: string; // Full true crime reconstruction
  clues: Clue[];
  suspects: Suspect[];
  minCluesToAccuse?: number;
}

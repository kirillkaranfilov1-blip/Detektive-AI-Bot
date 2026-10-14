import { prisma } from '../db/prisma.js';
import { getCaseById } from '../cases/index.js';

export class SessionManager {
  /**
   * Finds or creates a user by Telegram profile
   */
  async getOrCreateUser(telegramUser: {
    id: number | bigint;
    username?: string;
    first_name?: string;
    last_name?: string;
  }) {
    const tgId = BigInt(telegramUser.id);
    return await prisma.user.upsert({
      where: { telegramId: tgId },
      update: {
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
      },
      create: {
        telegramId: tgId,
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
      },
    });
  }

  /**
   * Retrieves current active investigation session for user
   */
  async getActiveSession(userId: number) {
    return await prisma.gameSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Starts a new case investigation session
   */
  async startNewSession(userId: number, caseId: string) {
    const targetCase = getCaseById(caseId);
    if (!targetCase) {
      throw new Error(`Case not found: ${caseId}`);
    }

    // Mark previous active sessions as abandoned
    await prisma.gameSession.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'ABANDONED' },
    });

    return await prisma.gameSession.create({
      data: {
        userId,
        caseId,
        status: 'ACTIVE',
        discoveredClues: JSON.stringify([]),
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Records a discovered clue in the investigation dossier
   */
  async discoverClue(sessionId: string, clueId: string): Promise<{ added: boolean; clues: string[] }> {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return { added: false, clues: [] };

    let currentClues: string[] = [];
    try {
      currentClues = JSON.parse(session.discoveredClues) || [];
    } catch {
      currentClues = [];
    }

    if (!currentClues.includes(clueId)) {
      currentClues.push(clueId);
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { discoveredClues: JSON.stringify(currentClues) },
      });
      return { added: true, clues: currentClues };
    }

    return { added: false, clues: currentClues };
  }

  /**
   * Gets list of discovered clue IDs
   */
  async getDiscoveredClues(sessionId: string): Promise<string[]> {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return [];
    try {
      return JSON.parse(session.discoveredClues) || [];
    } catch {
      return [];
    }
  }

  /**
   * Sets currently interrogated suspect
   */
  async setActiveSuspect(sessionId: string, suspectId: string | null) {
    return await prisma.gameSession.update({
      where: { id: sessionId },
      data: { activeSuspectId: suspectId },
    });
  }

  /**
   * Saves dialogue message between detective and suspect
   */
  async addDialogueMessage(sessionId: string, suspectId: string, role: 'user' | 'assistant', content: string) {
    return await prisma.dialogueMessage.create({
      data: {
        sessionId,
        suspectId,
        role,
        content,
      },
    });
  }

  /**
   * Retrieves dialogue history for a suspect
   */
  async getDialogueHistory(sessionId: string, suspectId: string, limit = 10) {
    const messages = await prisma.dialogueMessage.findMany({
      where: {
        sessionId,
        suspectId,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));
  }

  /**
   * Closes the case with verdict results
   */
  async finalizeVerdict(
    sessionId: string,
    data: {
      culpritId: string;
      accusationDetails: string;
      score: number;
      feedback: string;
      isSolved: boolean;
    }
  ) {
    return await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: data.isSolved ? 'SOLVED' : 'FAILED',
        activeSuspectId: null,
        accusationCulpritId: data.culpritId,
        accusationDetails: data.accusationDetails,
        verdictScore: data.score,
        verdictFeedback: data.feedback,
      },
    });
  }
}

export const sessionManager = new SessionManager();

import OpenAI from 'openai';
import { config } from '../config/index.js';
import { DetectiveCase, Suspect } from '../cases/types.js';

class AIService {
  private openai: OpenAI | null = null;
  private isConfigured = false;

  constructor() {
    if (config.OPENAI_API_KEY && config.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY') {
      try {
        this.openai = new OpenAI({
          apiKey: config.OPENAI_API_KEY,
          baseURL: config.OPENAI_BASE_URL,
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('⚠️ OpenAI client initialization warning:', err);
      }
    } else {
      console.warn('⚠️ OPENAI_API_KEY is not configured. Running in simulated fallback mode.');
    }
  }

  /**
   * Generates a response during suspect interrogation
   */
  async interrogateSuspect(options: {
    detectiveCase: DetectiveCase;
    suspect: Suspect;
    discoveredClues: string[];
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    question: string;
  }): Promise<string> {
    const { detectiveCase, suspect, discoveredClues, history, question } = options;

    if (!this.isConfigured || !this.openai) {
      return this.getSimulatedSuspectResponse(suspect, question);
    }

    try {
      const knownCluesInfo = detectiveCase.clues
        .filter((c) => discoveredClues.includes(c.id))
        .map((c) => `- ${c.name}: ${c.description}`)
        .join('\n');

      const systemPrompt = `
${suspect.systemPrompt}

ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ ДЕЛА:
- Дело: ${detectiveCase.title}
- Обстоятельства: ${detectiveCase.crimeScene}
- Жертва: ${detectiveCase.victim.name} (${detectiveCase.victim.details}, причина смерти: ${detectiveCase.victim.causeOfDeath})
- Улики, которые уже известны детективу:
${knownCluesInfo || 'Детектив пока не предъявил конкретных улик.'}

ПРАВИЛА ОТВЕТА:
1. Вы ВСЕГДА остаетесь в своей роли: ${suspect.name} (${suspect.role}).
2. Никогда не ломайте четвертую стену и не признавайте, что вы ИИ.
3. Отвечайте на русском языке.
4. Ответ должен быть лаконичным (1-3 абзаца), реалистичным, передавать характер персонажа.
5. Если детектив приводит сильные улики, уличающие вас во лжи — реагируйте эмоционально, запинайтесь или пытайтесь оправдаться.
      `.trim();

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8).map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: question },
      ];

      const completion = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 400,
      });

      return completion.choices[0]?.message?.content?.trim() || '... (персонаж хранит молчание)';
    } catch (error) {
      console.error('❌ OpenAI API error during interrogation:', error);
      return this.getSimulatedSuspectResponse(suspect, question);
    }
  }

  /**
   * Evaluates the detective's final accusation
   */
  async evaluateAccusation(options: {
    detectiveCase: DetectiveCase;
    accusedSuspect: Suspect;
    userTheory: string;
    discoveredClues: string[];
  }): Promise<{
    isCorrectCulprit: boolean;
    score: number;
    verdictTitle: string;
    feedback: string;
    closureStory: string;
  }> {
    const { detectiveCase, accusedSuspect, userTheory, discoveredClues } = options;
    const isCorrectCulprit = accusedSuspect.id === detectiveCase.culpritId;

    if (!this.isConfigured || !this.openai) {
      return this.getSimulatedVerdict(isCorrectCulprit, detectiveCase, accusedSuspect, userTheory);
    }

    try {
      const prompt = `
Ты — верховный судья и нарратор детективного агентства.
Оцени обвинение детектива.

ДАННЫЕ ДЕЛА:
- Название: ${detectiveCase.title}
- Истинный виновник: ${detectiveCase.culpritId}
- Истинный ход событий: ${detectiveCase.trueExplanation}

ВЕРСИЯ ДЕТЕКТИВА:
- Обвиняемый: ${accusedSuspect.name} (id: ${accusedSuspect.id})
- Доводы и улики от детектива: ${userTheory}
- Найденные улики игроком: ${discoveredClues.join(', ')}

ЗАДАЧА:
Верни СТРОГО валидный JSON в таком формате (без лишней разметки):
{
  "isCorrectCulprit": boolean,
  "score": number (от 0 до 100),
  "verdictTitle": "Краткий заголовок (например: Блестящее раскрытие! / Ошибка следствия)",
  "feedback": "Подробный разбор доказательной базы детектива на русском языке (3-5 предложений)",
  "closureStory": "Художественная сцена разоблачения и финала дела (3-5 предложений)"
}
      `.trim();

      const completion = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return {
          isCorrectCulprit: Boolean(parsed.isCorrectCulprit),
          score: Math.min(100, Math.max(0, Number(parsed.score) || (isCorrectCulprit ? 80 : 30))),
          verdictTitle: String(parsed.verdictTitle || (isCorrectCulprit ? 'Дело раскрыто!' : 'Ошибка следствия')),
          feedback: String(parsed.feedback || ''),
          closureStory: String(parsed.closureStory || detectiveCase.trueExplanation),
        };
      }
    } catch (err) {
      console.error('❌ OpenAI API error during verdict:', err);
    }

    return this.getSimulatedVerdict(isCorrectCulprit, detectiveCase, accusedSuspect, userTheory);
  }

  private getSimulatedSuspectResponse(suspect: Suspect, question: string): string {
    const q = question.toLowerCase();
    if (q.includes('где вы были') || q.includes('алиби') || q.includes('ночь')) {
      return `[${suspect.name}]: Мое алиби прозрачно: ${suspect.alibi}`;
    }
    if (q.includes('чай') || q.includes('яд') || q.includes('нить') || q.includes('долг')) {
      if (suspect.isCulprit) {
        return `[${suspect.name}]: *(бледнеет и начинает поправлять очки)* Что?! Откуда у вас... Я решительно отвергаю эти инсинуации! Мои действия не подлежат сомнению!`;
      }
      return `[${suspect.name}]: Об этом лучше спросить доктора или дворецкого. Я не имею понятия, о чем вы говорите.`;
    }
    return `[${suspect.name}]: Я ответил на все ваши вопросы в пределах разумного, детектив. Если у вас нет прямых обвинений, позвольте мне заняться делами.`;
  }

  private getSimulatedVerdict(
    isCorrectCulprit: boolean,
    detectiveCase: DetectiveCase,
    accusedSuspect: Suspect,
    userTheory: string
  ) {
    if (isCorrectCulprit) {
      return {
        isCorrectCulprit: true,
        score: 95,
        verdictTitle: '🏆 Блестящее раскрытие дела!',
        feedback:
          `Вы безошибочно указали на виновника — ${accusedSuspect.name}. ` +
          `Ваша логика и представленные доказательства разрушили ложное алиби преступника.`,
        closureStory:
          `Прижатый к стене неопровержимыми уликами, ${accusedSuspect.name} сознался во всем. ` +
          `Полиция Скотланд-Ярда берет преступника под стражу. ${detectiveCase.trueExplanation}`,
      };
    } else {
      return {
        isCorrectCulprit: false,
        score: 25,
        verdictTitle: '❌ Ошибка правосудия!',
        feedback:
          `Вы обвинили ${accusedSuspect.name}, но у следствия нет достаточных оснований. ` +
          `Настоящий убийца остался на свободе и покинул поместье под покровом ночи.`,
        closureStory:
          `Суд отклонил ваше обвинение из-за отсутствия прямых улик. ` +
          `Истинная тайна преступления: ${detectiveCase.trueExplanation}`,
      };
    }
  }
}

export const aiService = new AIService();

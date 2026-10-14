import { Context } from 'grammy';
import { getCaseById, getAllCases } from '../cases/index.js';
import { sessionManager } from '../engine/session.js';
import { aiService } from '../ai/client.js';
import {
  getMainMenuKeyboard,
  getCluesListKeyboard,
  getClueDetailKeyboard,
  getSuspectsListKeyboard,
  getInterrogationKeyboard,
  getAccusationSelectKeyboard,
  getFinishedCaseKeyboard,
} from './keyboards.js';

// Temporary in-memory pending accusation state: telegramId -> suspectId
const pendingAccusations = new Map<bigint, string>();

export async function handleStart(ctx: Context) {
  if (!ctx.from) return;
  const user = await sessionManager.getOrCreateUser(ctx.from);
  let session = await sessionManager.getActiveSession(user.id);

  if (!session) {
    // Default to the first case (Blackwood Manor)
    const defaultCase = getAllCases()[0];
    session = await sessionManager.startNewSession(user.id, defaultCase.id);
  }

  const activeCase = getCaseById(session.caseId);
  if (!activeCase) return;

  const text =
    `🕵️‍♂️ **ДЕТЕКТИВНОЕ АГЕНТСТВО: DETEKTIVE AI**\n\n` +
    `Приветствуем вас, детектив ${ctx.from.first_name || 'Инспектор'}!\n\n` +
    `Вам поручено расследование:\n` +
    `📌 **${activeCase.title}**\n` +
    `*${activeCase.subtitle}*\n\n` +
    `📖 **Краткая сводка:**\n${activeCase.synopsis}\n\n` +
    `💡 *Используйте кнопки меню ниже для расследования. Вы можете осматривать улики, опрашивать свидетелей в свободной форме и выдвинуть обвинение, когда соберете достаточно доказательств.*`;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainMenuKeyboard(activeCase.id),
  });
}

export async function handleCaseCommand(ctx: Context) {
  if (!ctx.from) return;
  const user = await sessionManager.getOrCreateUser(ctx.from);
  const session = await sessionManager.getActiveSession(user.id);

  if (!session) {
    return ctx.reply('У вас нет активного дела. Напишите /start для начала расследования.');
  }

  const activeCase = getCaseById(session.caseId);
  if (!activeCase) return;

  const text =
    `📁 **ДЕЛО: ${activeCase.title}**\n\n` +
    `Сложность: ${activeCase.difficulty}\n` +
    `Жертва: ${activeCase.victim.name}\n` +
    `Причина смерти: ${activeCase.victim.causeOfDeath}\n\n` +
    `Выберите действие:`;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainMenuKeyboard(activeCase.id),
  });
}

export async function handleNotebookCommand(ctx: Context) {
  if (!ctx.from) return;
  const user = await sessionManager.getOrCreateUser(ctx.from);
  const session = await sessionManager.getActiveSession(user.id);

  if (!session) {
    return ctx.reply('Нет активного расследования. Напишите /start.');
  }

  const activeCase = getCaseById(session.caseId);
  if (!activeCase) return;

  const discoveredClueIds = await sessionManager.getDiscoveredClues(session.id);
  const discoveredClues = activeCase.clues.filter((c) => discoveredClueIds.includes(c.id));

  let text = `📝 **БЛОКНОТ ДЕТЕКТИВА**\nДело: *${activeCase.title}*\n\n`;
  text += `🔍 **Найденные улики (${discoveredClues.length}/${activeCase.clues.length}):**\n`;

  if (discoveredClues.length === 0) {
    text += `_Вы пока не исследовали ни одной улики. Загляните в меню "Осмотреть улики"._\n`;
  } else {
    discoveredClues.forEach((c) => {
      text += `\n• **${c.name}**\n  ${c.description}`;
    });
  }

  text += `\n\n👥 **Подозреваемые:**\n`;
  activeCase.suspects.forEach((s) => {
    text += `• ${s.avatarEmoji} **${s.name}** — ${s.role}\n`;
  });

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainMenuKeyboard(activeCase.id),
  });
}

export async function handleCallbackQuery(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data || !ctx.from) return;
  await ctx.answerCallbackQuery();

  const user = await sessionManager.getOrCreateUser(ctx.from);
  const session = await sessionManager.getActiveSession(user.id);

  if (!session) {
    return ctx.reply('Сессия устарела. Отправьте /start для начала нового дела.');
  }

  const activeCase = getCaseById(session.caseId);
  if (!activeCase) return;

  // 1. Menu view
  if (data.startsWith('case_menu:')) {
    await sessionManager.setActiveSuspect(session.id, null);
    pendingAccusations.delete(BigInt(ctx.from.id));

    const text =
      `📁 **ДЕЛО: ${activeCase.title}**\n\n` +
      `Выберите раздел для продолжения расследования:`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard(activeCase.id),
    });
    return;
  }

  // 2. Case info / Crime scene
  if (data.startsWith('case_info:')) {
    const text =
      `🏛 **МАТЕРИАЛЫ ДЕЛА: ${activeCase.title}**\n\n` +
      `👤 **Жертва:** ${activeCase.victim.name}\n` +
      `📌 **Информация:** ${activeCase.victim.details}\n` +
      `☠️ **Причина смерти:** ${activeCase.victim.causeOfDeath}\n\n` +
      `🏢 **Место преступления:**\n${activeCase.crimeScene}\n\n` +
      `📜 **Сводка происшествия:**\n${activeCase.synopsis}`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard(activeCase.id),
    });
    return;
  }

  // 3. Clues list
  if (data.startsWith('clues_list:')) {
    const discoveredClues = await sessionManager.getDiscoveredClues(session.id);
    const text =
      `🔍 **МЕСТО ПРЕСТУПЛЕНИЯ И УЛИКИ**\n\n` +
      `Нажмите на любую улику, чтобы тщательно осмотреть её и занести в следственный блокнот:`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: getCluesListKeyboard(activeCase, discoveredClues),
    });
    return;
  }

  // 4. Clue inspection
  if (data.startsWith('clue_inspect:')) {
    const clueId = data.split(':')[1];
    const clue = activeCase.clues.find((c) => c.id === clueId);
    if (!clue) return;

    await sessionManager.discoverClue(session.id, clue.id);

    const text =
      `🔍 **ТЩАТЕЛЬНЫЙ ОСМОТР УЛИКИ**\n\n` +
      `🏷 **${clue.name}**\n` +
      `Категория: ${clue.category}\n\n` +
      `📋 **Описание:**\n${clue.description}\n\n` +
      `🔬 **Результаты экспертизы:**\n${clue.details}\n\n` +
      `✅ _Улика занесена в ваш следственный блокнот!_`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: getClueDetailKeyboard(activeCase.id, clue.id),
    });
    return;
  }

  // 5. Suspects list
  if (data.startsWith('suspects_list:')) {
    const text =
      `👥 **ПОДОЗРЕВАЕМЫЕ И СВИДЕТЕЛИ**\n\n` +
      `Выберите фигуранта для начала очного допроса.\n` +
      `Вы сможете задавать любые вопросы текстом в чат:`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: getSuspectsListKeyboard(activeCase),
    });
    return;
  }

  // 6. Select suspect for interrogation
  if (data.startsWith('suspect_select:')) {
    const suspectId = data.split(':')[1];
    const suspect = activeCase.suspects.find((s) => s.id === suspectId);
    if (!suspect) return;

    await sessionManager.setActiveSuspect(session.id, suspect.id);
    pendingAccusations.delete(BigInt(ctx.from.id));

    const text =
      `🎙 **КОМНАТА ДОПРОСА: ${suspect.avatarEmoji} ${suspect.name}**\n` +
      `*${suspect.role}*\n\n` +
      `Характер: ${suspect.personality}\n` +
      `Заявленное алиби: "${suspect.alibi}"\n\n` +
      `💬 **Задайте вопрос подозреваемому:** просто напишите сообщение сюда в чат.\n` +
      `Вы можете спрашивать об алиби, уликах, отношениях с жертвой или мотивах.`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: getInterrogationKeyboard(activeCase.id, suspect.id),
    });
    return;
  }

  // 7. Notebook view
  if (data.startsWith('notebook:')) {
    await handleNotebookCommand(ctx);
    return;
  }

  // 8. Accusation menu
  if (data.startsWith('accuse_menu:')) {
    const discoveredClues = await sessionManager.getDiscoveredClues(session.id);
    const minClues = activeCase.minCluesToAccuse || 2;

    if (discoveredClues.length < minClues) {
      await ctx.editMessageText(
        `⚠️ **Недостаточно улик для обвинения!**\n\n` +
          `Вы нашли всего ${discoveredClues.length} из необходимых минимум ${minClues} улик.\n` +
          `Осмотрите место преступления и опросите свидетелей перед выдвижением официального обвинения, чтобы не подставить невиновного.`,
        {
          parse_mode: 'Markdown',
          reply_markup: getMainMenuKeyboard(activeCase.id),
        }
      );
      return;
    }

    const text =
      `⚖️ **ВЫДВИЖЕНИЕ ОФИЦИАЛЬНОГО ОБВИНЕНИЯ**\n\n` +
      `Внимание! Это решающий шаг расследования.\n` +
      `Выберите главного подозреваемого, которого вы считаете истинным убийцей:`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: getAccusationSelectKeyboard(activeCase),
    });
    return;
  }

  // 9. Choose accusation target
  if (data.startsWith('accuse_target:')) {
    const suspectId = data.split(':')[1];
    const suspect = activeCase.suspects.find((s) => s.id === suspectId);
    if (!suspect) return;

    pendingAccusations.set(BigInt(ctx.from.id), suspect.id);
    await sessionManager.setActiveSuspect(session.id, null);

    const text =
      `⚖️ **ОБВИНЕНИЕ: ${suspect.avatarEmoji} ${suspect.name}**\n\n` +
      `Теперь напишите в чат развернутую версию обвинения:\n` +
      `1. Какой был мотив преступника?\n` +
      `2. Как было совершено убийство (способ и улики)?\n` +
      `3. Как вы опровергли его алиби?\n\n` +
      `✍️ _Отправьте ваше сообщение прямо в чат — верховный суд оценит вашу версию!_`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
    });
    return;
  }

  // 10. Restart case
  if (data.startsWith('restart_case:')) {
    const caseId = data.split(':')[1];
    await sessionManager.startNewSession(user.id, caseId);
    pendingAccusations.delete(BigInt(ctx.from.id));
    await handleStart(ctx);
    return;
  }
}

export async function handleTextMessage(ctx: Context) {
  if (!ctx.from || !ctx.message?.text) return;
  const userText = ctx.message.text.trim();
  const tgId = BigInt(ctx.from.id);

  const user = await sessionManager.getOrCreateUser(ctx.from);
  const session = await sessionManager.getActiveSession(user.id);

  if (!session) {
    return ctx.reply('Нет активного дела. Напишите /start, чтобы начать расследование.');
  }

  const activeCase = getCaseById(session.caseId);
  if (!activeCase) return;

  // CASE 1: Pending Accusation submission
  if (pendingAccusations.has(tgId)) {
    const accusedSuspectId = pendingAccusations.get(tgId)!;
    const accusedSuspect = activeCase.suspects.find((s) => s.id === accusedSuspectId);
    if (!accusedSuspect) return;

    pendingAccusations.delete(tgId);
    await ctx.reply('⏳ *Суд присяжных и детективная коллегия рассматривают ваше обвинение...*', {
      parse_mode: 'Markdown',
    });

    const discoveredClues = await sessionManager.getDiscoveredClues(session.id);
    const evaluation = await aiService.evaluateAccusation({
      detectiveCase: activeCase,
      accusedSuspect,
      userTheory: userText,
      discoveredClues,
    });

    await sessionManager.finalizeVerdict(session.id, {
      culpritId: accusedSuspect.id,
      accusationDetails: userText,
      score: evaluation.score,
      feedback: evaluation.feedback,
      isSolved: evaluation.isCorrectCulprit,
    });

    const resultMessage =
      `${evaluation.verdictTitle}\n\n` +
      `🎯 **Рейтинг раскрытия:** ${evaluation.score} / 100 баллов\n` +
      `👤 **Обвиняемый:** ${accusedSuspect.avatarEmoji} ${accusedSuspect.name}\n\n` +
      `📋 **Оценка следствия:**\n${evaluation.feedback}\n\n` +
      `📖 **Развязка:**\n${evaluation.closureStory}`;

    await ctx.reply(resultMessage, {
      parse_mode: 'Markdown',
      reply_markup: getFinishedCaseKeyboard(activeCase.id),
    });
    return;
  }

  // CASE 2: Active Interrogation
  if (session.activeSuspectId) {
    const suspect = activeCase.suspects.find((s) => s.id === session.activeSuspectId);
    if (suspect) {
      await ctx.replyWithChatAction('typing');

      // Save detective's message
      await sessionManager.addDialogueMessage(session.id, suspect.id, 'user', userText);

      // Fetch dialogue history
      const history = await sessionManager.getDialogueHistory(session.id, suspect.id);
      const discoveredClues = await sessionManager.getDiscoveredClues(session.id);

      // Generate response from suspect persona
      const reply = await aiService.interrogateSuspect({
        detectiveCase: activeCase,
        suspect,
        discoveredClues,
        history,
        question: userText,
      });

      // Save suspect's response
      await sessionManager.addDialogueMessage(session.id, suspect.id, 'assistant', reply);

      await ctx.reply(`${suspect.avatarEmoji} **${suspect.name}:**\n\n${reply}`, {
        parse_mode: 'Markdown',
        reply_markup: getInterrogationKeyboard(activeCase.id, suspect.id),
      });
      return;
    }
  }

  // DEFAULT: User sent general message without active mode
  await ctx.reply(
    `Детектив, сейчас вы находитесь в главном меню расследования дела *"${activeCase.title}"*.\n` +
      `Чтобы допросить свидетеля или изучить улики, используйте кнопки ниже:`,
    {
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard(activeCase.id),
    }
  );
}

import { InlineKeyboard } from 'grammy';
import { DetectiveCase } from '../cases/types.js';

export function getMainMenuKeyboard(caseId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('📂 Материалы дела', `case_info:${caseId}`)
    .row()
    .text('🔍 Осмотреть улики', `clues_list:${caseId}`)
    .text('👥 Допрос подозреваемых', `suspects_list:${caseId}`)
    .row()
    .text('📝 Блокнот детектива', `notebook:${caseId}`)
    .row()
    .text('⚖️ ВЫДВИНУТЬ ОБВИНЕНИЕ', `accuse_menu:${caseId}`);
}

export function getCluesListKeyboard(
  detectiveCase: DetectiveCase,
  discoveredClues: string[]
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  detectiveCase.clues.forEach((clue) => {
    const isDiscovered = discoveredClues.includes(clue.id);
    const prefix = isDiscovered ? '✅' : '❓';
    keyboard.text(`${prefix} ${clue.name}`, `clue_inspect:${clue.id}`).row();
  });

  keyboard.text('⬅️ Назад в меню дела', `case_menu:${detectiveCase.id}`);
  return keyboard;
}

export function getClueDetailKeyboard(caseId: string, clueId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔍 Другие улики', `clues_list:${caseId}`)
    .row()
    .text('📂 Меню дела', `case_menu:${caseId}`);
}

export function getSuspectsListKeyboard(detectiveCase: DetectiveCase): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  detectiveCase.suspects.forEach((suspect) => {
    keyboard.text(`${suspect.avatarEmoji} ${suspect.name} (${suspect.role})`, `suspect_select:${suspect.id}`).row();
  });

  keyboard.text('⬅️ Назад в меню дела', `case_menu:${detectiveCase.id}`);
  return keyboard;
}

export function getInterrogationKeyboard(caseId: string, suspectId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('💡 Список других подозреваемых', `suspects_list:${caseId}`)
    .row()
    .text('🚪 Завершить допрос и вернуться в меню', `case_menu:${caseId}`);
}

export function getAccusationSelectKeyboard(detectiveCase: DetectiveCase): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  detectiveCase.suspects.forEach((suspect) => {
    keyboard.text(`👉 Обвинить: ${suspect.name}`, `accuse_target:${suspect.id}`).row();
  });

  keyboard.text('⬅️ Отмена / Еще подумать', `case_menu:${detectiveCase.id}`);
  return keyboard;
}

export function getFinishedCaseKeyboard(caseId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔄 Начать расследование заново', `restart_case:${caseId}`)
    .row()
    .text('📚 Список дел', 'all_cases');
}

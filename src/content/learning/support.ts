import type { SupportLanguage } from '../../learning/types';
import type { SupportTexts } from '../../learning/content';

/**
 * Explanation templates in each support language (LEARNING_SYSTEM §4). These explain the TARGET language,
 * so they are learning content, not UI strings. {placeholders} are filled by the lesson engine.
 */
export const SUPPORT_TEXTS: Record<SupportLanguage, SupportTexts> = {
  en: {
    promptMeaning: 'What does this mean?',
    promptTarget: 'How do you say “{meaning}”?',
    promptReply: '{name} says this to you. What is a good reply?',
    wrongMeaning: '“{target}” means “{right}”, not “{chosen}”.',
    wrongTarget: '“{chosen}” means “{chosenMeaning}”. We are looking for “{meaning}”.',
    wrongReply: '“{chosen}” means “{chosenMeaning}”. That does not really answer “{line}”.',
    reveal: 'The answer is “{answer}”: “{meaning}”. Pick it to continue.',
    complete: 'You learned {n} new phrases!',
    reviewIntro: 'Quick review! These phrases are ready to practice again.',
    practiceIntro: 'Practice Corner: free practice. Finish a round to restore {n} energy.',
    outOfEnergy: 'Out of energy, so this is practice mode: answers still count, and nothing is lost.',
  },
  'zh-TW': {
    promptMeaning: '這句是什麼意思？',
    promptTarget: '「{meaning}」要怎麼說？',
    promptReply: '{name} 對你這樣說，怎麼回答比較好？',
    wrongMeaning: '「{target}」的意思是「{right}」，不是「{chosen}」。',
    wrongTarget: '「{chosen}」的意思是「{chosenMeaning}」，這題要找的是「{meaning}」。',
    wrongReply: '「{chosen}」的意思是「{chosenMeaning}」，不太適合回答「{line}」。',
    reveal: '答案是「{answer}」，意思是「{meaning}」。選它就可以繼續。',
    complete: '你學會了 {n} 句新的話！',
    reviewIntro: '快速複習！這些句子可以再練習一次了。',
    practiceIntro: 'Practice Corner：免費練習。完成一輪可以恢復 {n} 點體力。',
    outOfEnergy: '體力用完了，現在是練習模式：答題一樣會算進度，也不會失去任何東西。',
  },
};

export { fill } from '../../learning/content';

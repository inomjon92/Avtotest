import type { Topic } from './types';

export const TOPICS: Topic[] = [
  { id: 'umumiy', name: 'Umumiy qoidalar va atamalar', icon: '📘' },
  { id: 'belgilar', name: "Yo'l belgilari", icon: '⚠️' },
  { id: 'chiziqlar', name: "Yo'l chiziqlari", icon: '〰️' },
  { id: 'svetofor', name: 'Svetofor va tartibga soluvchi', icon: '🚦' },
  { id: 'chorraha', name: "Chorrahalardan o'tish", icon: '✚' },
  { id: 'manevr', name: 'Harakatni boshlash va manevrlar', icon: '↪️' },
  { id: 'tezlik', name: 'Harakat tezligi va masofa', icon: '⏱️' },
  { id: 'quvib', name: "Quvib o'tish", icon: '⏩' },
  { id: 'toxtash', name: "To'xtash va to'xtab turish", icon: '🅿️' },
  { id: 'piyoda', name: "Piyodalar va bekatlar", icon: '🚶' },
  { id: 'temiryol', name: "Temir yo'l kesishmalari", icon: '🚆' },
  { id: 'chiroqlar', name: 'Chiroqlar va signallar', icon: '💡' },
  { id: 'xavfsizlik', name: "Xavfsizlik va texnik holat", icon: '🛡️' },
  { id: 'yordam', name: 'Birinchi tibbiy yordam', icon: '⛑️' },
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);

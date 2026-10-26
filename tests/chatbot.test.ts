import { describe, expect, it } from 'vitest';
import { DEFAULT_FAQ, reply } from '../src/lib/chatbot';

const ctx = { faq: DEFAULT_FAQ, exam: { questionCount: 20, minutes: 25, maxErrors: 2 }, bhm: 412000, progressText: () => 'TAVSIYA' };

describe('chat-bot', () => {
  it('salomlashadi', () => expect(reply('Assalomu alaykum', ctx).text).toMatch(/xursandman/));
  it('belgi kodini tushuntiradi', () => expect(reply('2.4 belgisi nima?', ctx).text).toMatch(/^2\.4/));
  it('imtihon formatini aytadi', () => expect(reply('imtihonda nechta savol', ctx).text).toMatch(/20 ta savol, 25 daqiqa/));
  it('jarimani topadi', () => expect(reply('kamar uchun jarima qancha', ctx).text).toMatch(/kamar/i));
  it('shaxsiy tavsiya beradi', () => expect(reply('qayerda ortdaman?', ctx).text).toBe('TAVSIYA'));
  it('bilmasa adminga yuborishni taklif qiladi', () => expect(reply('xyz qwerty', ctx).unknown).toBe(true));
});

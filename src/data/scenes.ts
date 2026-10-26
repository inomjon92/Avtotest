import type { SceneSpec } from './types';

// Savollarga biriktirilgan vaziyat chizmalari (savol id -> chizma).
const you = (turn: 'straight' | 'left' | 'right' | 'uturn' | 'stop' = 'straight') => ({ from: 's' as const, you: true, turn });

export const SCENES: Record<string, SceneSpec> = {
  q12: { kind: 'straight', zebra: ['s'], peds: ['s'], signs: [{ at: 's', id: '5.16' }], cars: [{ ...you(), pos: 235 }] },
  q22: { kind: 'cross', light: { at: 's', color: 'flash' }, cars: [you()] },
  q27: { kind: 'cross', light: { at: 's', color: 'red', arrow: 'right' }, cars: [you('right'), { from: 'w', turn: 'straight', label: 'A' }] },
  q28: { kind: 'cross', cars: [you(), { from: 'e', turn: 'straight', label: 'A' }] },
  q29: { kind: 'cross', light: { at: 's', color: 'green' }, cars: [you('left'), { from: 'n', turn: 'straight', label: 'A' }] },
  q30: { kind: 'cross', rails: 'ew', cars: [you(), { from: 'w', turn: 'straight', kind: 'tram', label: 'T' }] },
  q31: { kind: 'cross', light: { at: 's', color: 'green' }, zebra: ['e'], peds: ['e'], cars: [you('right')] },
  q32: { kind: 'cross', light: { at: 's', color: 'green' }, cars: [you(), { from: 's', turn: 'stop', pos: -75, label: 'A' }, { from: 's', turn: 'stop', pos: -120, label: 'B' }] },
  q80: { kind: 'cross', light: { at: 's', color: 'green' }, signs: [{ at: 's', id: '2.4' }], cars: [you(), { from: 'e', turn: 'straight', label: 'A' }] },
  q92: { kind: 'cross', light: { at: 's', color: 'redyellow' }, cars: [you()] },
  q94: { kind: 'cross', regulator: { pose: 'side', facing: 'w' }, cars: [you()] },
  q95: { kind: 'cross', regulator: { pose: 'side', facing: 's' }, cars: [you()] },
  q96: { kind: 'cross', regulator: { pose: 'forward', facing: 'n' }, cars: [you()] },
  q97: { kind: 'cross', light: { at: 's', color: 'green' }, regulator: { pose: 'up', facing: 's' }, cars: [you()] },
  q99: { kind: 'cross', light: { at: 's', color: 'green' }, zebra: ['n'], peds: ['n'], cars: [you()] },
  q100: { kind: 'cross', signs: [{ at: 's', id: '2.4' }, { at: 'e', id: '2.1' }, { at: 'w', id: '2.1' }], cars: [you('left'), { from: 'e', turn: 'straight', label: 'A' }, { from: 'w', turn: 'straight', label: 'B' }] },
  q102: { kind: 'cross', dirt: ['e'], cars: [you(), { from: 'e', turn: 'straight', label: 'A' }] },
  q103: { kind: 'cross', cars: [you(), { from: 'n', turn: 'left', label: 'A' }] },
  q116: { kind: 'straight', cars: [{ from: 's', turn: 'left', label: 'A', pos: 130 }, { ...you('stop'), pos: 235 }] },
  q128: { kind: 'straight', lanes: 2, marking: 'double', zebra: ['s'], peds: ['s'], cars: [{ from: 's', lane: 0, turn: 'stop', label: 'A', pos: 190 }, { from: 's', lane: 1, you: true, turn: 'straight', pos: 245 }] },
  q51: { kind: 'rail', barrier: 'closed', cars: [{ ...you(), pos: 240 }] },
  q132: { kind: 'rail', signs: [{ at: 's', id: '1.2' }], cars: [{ ...you('stop'), pos: 240 }] },
  q133: { kind: 'rail', barrier: 'closed', cars: [{ ...you(), pos: 240 }] },
  q134: { kind: 'rail', cars: [{ ...you(), pos: 240 }, { from: 's', turn: 'stop', label: 'A', pos: 80 }, { from: 's', turn: 'stop', label: 'B', pos: 35 }] },
  q151: { kind: 'cross', cars: [{ from: 's', turn: 'straight', label: 'A' }, { from: 'w', turn: 'straight', label: 'B' }] },
  q152: { kind: 'cross', cars: [{ from: 's', turn: 'left', label: 'A' }, { from: 'n', turn: 'straight', label: 'B' }] },
  q153: { kind: 'tee', cars: [you('left'), { from: 'e', turn: 'straight', label: 'A' }] },
  q154: { kind: 'cross', signs: [{ at: 's', id: '2.4' }, { at: 'w', id: '2.1' }, { at: 'e', id: '2.1' }], cars: [{ from: 's', turn: 'straight', label: 'A' }, { from: 'w', turn: 'right', label: 'B' }] },
  q155: { kind: 'cross', rails: 'ns', cars: [you(), { from: 'n', turn: 'left', kind: 'tram', label: 'T' }] },
  q156: { kind: 'cross', light: { at: 's', color: 'green' }, cars: [you('right'), { from: 'n', turn: 'left', label: 'A' }] },
  q157: { kind: 'cross', dirt: ['s'], cars: [you(), { from: 'w', turn: 'straight', label: 'A' }] },
};

// Ikki qurilmadagi progressni birlashtirish: hech bir tomondagi natija yo'qolmaydi.
import type { AppState, Attempt } from '../store/store';
import type { QStat } from './srs';

type Progress = Pick<AppState, 'settings' | 'stats' | 'favorites' | 'attempts' | 'marathon' | 'activity' | 'rulesRead' | 'updatedAt'>;


function mergeStat(a?: QStat, b?: QStat): QStat | undefined {
  if (!a) return b;
  if (!b) return a;
  // Oxirgi javob berilgan holat ustun (Leitner qutisi, ketma-ketlik); hisoblagichlar kattasi olinadi
  const newer = (a.last ?? 0) >= (b.last ?? 0) ? a : b;
  return { ...newer, correct: Math.max(a.correct, b.correct), wrong: Math.max(a.wrong, b.wrong) };
}

export function mergeProgress(local: Progress, remote: Partial<Progress>): Progress {
  const stats: Record<string, QStat> = { ...local.stats };
  for (const [id, st] of Object.entries(remote.stats ?? {})) stats[id] = mergeStat(stats[id], st)!;

  const attempts = new Map<string, Attempt>();
  for (const a of [...(remote.attempts ?? []), ...local.attempts]) attempts.set(a.id, a);

  const activity = { ...local.activity };
  for (const [d, n] of Object.entries(remote.activity ?? {})) activity[d] = Math.max(activity[d] ?? 0, n);

  const rulesRead = { ...local.rulesRead };
  for (const [id, t] of Object.entries(remote.rulesRead ?? {})) rulesRead[id] = Math.min(rulesRead[id] ?? t, t);

  const remoteNewer = (remote.updatedAt ?? 0) > local.updatedAt;
  const rm = remote.marathon;
  return {
    settings: remoteNewer && remote.settings ? { ...local.settings, ...remote.settings } : local.settings,
    stats,
    favorites: remoteNewer ? [...new Set([...(remote.favorites ?? []), ...local.favorites])] : [...new Set([...local.favorites, ...(remote.favorites ?? [])])],
    attempts: [...attempts.values()].sort((a, b) => a.finishedAt - b.finishedAt).slice(-200),
    marathon: rm && Object.keys(rm.answers ?? {}).length > Object.keys(local.marathon.answers).length ? rm : local.marathon,
    activity,
    rulesRead,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt ?? 0),
  };
}

/** Birlashtirish natijasi mahalliy holatdan farq qiladimi (serverga yuborish kerakmi) */
export function differs(a: Partial<Progress>, b: Partial<Progress>) {
  return JSON.stringify([a.stats, a.attempts?.length, a.favorites, a.activity, a.rulesRead, a.marathon]) !==
    JSON.stringify([b.stats, b.attempts?.length, b.favorites, b.activity, b.rulesRead, b.marathon]);
}


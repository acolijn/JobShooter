export interface Score {
  name: string;
  score: number;
  wave: number;
  coins: number;
  date: number;
}

const STORAGE_KEY = 'jobshooter_scores_v1';
const NAME_KEY = 'jobshooter_lastname';
const API_URL: string =
  ((import.meta as unknown as { env?: { VITE_SCORES_API?: string } }).env?.VITE_SCORES_API ?? '').trim();

export function getLastName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setLastName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

function readLocal(): Score[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Score[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: Score[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export async function loadScores(limit = 10): Promise<Score[]> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/scores?limit=${limit}`);
      if (res.ok) {
        const remote = (await res.json()) as Score[];
        return remote.slice(0, limit);
      }
    } catch {
      /* fall through to local */
    }
  }
  const all = readLocal().sort((a, b) => b.score - a.score);
  return all.slice(0, limit);
}

export async function saveScore(s: Score, limit = 20): Promise<Score[]> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/scores`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (res.ok) {
        return (await res.json()) as Score[];
      }
    } catch {
      /* fall through to local */
    }
  }
  const all = readLocal();
  all.push(s);
  all.sort((a, b) => b.score - a.score);
  const top = all.slice(0, limit);
  writeLocal(top);
  return top;
}

export function computeScore(wavesCleared: number, coinsEarned: number): number {
  return wavesCleared * 100 + coinsEarned;
}

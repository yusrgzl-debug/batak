import { Mode, Settings, TrumpRule, playerCount } from '../engine/game';
import {
  ECONOMY,
  Wallet,
  prizeError,
  adsLeft,
  canAfford,
  claimDaily,
  entryFee,
  leavePenalty,
  newWallet,
  payEntry,
  rewardAd,
} from '../engine/economy';
import { User } from './auth';

/**
 * Online layer: wallet, rooms (Oda Kur / Oda Bul), leaderboard and friends.
 *
 * `OnlineService` is the contract a real backend implements (rooms and balances must be
 * server-authoritative). `LocalOnline` below is the demo implementation: it keeps the
 * player's wallet and friends on the device and simulates other players, so every screen
 * can be tried before the server exists.
 */

export interface PlayerProfile {
  id: string;
  name: string;
  points: number;
  games: number;
  wins: number;
  premium: boolean;
  photoUrl?: string | null;
  /** true for the computer player that takes over an empty or abandoned seat */
  bot?: boolean;
}

export interface RoomOptions {
  mode: Mode;
  rounds: number;
  trumpRule: TrumpRule;
  chat: boolean;
  prize: number;
}

export interface Room extends RoomOptions {
  id: string;
  entry: number;
  host: PlayerProfile;
  seats: (PlayerProfile | null)[];
}

export type FriendStatus = 'none' | 'pending' | 'friend';

export interface OnlineService {
  wallet(): Wallet;
  claimDaily(): Wallet;
  /** Credits the rewarded-ad bonus (call after the ad reports a reward). */
  creditAdReward(): Wallet;
  listRooms(): Promise<Room[]>;
  createRoom(opts: RoomOptions): Promise<Room>;
  joinRoom(id: string, listed?: Room): Promise<Room>;
  /** Fires as other players take the free seats; resolves when the room is full. */
  waitForPlayers(room: Room, onUpdate: (r: Room) => void): () => void;
  /** Pay the entry fee when the game starts. */
  startGame(room: Room): Wallet;
  finishGame(prizeWon: number, won: boolean): Wallet;
  leaveGame(): Wallet;
  leaderboard(scope: 'genel' | 'arkadaslar'): Promise<{ rank: number; player: PlayerProfile }[]>;
  friendStatus(id: string): FriendStatus;
  addFriend(id: string, onChange: () => void): void;
  friends(): PlayerProfile[];
  profile(id: string): PlayerProfile | undefined;
}

/* ---------------- demo implementation ---------------- */

const FIRST = ['Ahmet', 'Elif', 'Mehmet', 'Zeynep', 'Can', 'Ayşe', 'Emre', 'Deniz', 'Burak', 'Selin', 'Murat', 'Ece', 'Kerem', 'Derya', 'Oğuz', 'Merve', 'Hakan', 'Gizem', 'Serkan', 'Büşra', 'Volkan', 'Esra', 'Tolga', 'Pınar', 'Cem', 'Nur', 'Barış', 'İrem', 'Onur', 'Sevgi'];
const LAST = ['K.', 'Y.', 'D.', 'Ş.', 'A.', 'T.', 'Ö.', 'B.', 'Ç.', 'E.'];

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable population of simulated players. */
const PLAYERS: PlayerProfile[] = (() => {
  const r = rng(7);
  return Array.from({ length: 80 }, (_, i) => {
    const games = 20 + Math.floor(r() * 2400);
    return {
      id: `p${i}`,
      name: `${FIRST[i % FIRST.length]} ${LAST[Math.floor(r() * LAST.length)]}`,
      points: Math.round(1500 + Math.pow(r(), 3) * 900000),
      games,
      wins: Math.floor(games * (0.18 + r() * 0.2)),
      premium: r() < 0.18,
    };
  });
})();

const byId = new Map(PLAYERS.map((p) => [p.id, p]));
const pick = <T,>(xs: T[], r: () => number) => xs[Math.floor(r() * xs.length)];

interface Saved {
  wallet: Wallet;
  friends: Record<string, FriendStatus>;
  games: number;
  wins: number;
}

export class LocalOnline implements OnlineService {
  private data: Saved;
  private key: string;
  private roomSeq = 0;

  constructor(private user: User, private premium: () => boolean) {
    this.key = `batak.online.${user.uid}`;
    this.data = this.load();
  }

  private load(): Saved {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return JSON.parse(raw) as Saved;
    } catch {
      /* ignore */
    }
    return { wallet: newWallet(), friends: {}, games: 0, wins: 0 };
  }

  private save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch {
      /* ignore */
    }
  }

  private setWallet(w: Wallet) {
    this.data.wallet = w;
    this.save();
    return w;
  }

  me(): PlayerProfile {
    return {
      id: 'me',
      name: this.user.name,
      points: this.data.wallet.points,
      games: this.data.games,
      wins: this.data.wins,
      premium: this.premium(),
      photoUrl: this.user.photoUrl,
    };
  }

  wallet() {
    return this.data.wallet;
  }
  claimDaily() {
    return this.setWallet(claimDaily(this.data.wallet));
  }
  creditAdReward() {
    return this.setWallet(rewardAd(this.data.wallet));
  }
  adsLeft() {
    return adsLeft(this.data.wallet);
  }

  /** Players whose balance fits a table: richer tables attract richer players. */
  private candidates(entry: number) {
    return PLAYERS.filter((p) => p.points >= entry * 3);
  }

  private makeRoom(opts: RoomOptions, r: () => number, host?: PlayerProfile): Room {
    const entry = entryFee(opts.mode, opts.prize);
    const pool = this.candidates(entry);
    const h = host ?? pick(pool.length ? pool : PLAYERS, r);
    const n = playerCount(opts.mode);
    const seats: (PlayerProfile | null)[] = [h, ...Array(n - 1).fill(null)];
    const filled = Math.floor(r() * (n - 1));
    for (let i = 1; i <= filled; i++) {
      let p = pick(pool.length ? pool : PLAYERS, r);
      while (seats.includes(p)) p = pick(PLAYERS, r);
      seats[i] = p;
    }
    return { ...opts, id: `r${++this.roomSeq}`, entry, host: h, seats };
  }

  async listRooms(): Promise<Room[]> {
    await delay(350);
    const r = rng(Date.now() / 20000); // the list changes a little every 20 s
    const modes: Mode[] = ['ihaleli', 'ihaleli', 'esli', 'gommeli', 'kozMaca'];
    return Array.from({ length: 10 }, () =>
      this.makeRoom(
        {
          mode: pick(modes, r),
          rounds: pick([5, 7, 7, 9, 11], r),
          trumpRule: r() < 0.8 ? 'zorunlu' : 'serbest',
          chat: r() < 0.85,
          prize: pick([...ECONOMY.PRIZES], r),
        },
        r,
      ),
    ).sort((a, b) => a.prize - b.prize);
  }

  private rooms = new Map<string, Room>();

  async createRoom(opts: RoomOptions): Promise<Room> {
    const bad = prizeError(opts.prize);
    if (bad) throw new Error(bad);
    const entry = entryFee(opts.mode, opts.prize);
    if (!canAfford(this.data.wallet, entry)) throw new Error(`Bu masa için en az ${entry} Pt gerekiyor`);
    await delay(250);
    const n = playerCount(opts.mode);
    const room: Room = { ...opts, id: `r${++this.roomSeq}`, entry, host: this.me(), seats: [this.me(), ...Array(n - 1).fill(null)] };
    this.rooms.set(room.id, room);
    return room;
  }

  async joinRoom(id: string, listed?: Room): Promise<Room> {
    const room = this.rooms.get(id) ?? listed;
    if (!room) throw new Error('Masa bulunamadı');
    if (!canAfford(this.data.wallet, room.entry)) throw new Error(`Bu masa için en az ${room.entry} Pt gerekiyor`);
    await delay(250);
    const seats = room.seats.slice();
    const free = seats.indexOf(null);
    if (free < 0) throw new Error('Masa dolu');
    seats[free] = this.me();
    const joined = { ...room, seats };
    this.rooms.set(id, joined);
    return joined;
  }

  waitForPlayers(room: Room, onUpdate: (r: Room) => void) {
    const r = rng(Date.now());
    let current = room;
    const timers: number[] = [];
    const step = () => {
      const free = current.seats.indexOf(null);
      if (free < 0) return;
      const pool = this.candidates(room.entry).filter((p) => !current.seats.some((s) => s?.id === p.id));
      const seats = current.seats.slice();
      seats[free] = pick(pool.length ? pool : PLAYERS, r);
      current = { ...current, seats };
      onUpdate(current);
      timers.push(window.setTimeout(step, 700 + r() * 1300));
    };
    timers.push(window.setTimeout(step, 900));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }

  startGame(room: Room) {
    return this.setWallet(payEntry(this.data.wallet, room.entry));
  }

  finishGame(prizeWon: number, won: boolean) {
    this.data.games++;
    if (won) this.data.wins++;
    return this.setWallet({ ...this.data.wallet, points: this.data.wallet.points + prizeWon });
  }

  /** Demo only (DEMO_TOOLS): top up the local wallet for testing. */
  addTestPoints(amount: number) {
    return this.setWallet({ ...this.data.wallet, points: this.data.wallet.points + amount });
  }

  leaveGame() {
    this.data.games++;
    return this.setWallet(leavePenalty(this.data.wallet));
  }

  async leaderboard(scope: 'genel' | 'arkadaslar') {
    await delay(250);
    const me = this.me();
    const pool = scope === 'genel' ? PLAYERS : this.friends();
    return [...pool, me]
      .sort((a, b) => b.points - a.points)
      .map((player, i) => ({ rank: i + 1, player }))
      .filter((row, i) => scope === 'arkadaslar' || i < 50 || row.player.id === 'me');
  }

  friendStatus(id: string): FriendStatus {
    return this.data.friends[id] ?? 'none';
  }

  /** Sends a friend request; simulated players accept a moment later. */
  addFriend(id: string, onChange: () => void) {
    if (this.friendStatus(id) !== 'none' || !byId.has(id)) return;
    this.data.friends[id] = 'pending';
    this.save();
    onChange();
    window.setTimeout(() => {
      this.data.friends[id] = 'friend';
      this.save();
      onChange();
    }, 2500);
  }

  friends() {
    return Object.entries(this.data.friends)
      .filter(([, s]) => s === 'friend')
      .map(([id]) => byId.get(id))
      .filter((p): p is PlayerProfile => !!p);
  }

  profile(id: string) {
    return id === 'me' ? this.me() : byId.get(id);
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Game settings for a room. */
export const roomSettings = (room: RoomOptions): Settings => ({
  mode: room.mode,
  rounds: room.rounds,
  trumpRule: room.trumpRule,
  chat: room.chat,
  minBid: 5,
});

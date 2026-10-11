export interface ChatMsg {
  id: number;
  player: number;
  text: string;
  at: number;
}

export const QUICK_MESSAGES = [
  'Selam 👋',
  'İyi oyunlar',
  'Bravo! 👏',
  'Çok iyi oynadın',
  'Hadi ama! 😄',
  'Şanslıydın 🍀',
  'Bu el benim 😎',
  'Acele edelim lütfen',
  'Kusura bakma 😅',
  'Teşekkürler 🙏',
  'Rövanş?',
  'Görüşürüz 👋',
];

export const EMOJIS = ['😀', '😂', '😎', '😉', '🤔', '😢', '😡', '👏', '👍', '🔥', '🙏', '🍀'];

export const MAX_MESSAGE = 60;
export const BUBBLE_MS = 4000;

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** What a bot might answer to a player's message (null = stays quiet). */
export function botReplyTo(text: string): string | null {
  const t = text.toLocaleLowerCase('tr');
  if (/selam|merhaba|sa\b|slm/.test(t)) return pick(['Selam 👋', 'Merhaba!', 'Aleyküm selam 😊']);
  if (/iyi oyun/.test(t)) return pick(['Sana da 🍀', 'İyi oyunlar!']);
  if (/teşekkür|sağ ol/.test(t)) return pick(['Rica ederim 😊', '🙏']);
  if (/rövanş/.test(t)) return pick(['Olur! 😎', 'Hazırım']);
  if (/bravo|tebrik|iyi oynadın/.test(t)) return pick(['Teşekkürler 🙏', '😎']);
  return Math.random() < 0.3 ? pick(['😄', '👍', 'Haha', 'Aynen', '🤔']) : null;
}

export const botOnBidFailed = () => pick(['Battın 😅', 'Olur böyle', 'Bu sefer olmadı 😄', '🍀']);
export const botOnBidMade = () => pick(['Bravo! 👏', 'Helal olsun', 'İyi tuttu 😎']);
export const botOnGameEnd = () => pick(['İyi oyundu 👏', 'Rövanş? 😄', 'Görüşürüz 👋']);

import codewarsImg from '@/assets/CodeWars-2.png';
import clashOfCodersImg from '@/assets/clash-of-coders.jpeg';
import openaiHackathonImg from '@/assets/openai-hackathon.jpeg.jpeg';
import kestraImg from '@/assets/Event_Orchestration.png';
import hackvisionImg from '@/assets/Hackvision.jpeg';
import hackstormImg from '@/assets/Hackstorm.jpeg';
import wchlImg from '@/assets/WCHL.jpeg';

/**
 * Maps event IDs and slugs to their statically-imported banner images.
 * Using Next.js static imports guarantees the images are always
 * bundled and available across client and SSR.
 */
export const EVENT_IMAGE_MAP: Record<string, any> = {
  codewars: codewarsImg,
  'codewars-hackathon': codewarsImg,
  'codewars-2': codewarsImg,

  'clash-of-coders': clashOfCodersImg,
  'clash-of-coders-2026': clashOfCodersImg,

  'chatgpt-codex': openaiHackathonImg,
  'openai-hackathon': openaiHackathonImg,
  'chatgpt-codex-hackathon': openaiHackathonImg,
  'openai-codex': openaiHackathonImg,

  'kestra-orchestration': kestraImg,
  'kestra-orchestration-challenge': kestraImg,
  'event-orchestration': kestraImg,

  hackvision: hackvisionImg,
  'hackvision-2026': hackvisionImg,

  hackstorm: hackstormImg,
  'hackstorm-2025': hackstormImg,
  'hackstorm-code-the-storm': hackstormImg,

  wchl: wchlImg,
  'wchl-2025': wchlImg,
  'world-coding-hackathon-league': wchlImg,
};

/**
 * Helper to safely extract image url/src for an event.
 * Falls back to mapped static images if event.image is missing or broken.
 */
export function getEventImageSrc(event?: {
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  image?: string | null;
  bannerUrl?: string | null;
} | null): string | null {
  if (!event) return null;

  // 1. Direct valid http/https/data URLs
  if (event.image && (event.image.startsWith('http://') || event.image.startsWith('https://') || event.image.startsWith('data:'))) {
    return event.image;
  }
  if (event.bannerUrl && (event.bannerUrl.startsWith('http://') || event.bannerUrl.startsWith('https://') || event.bannerUrl.startsWith('data:'))) {
    return event.bannerUrl;
  }

  // 2. Lookup by id or slug
  const idKey = (event.id || '').toLowerCase().trim();
  if (idKey && EVENT_IMAGE_MAP[idKey]) {
    const img = EVENT_IMAGE_MAP[idKey];
    return typeof img === 'string' ? img : img.src;
  }

  const slugKey = (event.slug || '').toLowerCase().trim();
  if (slugKey && EVENT_IMAGE_MAP[slugKey]) {
    const img = EVENT_IMAGE_MAP[slugKey];
    return typeof img === 'string' ? img : img.src;
  }

  // 3. Fallback matching by title keywords
  const title = (event.title || event.name || '').toLowerCase();
  if (title.includes('codewar')) return codewarsImg.src;
  if (title.includes('clash') || (title.includes('coder') && !title.includes('codex'))) return clashOfCodersImg.src;
  if (title.includes('openai') || title.includes('chatgpt') || title.includes('codex')) return openaiHackathonImg.src;
  if (title.includes('kestra') || title.includes('orchestration')) return kestraImg.src;
  if (title.includes('hackvision') || title.includes('vision')) return hackvisionImg.src;
  if (title.includes('hackstorm') || title.includes('storm')) return hackstormImg.src;
  if (title.includes('wchl') || title.includes('league')) return wchlImg.src;

  // 4. Return event.image or bannerUrl if available
  if (event.image && event.image.trim()) return event.image;
  if (event.bannerUrl && event.bannerUrl.trim()) return event.bannerUrl;

  return null;
}


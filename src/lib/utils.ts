import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)
  return initials.toUpperCase()
}

// Cycles through a few accent pairs by id so a grid of avatars doesn't read
// as a wall of identical circles — purely decorative, no meaning attached
// to who gets which color.
const AVATAR_STYLES = ["bg-rose/15 text-rose", "bg-gold/15 text-gold", "bg-rose/10 text-rose-strong"]

export function avatarStyle(id: string) {
  const sum = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_STYLES[sum % AVATAR_STYLES.length]
}

export function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return "agora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `há ${months} ${months === 1 ? "mês" : "meses"}`
  const years = Math.floor(months / 12)
  return `há ${years} ${years === 1 ? "ano" : "anos"}`
}

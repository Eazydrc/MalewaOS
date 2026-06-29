// Icônes ligne — remplace les emojis utilisés comme icônes fonctionnelles
// pour un rendu cohérent et premium plutôt que des glyphes emoji bruts.
// Style : stroke 1.8, coins arrondis, 24x24 viewBox, taille par défaut 18px.

import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function base(size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

export function PackageIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>;
}

export function BikeIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-9h3l2 5h4M9 8h3"/></svg>;
}

export function BellIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M6 9a6 6 0 0 1 12 0c0 3 1 5 2 6H4c1-1 2-3 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>;
}

export function CheckCircleIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9"/><polyline points="8.5 12.5 11 15 16 9"/></svg>;
}

export function XCircleIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>;
}

export function ShoppingBagIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}

export function PinIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
}

export function LockIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
}

export function ClockAlertIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>;
}

export function ChefHatIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M6 13a4 4 0 1 1 1.2-7.8A4.5 4.5 0 0 1 12 3a4.5 4.5 0 0 1 4.8 2.2A4 4 0 1 1 18 13H6Z"/><path d="M6 13v6h12v-6"/></svg>;
}

export function FlameIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M12 22c4-1 6-4 6-8 0-2-1-3-2-4 0 2-1 3-2 2 1-3-1-6-4-8 1 3-1 5-2 7-1 1.5-2 3-2 5 0 4 2 5 6 6Z"/></svg>;
}

export function BoltIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"/></svg>;
}

export function TagIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M20.6 12.6 12 4H4v8l8.6 8.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8Z"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/></svg>;
}

export function StoreIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M9 20v-6h6v6"/></svg>;
}

export function TableIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M3 9h18M5 9v10M19 9v10M3 9l1-4h16l1 4"/></svg>;
}

export function PaletteIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-1 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4-4-7.5-9-7.5Z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none"/><circle cx="11" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8" r="1" fill="currentColor" stroke="none"/></svg>;
}

export function StarFilledIcon({ size = 18, ...p }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}

export function ReceiptIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><path d="M6 2h12v20l-2-1.3L14 22l-2-1.3L10 22l-2-1.3L6 22V2Z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>;
}

export function GiftIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><rect x="3" y="8" width="18" height="13" rx="1.5"/><path d="M3 12h18M12 8v13"/><path d="M12 8c-1.5 0-3-1.2-3-3a2 2 0 1 1 3 3Zm0 0c1.5 0 3-1.2 3-3a2 2 0 1 0-3 3Z"/></svg>;
}

export function BarChartIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><line x1="4" y1="20" x2="4" y2="12"/><line x1="10" y1="20" x2="10" y2="6"/><line x1="16" y1="20" x2="16" y2="2"/><line x1="2" y1="20" x2="20" y2="20" strokeLinecap="square"/></svg>;
}

export function UsersIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><path d="M16 4.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5"/><path d="M21 20c0-2.5-1.5-4.3-4-4.8"/></svg>;
}

export function ClockIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
}

export function CalendarIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

export function ChevronDownIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><polyline points="6 9 12 15 18 9"/></svg>;
}

export function MailIcon({ size = 18, ...p }: IconProps) {
  return <svg {...base(size)} {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/></svg>;
}

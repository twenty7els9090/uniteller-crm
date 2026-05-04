import type { Variants } from 'framer-motion'

// Единая кривая — все анимации используют одинаковый easing
const ease = [0.22, 0.61, 0.36, 1] as const
const easeIn = [0.55, 0, 1, 0.45] as const

/** Page-level crossfade */
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

/** Section entrance — slide up + fade */
export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: easeIn } },
}

/** Card / tile entrance */
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1,   transition: { duration: 0.3, ease } },
}

/** Stagger container */
export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}

/** List item — faster stagger for many items */
export const listItem: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
}

/** Height expand (accordion-style) */
export const expand: Variants = {
  hidden:  { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.28, ease } },
  exit:    { opacity: 0, height: 0,      transition: { duration: 0.2,  ease: easeIn } },
}

import type { Variants } from 'framer-motion'

/** Simple crossfade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

/** Slide up + fade (default for page sections) */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}

/** Scale + fade (good for cards, bento tiles) */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] } },
}

/** Quick scale pop for interactive elements (badges, toggles) */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
}

/** Slide down + fade (for dropdowns, alerts) */
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } },
}

/** Stagger children with delay */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

/** Faster stagger for lists inside dialogs */
export const quickStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
}

/** Stagger for page-level transitions */
export const pageStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
}

/** Smooth expand/collapse (height auto) */
export const expandIn: Variants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: 'auto', marginTop: 16, transition: { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } },
}

/** Subtle fade in from left (for list items) */
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

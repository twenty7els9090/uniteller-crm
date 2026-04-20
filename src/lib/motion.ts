import type { Variants } from 'framer-motion'

/** Simple crossfade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

/** Slide up + fade (default for page sections) */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}

/** Scale + fade (good for cards) */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] } },
}

/** Quick scale pop for interactive elements (badges, toggles) */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
}

/** Slide down + fade (for dropdowns, alerts) */
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
}

/** Stagger children with delay */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
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
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
}

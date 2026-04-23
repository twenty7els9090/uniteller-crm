import type { Variants } from 'framer-motion'

/** Shared easing — cubic-bezier for spring-like feel */
const EASE_OUT = [0.22, 0.61, 0.36, 1] as const
const EASE_IN = [0.55, 0.06, 0.68, 0.19] as const
const SPRING = { type: 'spring' as const, stiffness: 350, damping: 30 }

/** Crossfade — page transitions */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

/** Slide up + fade — sections, cards */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}

/** Scale + fade — modals, bento tiles */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE_OUT } },
}

/** Slide from right — search results, panels */
export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15, ease: 'easeIn' } },
}

/** Slide from bottom — mobile elements, sheets */
export const slideFromBottom: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.18, ease: 'easeIn' } },
}

/** Stagger children — lists, grids */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.035, delayChildren: 0.05 },
  },
}

/** Pop-in — badges, chips, notifications */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15, ease: 'easeIn' } },
}

export { SPRING, EASE_OUT, EASE_IN }

import type { Variants } from 'framer-motion'

/** Simple crossfade — page transitions */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } },
}

/** Slide up + fade — page sections, cards */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' } },
}

/** Scale + fade — modals, cards, bento tiles */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] } },
}

/** Slide from right — search results, panels */
export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.12, ease: 'easeIn' } },
}

/** Slide from bottom — mobile elements, sheets */
export const slideFromBottom: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, y: 16, transition: { duration: 0.15, ease: 'easeIn' } },
}

/** Stagger children — lists, grids */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
}

/** Pop-in effect — badges, chips, notifications */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.12, ease: 'easeIn' } },
}

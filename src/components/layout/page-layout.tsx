'use client'

import { motion, type Variants, type TargetAndTransition } from 'framer-motion'
import { fadeIn, slideUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Refined crossfade with subtle scale — faster, more polished page transitions */
const pageTransition: Variants = {
  hidden: { ...fadeIn.hidden, scale: 0.995 },
  visible: {
    ...fadeIn.visible,
    scale: 1,
    transition: { ...(fadeIn.visible as TargetAndTransition).transition, duration: 0.22 },
  },
  exit: {
    ...fadeIn.exit,
    scale: 0.995,
    transition: { ...(fadeIn.exit as TargetAndTransition).transition, duration: 0.1 },
  },
}

/** Refined slide-up with smoother easing for section entrances */
const sectionTransition: Variants = {
  hidden: { ...slideUp.hidden, y: 10 },
  visible: {
    ...slideUp.visible,
    transition: {
      ...(slideUp.visible as TargetAndTransition).transition,
      duration: 0.32,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    ...slideUp.exit,
    y: -4,
    transition: { ...(slideUp.exit as TargetAndTransition).transition, duration: 0.12 },
  },
}

/** Wrap a page with smooth crossfade animation */
export function PageWrapper({
  children,
  pageKey,
}: {
  children: React.ReactNode
  pageKey: string
}) {
  return (
    <motion.div
      key={pageKey}
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex-1"
    >
      {children}
    </motion.div>
  )
}

/** Common page section with slide-up entrance */
export function PageSection({
  children,
  className = 'p-4 md:p-6 lg:p-8',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.main
      variants={sectionTransition}
      initial="hidden"
      animate="visible"
      className={cn('flex-1', className)}
    >
      {children}
    </motion.main>
  )
}

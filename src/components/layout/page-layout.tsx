'use client'

import { motion } from 'framer-motion'
import { fadeIn, slideUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

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
      variants={fadeIn}
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
  className = 'p-4 md:p-6',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.main
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className={cn('flex-1', className)}
    >
      {children}
    </motion.main>
  )
}

import { Variants } from 'framer-motion'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

export const staggerContainer: Variants = {
  hidden: {},
  show: (stagger: number = 0.08) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.05 }
  })
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
}

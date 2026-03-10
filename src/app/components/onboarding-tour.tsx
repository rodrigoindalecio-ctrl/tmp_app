'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export interface TourStep {
  targetId: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface OnboardingTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
  isOpen: boolean
}

export function OnboardingTour({ steps, onComplete, onSkip, isOpen }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const router = useRouter()

  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      const updateCoords = () => {
        const target = document.getElementById(steps[currentStep].targetId)
        if (target) {
          const rect = target.getBoundingClientRect()
          setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          })
          
          // Scroll into view if needed
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else if (steps[currentStep].position === 'center') {
            setCoords({
                top: window.innerHeight / 2,
                left: window.innerWidth / 2,
                width: 0,
                height: 0
            })
        }
      }

      updateCoords()
      window.addEventListener('resize', updateCoords)
      return () => window.removeEventListener('resize', updateCoords)
    }
  }, [currentStep, isOpen, steps])

  if (!isOpen) return null

  const step = steps[currentStep]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden h-full w-full">
      {/* Dimmed Overlay with Highlight Hole */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              animate={{
                x: coords.left - 8,
                y: coords.top - 8,
                width: coords.width + 16,
                height: coords.height + 16,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              rx="16"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#tour-mask)"
          className="backdrop-blur-[2px]"
        />
      </svg>

      {/* Highlight Box (Visual Only) */}
      <motion.div
        animate={{
          top: coords.top - 12,
          left: coords.left - 12,
          width: coords.width + 24,
          height: coords.height + 24,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute border-2 border-brand rounded-[1.5rem] shadow-[0_0_30px_rgba(123,45,61,0.3)] pointer-events-none"
      />

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            top: steps[currentStep].position === 'center' 
                ? '50%' 
                : (coords.top - window.scrollY + coords.height + 20),
            left: steps[currentStep].position === 'center'
                ? '50%'
                : Math.max(16, Math.min(typeof window !== 'undefined' ? window.innerWidth - 320 : 0, coords.left + (coords.width / 2) - 150)),
          }}
          style={{
            position: 'fixed',
            transform: steps[currentStep].position === 'center' ? 'translate(-50%, -50%)' : 'none',
            zIndex: 10001
          }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="w-[310px] bg-white rounded-[2.5rem] p-8 shadow-2xl pointer-events-auto border border-border-soft"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-brand-pale rounded-2xl flex items-center justify-center text-brand font-black text-xl">
              {currentStep + 1}
            </div>
            <button 
                onClick={onSkip}
                className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-all"
            >
                Pular
            </button>
          </div>

          <h3 className="text-xl font-black text-text-primary tracking-tight mb-3">
            {step.title}
          </h3>
          <p className="text-sm text-text-muted font-bold leading-relaxed mb-8">
            {step.content}
          </p>

          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-brand' : 'w-1.5 bg-brand-pale'}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-bg-light rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-brand-pale transition-all"
                >
                  Voltar
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-all"
              >
                {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

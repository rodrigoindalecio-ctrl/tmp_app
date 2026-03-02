'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  onConfirm: () => void
  onCancel: () => void
  showWarning?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDangerous = false,
  onConfirm,
  onCancel,
  showWarning = false
}: ConfirmDialogProps) {
  // Fecha ao clicar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-surface rounded-3xl shadow-2xl border border-border-soft max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDangerous
              ? 'bg-danger-light text-danger'
              : 'bg-brand-pale text-brand'
              }`}>
              {isDangerous ? '⚠️' : 'ℹ️'}
            </div>
            <h2 className="text-xl font-black text-text-primary tracking-tight pt-1">{title}</h2>
          </div>

          {/* Message */}
          <p className="text-text-muted font-bold text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* Warning Badge */}
          {showWarning && (
            <div className="bg-danger-light border border-danger/20 rounded-2xl p-4 mb-6 flex gap-3">
              <span className="text-danger font-black text-[10px] uppercase tracking-widest pt-1 leading-none">🔴 IRREVERSÍVEL</span>
              <span className="text-danger-dark text-xs font-bold leading-relaxed">
                Esta ação não pode ser desfeita. Por favor, tenha cuidado.
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={onCancel}
              className="px-6 py-4 bg-bg-light border border-border-soft rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary hover:bg-brand-pale transition-all shadow-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 ${isDangerous
                ? 'bg-danger hover:bg-danger-dark shadow-xl shadow-danger/20'
                : 'bg-brand hover:bg-brand-dark shadow-xl shadow-brand-dark/20'
                }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

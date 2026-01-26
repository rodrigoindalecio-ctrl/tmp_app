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
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDangerous 
                ? 'bg-red-100 text-red-600' 
                : 'bg-primary/10 text-primary'
            }`}>
              {isDangerous ? '⚠️' : 'ℹ️'}
            </div>
            <h2 className="text-xl font-serif font-light text-textPrimary pt-1">{title}</h2>
          </div>

          {/* Message */}
          <p className="text-textSecondary text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* Warning Badge */}
          {showWarning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
              <span className="text-red-600 text-sm font-medium">🔴 IRREVERSÍVEL</span>
              <span className="text-red-600 text-xs leading-relaxed">
                Esta ação não pode ser desfeita. Por favor, tenha cuidado.
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-surface border border-borderSoft rounded-lg text-sm font-medium text-textPrimary hover:bg-background transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
                isDangerous
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
                  : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
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

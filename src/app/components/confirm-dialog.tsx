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
      <div className="relative bg-white rounded-3xl shadow-2xl border-4 border-brand/5 max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDangerous
                ? 'bg-rose-100 text-rose-600'
                : 'bg-brand/10 text-brand'
              }`}>
              {isDangerous ? '⚠️' : 'ℹ️'}
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight pt-1">{title}</h2>
          </div>

          {/* Message */}
          <p className="text-slate-500 font-bold text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* Warning Badge */}
          {showWarning && (
            <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4 mb-6 flex gap-3">
              <span className="text-rose-600 text-sm font-black uppercase tracking-widest">🔴 IRREVERSÍVEL</span>
              <span className="text-rose-600 text-xs font-bold leading-relaxed">
                Esta ação não pode ser desfeita. Por favor, tenha cuidado.
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={onCancel}
              className="px-6 py-4 bg-slate-50 border-none rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shadow-inner"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 ${isDangerous
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20'
                  : 'bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20'
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

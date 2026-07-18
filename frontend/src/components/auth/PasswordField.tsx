'use client'

import { useId, useState, type InputHTMLAttributes } from 'react'

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  error?: string
  hint?: string
}

export default function PasswordField({ id, label, error, hint, className = '', ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const generatedId = useId()
  const inputId = id || generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const describedBy = [inputProps['aria-describedby'], error ? errorId : '', hint && !error ? hintId : '']
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="auth-field">
      <label htmlFor={inputId}>{label}</label>
      <div className="auth-password-field">
        <input
          {...inputProps}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`input-dark ${className}`.trim()}
          aria-invalid={error ? true : inputProps['aria-invalid']}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible(current => !current)}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.3A10.7 10.7 0 0112 4c5.4 0 9 5 9 5a15 15 0 01-2.1 2.6M6.6 6.6C4.4 8 3 10 3 10s3.6 5 9 5c1.1 0 2.1-.2 3-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12s3.6-5 9-5 9 5 9 5-3.6 5-9 5-9-5-9-5z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      </div>
      {error ? <p id={errorId} className="auth-field__error">{error}</p> : null}
      {hint && !error ? <p id={hintId} className="auth-field__hint">{hint}</p> : null}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { addAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/app/actions/account'

type Address = {
  id: number
  label: string
  address_line1: string
  address_line2: string | null
  city: string
  province: string | null
  postal_code: string | null
  country: string
  is_default: boolean
}

type Props = {
  addresses: Address[]
}

type FormState = {
  label: string
  address_line1: string
  address_line2: string
  city: string
  province: string
  postal_code: string
  country: string
  is_default: boolean
}

const empty: FormState = {
  label: 'Home',
  address_line1: '',
  address_line2: '',
  city: '',
  province: '',
  postal_code: '',
  country: 'Philippines',
  is_default: false,
}

function fromAddress(a: Address): FormState {
  return {
    label: a.label,
    address_line1: a.address_line1,
    address_line2: a.address_line2 ?? '',
    city: a.city,
    province: a.province ?? '',
    postal_code: a.postal_code ?? '',
    country: a.country,
    is_default: a.is_default,
  }
}

export default function AddressManager({ addresses: initial }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initial)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const openNew = () => { setForm(empty); setEditingId('new'); setError('') }
  const openEdit = (a: Address) => { setForm(fromAddress(a)); setEditingId(a.id); setError('') }
  const closeForm = () => { setEditingId(null); setError('') }

  const handleSave = () => {
    setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.set(k, String(v)))

    startTransition(async () => {
      const result = editingId === 'new'
        ? await addAddress(fd)
        : await updateAddress(editingId as number, fd)

      if (result?.error) { setError(result.error); return }
      // Optimistic: refresh will happen via revalidatePath, but we close form
      closeForm()
    })
  }

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteAddress(id)
      if (result?.error) { setError(result.error); return }
      setAddresses(prev => prev.filter(a => a.id !== id))
    })
  }

  const handleSetDefault = (id: number) => {
    startTransition(async () => {
      const result = await setDefaultAddress(id)
      if (result?.error) { setError(result.error); return }
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
    })
  }

  const isEditing = editingId !== null

  return (
    <div className="address-manager">
      {error && (
        <div className="auth-notice auth-notice--error" role="alert">{error}</div>
      )}

      {addresses.length === 0 && !isEditing && (
        <div className="account-empty-state neo-inset">
          <p className="account-empty-state__heading">No addresses saved</p>
          <p className="account-empty-state__body">Add an address to speed up checkout.</p>
        </div>
      )}

      {/* Address cards */}
      {!isEditing && (
        <div className="address-list">
          {addresses.map(addr => (
            <div key={addr.id} className={`address-card neo-inset ${addr.is_default ? 'is-default' : ''}`}>
              <div className="address-card__header">
                <p className="address-card__label">{addr.label}</p>
                {addr.is_default && <span className="address-card__badge">Default</span>}
              </div>
              <address className="address-card__address">
                {addr.address_line1}<br />
                {addr.address_line2 && <>{addr.address_line2}<br /></>}
                {addr.city}{addr.province ? `, ${addr.province}` : ''} {addr.postal_code}<br />
                {addr.country}
              </address>
              <div className="address-card__actions">
                {!addr.is_default && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={isPending}
                  >
                    Set as Default
                  </button>
                )}
                <button type="button" className="btn-outline" onClick={() => openEdit(addr)} disabled={isPending}>
                  Edit
                </button>
                <button type="button" className="btn-ghost address-card__delete" onClick={() => handleDelete(addr.id)} disabled={isPending}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {isEditing ? (
        <div className="address-form neo-panel">
          <h2 className="account-panel-heading">{editingId === 'new' ? 'Add Address' : 'Edit Address'}</h2>

          {error && <div className="auth-notice auth-notice--error" role="alert">{error}</div>}

          <div className="auth-form">
            <div className="auth-form__row">
              <div className="auth-field">
                <label htmlFor="addr-label">Label</label>
                <input id="addr-label" className="input-dark" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Home, Work…" />
              </div>
              <div className="auth-field">
                <label htmlFor="addr-country">Country</label>
                <input id="addr-country" className="input-dark" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="addr-line1">Address Line 1 <span aria-hidden="true">*</span></label>
              <input id="addr-line1" className="input-dark" value={form.address_line1} onChange={e => setForm(p => ({ ...p, address_line1: e.target.value }))} required />
            </div>
            <div className="auth-field">
              <label htmlFor="addr-line2">Address Line 2</label>
              <input id="addr-line2" className="input-dark" value={form.address_line2} onChange={e => setForm(p => ({ ...p, address_line2: e.target.value }))} placeholder="Apartment, unit, floor…" />
            </div>
            <div className="auth-form__row">
              <div className="auth-field">
                <label htmlFor="addr-city">City <span aria-hidden="true">*</span></label>
                <input id="addr-city" className="input-dark" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required />
              </div>
              <div className="auth-field">
                <label htmlFor="addr-province">Province / Region</label>
                <input id="addr-province" className="input-dark" value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))} />
              </div>
            </div>
            <div className="auth-field">
              <label htmlFor="addr-postal">Postal Code</label>
              <input id="addr-postal" className="input-dark" value={form.postal_code} onChange={e => setForm(p => ({ ...p, postal_code: e.target.value }))} />
            </div>
            <label className="address-form__default admin-checkbox-option" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_default} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} />
              <span style={{ fontSize: '0.82rem' }}>Set as default shipping address</span>
            </label>
            <div className="address-form__buttons">
              <button type="button" className="btn-primary" onClick={handleSave} disabled={isPending} aria-busy={isPending}>
                {isPending ? 'Saving…' : 'Save Address'}
              </button>
              <button type="button" className="btn-ghost" onClick={closeForm} disabled={isPending}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="btn-outline address-manager__add" onClick={openNew}>
          + Add New Address
        </button>
      )}
    </div>
  )
}

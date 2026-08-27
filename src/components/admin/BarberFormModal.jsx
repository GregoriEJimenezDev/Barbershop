import { useState, useEffect, useRef } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { createBarber, updateBarberProfile } from '../../services/barbers.service';
import Modal from '../ui/Modal';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';

const SPECIALTY_OPTIONS = [
  'Corte clásico',
  'Fade',
  'Barba',
  'Diseño',
  'Coloración',
  'Niños',
  'Afeitado clásico',
  'Tratamiento capilar'
];

/**
 * BarberFormModal - Create or edit a barber profile.
 * Used by BarbersPage (superadmin).
 */
const BarberFormModal = ({ isOpen, onClose, barber = null }) => {
  const isEdit = !!barber;
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
    photoURL: '',
    yearsOfExperience: 0,
    specialties: []
  });
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (barber) {
      setForm({
        name: barber.name || '',
        email: barber.email || '',
        password: '',
        phone: barber.phone || '',
        bio: barber.bio || '',
        photoURL: barber.photoURL || '',
        yearsOfExperience: barber.yearsOfExperience || 0,
        specialties: barber.specialties || []
      });
      setPhotoPreview(barber.photoURL || '');
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        bio: '',
        photoURL: '',
        yearsOfExperience: 0,
        specialties: []
      });
      setPhotoPreview('');
    }
  }, [barber, isOpen]);

  const { run: handleSave, loading, errorMessage } = useAsyncAction(
    async () => {
      if (isEdit) {
        await updateBarberProfile({
          barberId: barber.id,
          updates: {
            name: form.name,
            phone: form.phone,
            bio: form.bio,
            photoURL: form.photoURL,
            yearsOfExperience: Number(form.yearsOfExperience) || 0,
            specialties: form.specialties
          }
        });
      } else {
        if (!form.password || form.password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        await createBarber({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          bio: form.bio,
          photoURL: form.photoURL,
          yearsOfExperience: Number(form.yearsOfExperience) || 0,
          specialties: form.specialties
        });
      }
      onClose();
    }
  );

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleSpecialty = (specialty) => {
    setForm((p) => ({
      ...p,
      specialties: p.specialties.includes(specialty)
        ? p.specialties.filter((s) => s !== specialty)
        : [...p.specialties, specialty]
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 data URL (so we don't need Storage for now)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPhotoPreview(dataUrl);
      setForm((p) => ({ ...p, photoURL: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name || (!isEdit && !form.email) || (!isEdit && !form.password)) return;
    handleSave();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Editar barbero: ${barber?.name}` : 'Nuevo barbero'}
    >
      {errorMessage && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert type="error">{errorMessage}</Alert>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        {/* PHOTO */}
        <div className="field" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div
            className="barber-photo-upload"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Foto" />
            ) : (
              <div className="barber-photo-upload__placeholder">
                <span style={{ fontSize: '2rem' }}>📷</span>
                <span style={{ fontSize: 'var(--text-sm)' }}>Subir foto</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Click para subir una foto (máx. 2 MB)
          </p>
        </div>

        <div className="field">
          <label htmlFor="name">Nombre completo *</label>
          <input
            id="name"
            name="name"
            className="input"
            value={form.name}
            onChange={onChange}
            placeholder="Ej: Carlos Méndez"
            required
          />
        </div>

        {!isEdit && (
          <>
            <div className="field">
              <label htmlFor="email">Correo electrónico *</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                value={form.email}
                onChange={onChange}
                placeholder="barbero@correo.com"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña *</label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                value={form.password}
                onChange={onChange}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
            value={form.phone}
            onChange={onChange}
            placeholder="+1 809 000 0000"
          />
        </div>

        <div className="field">
          <label htmlFor="yearsOfExperience">Años de experiencia</label>
          <input
            id="yearsOfExperience"
            name="yearsOfExperience"
            type="number"
            min="0"
            max="60"
            className="input"
            value={form.yearsOfExperience}
            onChange={onChange}
            placeholder="5"
          />
        </div>

        <div className="field">
          <label htmlFor="bio">Biografía</label>
          <textarea
            id="bio"
            name="bio"
            className="textarea"
            value={form.bio}
            onChange={onChange}
            placeholder="Cuéntale a los clientes sobre tu experiencia y estilo..."
            rows="3"
            maxLength={300}
          />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            {form.bio.length}/300 caracteres
          </p>
        </div>

        <div className="field">
          <label>Especialidades</label>
          <div className="specialty-chips">
            {SPECIALTY_OPTIONS.map((s) => {
              const selected = form.specialties.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={`specialty-chip ${selected ? 'specialty-chip--selected' : ''}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Loader size="sm" /> : isEdit ? 'Guardar cambios' : 'Crear barbero'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BarberFormModal;

import { useState } from 'react';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { createReview } from '../../services/barbers.service';
import Modal from '../ui/Modal';
import Loader from '../ui/Loader';
import Alert from '../ui/Alert';

const ReviewModal = ({ isOpen, onClose, appointment, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hovered, setHovered] = useState(0);

  const { run: handleSubmit, loading, errorMessage } = useAsyncAction(
    async () => {
      await createReview({
        appointmentId: appointment.id,
        rating,
        comment: comment.trim()
      });
      onSuccess && onSuccess();
      onClose();
    }
  );

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit();
  };

  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Califica tu experiencia"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading ? <Loader size="sm" /> : 'Enviar reseña'}
          </button>
        </>
      }
    >
      {errorMessage && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert type="error">{errorMessage}</Alert>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
          ¿Cómo fue tu cita con
        </p>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
          {appointment.barberName}
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          {appointment.serviceName}
        </p>
      </div>

      <div className="review-stars" style={{ justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="review-star"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            {star <= (hovered || rating) ? '★' : '☆'}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          {rating === 5 && '¡Excelente!'}
          {rating === 4 && 'Muy bueno'}
          {rating === 3 && 'Bueno'}
          {rating === 2 && 'Regular'}
          {rating === 1 && 'Necesita mejorar'}
        </span>
      </div>

      <div className="field">
        <label htmlFor="comment">Comentario (opcional)</label>
        <textarea
          id="comment"
          className="textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuéntanos cómo te fue..."
          rows="4"
          maxLength={500}
        />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
          {comment.length}/500
        </p>
      </div>
    </Modal>
  );
};

export default ReviewModal;

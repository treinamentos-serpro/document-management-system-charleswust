import { useState } from 'react';

import { uploadDocument } from '../services/documents.api';

export default function UploadComponent({ onUpload }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');
    let uploaded = false;

    try {
      await uploadDocument(file, owner);
      uploaded = true;
      setFile(null);
      setOwner('');
      event.currentTarget.reset();
      setSuccess('Documento enviado com sucesso.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsSubmitting(false);
    }

    if (uploaded) {
      try {
        await onUpload();
      } catch (refreshError) {
        setSuccess('');
        setError(refreshError?.message || 'Documento enviado, mas não foi possível atualizar a lista.');
      }
    }
  }

  return (
    <section aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Arquivo
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            disabled={isSubmitting}
          />
        </label>
        <label>
          Responsável
          <input
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Opcional"
            disabled={isSubmitting}
          />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </section>
  );
}
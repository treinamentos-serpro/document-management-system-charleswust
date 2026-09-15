import { useState } from 'react';

import { downloadDocument } from '../services/documents.api';

export default function DownloadButton({ document }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');

    try {
      const { blob, fileName } = await downloadDocument(document.id, document.originalName);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');

      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
      }, 0);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
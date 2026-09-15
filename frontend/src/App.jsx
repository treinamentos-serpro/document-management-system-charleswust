import { useEffect, useState } from 'react';

import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/documents.api';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDocuments() {
    setIsLoading(true);
    setError('');

    try {
      setDocuments(await listDocuments());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <main>
      <h1>Document Management System</h1>
      <UploadComponent onUpload={loadDocuments} />
      {error ? <p role="alert">{error}</p> : <DocumentList documents={documents} isLoading={isLoading} />}
    </main>
  );
}

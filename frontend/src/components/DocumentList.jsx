import DownloadButton from './DownloadButton';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DocumentList({ documents, isLoading }) {
  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return <p>Nenhum documento enviado.</p>;
  }

  return (
    <section aria-labelledby="documents-title">
      <h2 id="documents-title">Documentos</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Responsável</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col">Ação</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>{document.originalName}</td>
              <td>{document.owner}</td>
              <td>{formatFileSize(document.size)}</td>
              <td>{formatDate(document.uploadedAt)}</td>
              <td><DownloadButton document={document} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
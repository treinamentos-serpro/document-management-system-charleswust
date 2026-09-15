const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function getErrorMessage(response, fallbackMessage) {
  try {
    const body = await response.json();
    return body.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function listDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Não foi possível listar os documentos.'));
  }

  return response.json();
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  if (owner.trim()) {
    formData.append('owner', owner.trim());
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Não foi possível enviar o documento.'));
  }

  return response.json();
}

export async function downloadDocument(id, fallbackFileName) {
  const response = await fetch(`${API_BASE_URL}/documents/${id}/download`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Não foi possível baixar o documento.'));
  }

  const contentDisposition = response.headers.get('content-disposition');
  const fileNameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);

  return {
    blob: await response.blob(),
    fileName: fileNameMatch?.[1] || fallbackFileName,
  };
}
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const repository = require('../repositories/documents.repository');

const MAX_OWNER_LENGTH = Number(process.env.MAX_OWNER_LENGTH || 100);

function sanitizeOriginalName(fileName, id) {
  const baseName = path.basename(fileName || `document-${id}`);
  const sanitizedName = baseName.replace(/[\u0000-\u001F\u007F"\\/]/g, '_').trim();

  if (!sanitizedName) {
    return `document-${id}`;
  }

  return sanitizedName.slice(0, 255);
}

function normalizeOwner(owner) {
  const normalizedOwner = String(owner || 'anonymous').trim();

  if (!normalizedOwner || normalizedOwner.length > MAX_OWNER_LENGTH) {
    throw new Error('Responsável inválido.');
  }

  return normalizedOwner;
}

function sanitizeDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

async function uploadDocument(file, owner) {
  if (!file) {
    throw new Error('Arquivo obrigatório para upload.');
  }

  const id = randomUUID();
  const originalName = sanitizeOriginalName(file.originalname, id);
  const extension = path.extname(originalName) || '';
  const fileName = `${id}${extension}`;
  const storagePath = await repository.moveUploadedFile(file.path, fileName);

  try {
    const document = repository.createDocument({
      id,
      originalName,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: normalizeOwner(owner),
      storagePath,
      mimeType: file.mimetype || 'application/octet-stream',
    });

    return sanitizeDocument(document);
  } catch (error) {
    await repository.removeFile(storagePath);
    throw error;
  }
}

function listDocuments() {
  return repository.getAllDocuments().map((document) => sanitizeDocument(document));
}

function getDocumentById(id) {
  const document = repository.findDocumentById(id);

  if (!document) {
    return null;
  }

  return {
    ...document,
  };
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentById,
  sanitizeOriginalName,
};

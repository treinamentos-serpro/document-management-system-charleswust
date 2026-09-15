const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const repository = require('../repositories/documents.repository');

const STORAGE_DIR = path.resolve(__dirname, '../../storage');

function ensureStorageDirectory() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
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

function uploadDocument(file, owner) {
  if (!file) {
    throw new Error('Arquivo obrigatório para upload.');
  }

  ensureStorageDirectory();

  const id = randomUUID();
  const originalName = file.originalname || `document-${id}`;
  const extension = path.extname(originalName) || '';
  const fileName = `${id}${extension}`;
  const storagePath = path.join(STORAGE_DIR, fileName);

  fs.renameSync(file.path, storagePath);

  const document = repository.createDocument({
    id,
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: owner || 'anonymous',
    storagePath,
    mimeType: file.mimetype || 'application/octet-stream',
  });

  return sanitizeDocument(document);
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
  STORAGE_DIR,
};

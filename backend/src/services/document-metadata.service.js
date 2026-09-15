const path = require('node:path');

const MAX_OWNER_LENGTH = Number(process.env.MAX_OWNER_LENGTH || 100);

function sanitizeOriginalName(fileName, id) {
  const fallbackName = `document-${id}`;
  const baseName = path.basename(fileName || fallbackName);
  const extension = path.extname(baseName).replace(/[\u0000-\u001F\u007F"\\/]/g, '_').trim();
  const nameWithoutExtension = baseName.slice(0, baseName.length - path.extname(baseName).length);
  const sanitizedName = nameWithoutExtension.replace(/[\u0000-\u001F\u007F"\\/]/g, '_').trim();

  if (!sanitizedName) {
    return `${fallbackName}${extension}`.slice(0, 255);
  }

  return `${sanitizedName}${extension}`.slice(0, 255);
}

function normalizeOwner(owner) {
  const normalizedOwner = String(owner || 'anonymous').trim();

  if (!normalizedOwner || normalizedOwner.length > MAX_OWNER_LENGTH) {
    throw new Error('Responsável inválido.');
  }

  return normalizedOwner;
}

function buildStorageFileName(originalName, id) {
  const extension = path.extname(originalName) || '';
  return `${id}${extension}`;
}

function createDocumentData({ file, owner, id, storagePath, originalName }) {
  return {
    id,
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: normalizeOwner(owner),
    storagePath,
    mimeType: file.mimetype || 'application/octet-stream',
  };
}

function toDocumentResponse(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

module.exports = {
  buildStorageFileName,
  createDocumentData,
  normalizeOwner,
  sanitizeOriginalName,
  toDocumentResponse,
};

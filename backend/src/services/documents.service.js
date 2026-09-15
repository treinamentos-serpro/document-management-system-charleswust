const { randomUUID } = require('node:crypto');

const repository = require('../repositories/documents.repository');
const documentMetadataService = require('./document-metadata.service');

async function uploadDocument(file, owner) {
  if (!file) {
    throw new Error('Arquivo obrigatório para upload.');
  }

  const id = randomUUID();
  const originalName = documentMetadataService.sanitizeOriginalName(file.originalname, id);
  const fileName = documentMetadataService.buildStorageFileName(originalName, id);
  const storagePath = await repository.moveUploadedFile(file.path, fileName);

  try {
    const document = repository.createDocument(documentMetadataService.createDocumentData({
      file,
      owner,
      id,
      storagePath,
      originalName,
    }));

    return documentMetadataService.toDocumentResponse(document);
  } catch (error) {
    await repository.removeFile(storagePath);
    throw error;
  }
}

function listDocuments() {
  return repository.getAllDocuments().map((document) => documentMetadataService.toDocumentResponse(document));
}

function getDocumentById(id) {
  const document = repository.findDocumentById(id);

  if (!document) {
    return null;
  }

  return {
    ...document,
    storagePath: repository.getManagedStoragePath(document.storagePath),
  };
}

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentById,
  sanitizeOriginalName: documentMetadataService.sanitizeOriginalName,
};

const fs = require('node:fs/promises');
const path = require('node:path');

const documents = [];
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../../storage'));

async function ensureStorageDirectory() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

function getStoragePath(fileName) {
  const storagePath = path.resolve(STORAGE_DIR, fileName);
  const relativePath = path.relative(STORAGE_DIR, storagePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Caminho de armazenamento inválido.');
  }

  return storagePath;
}

async function moveUploadedFile(sourcePath, fileName) {
  await ensureStorageDirectory();
  const storagePath = getStoragePath(fileName);
  await fs.rename(sourcePath, storagePath);
  return storagePath;
}

async function removeFile(storagePath) {
  await fs.unlink(storagePath).catch((error) => {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  });
}

function createDocument(documentData) {
  const document = {
    ...documentData,
  };

  documents.push(document);
  return { ...document };
}

function getAllDocuments() {
  return documents.map((document) => ({ ...document }));
}

function findDocumentById(id) {
  return documents.find((document) => document.id === id);
}

module.exports = {
  createDocument,
  getAllDocuments,
  findDocumentById,
  moveUploadedFile,
  removeFile,
  getStoragePath,
  STORAGE_DIR,
};

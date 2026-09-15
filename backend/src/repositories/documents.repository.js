const fs = require('node:fs/promises');
const path = require('node:path');

const documents = [];
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '../../storage'));
const STORAGE_FILE_NAME_PATTERN = /^[0-9a-f-]{36}(?:\.[^/\\\u0000-\u001F\u007F]+)?$/i;
const TEMP_STORAGE_FILE_NAME_PATTERN = /^[0-9a-f-]{36}$/i;
const STORAGE_GITKEEP_CONTENT = '# Mantenha esta pasta no controle de versão.\n# Os arquivos enviados (upload local via multer) serão gravados aqui em tempo de execução.\n';

async function ensureStorageDirectory() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

function assertValidStorageFileName(fileName) {
  if (typeof fileName !== 'string' || !STORAGE_FILE_NAME_PATTERN.test(fileName)) {
    throw new Error('Nome de arquivo de armazenamento inválido.');
  }
}

function getStoragePath(fileName) {
  assertValidStorageFileName(fileName);
  const storagePath = path.resolve(STORAGE_DIR, fileName);
  const relativePath = path.relative(STORAGE_DIR, storagePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Caminho de armazenamento inválido.');
  }

  return storagePath;
}

function getTemporaryUploadPath(sourcePath) {
  const temporaryUploadPath = path.resolve(String(sourcePath || ''));
  const relativePath = path.relative(STORAGE_DIR, temporaryUploadPath);
  const fileName = path.basename(temporaryUploadPath);

  if (
    relativePath.startsWith('..')
    || path.isAbsolute(relativePath)
    || !TEMP_STORAGE_FILE_NAME_PATTERN.test(fileName)
  ) {
    throw new Error('Caminho temporário de upload inválido.');
  }

  return temporaryUploadPath;
}

async function moveUploadedFile(sourcePath, fileName) {
  await ensureStorageDirectory();
  const temporaryUploadPath = getTemporaryUploadPath(sourcePath);
  const storagePath = getStoragePath(fileName);
  await fs.rename(temporaryUploadPath, storagePath);
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

async function resetDocuments() {
  documents.length = 0;
  await fs.rm(STORAGE_DIR, { recursive: true, force: true });
  await ensureStorageDirectory();
  await fs.writeFile(path.join(STORAGE_DIR, '.gitkeep'), STORAGE_GITKEEP_CONTENT);
}

module.exports = {
  createDocument,
  getAllDocuments,
  findDocumentById,
  resetDocuments,
  moveUploadedFile,
  removeFile,
  getStoragePath,
  STORAGE_DIR,
};

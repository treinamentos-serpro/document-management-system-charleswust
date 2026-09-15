const express = require('express');
const fs = require('node:fs');
const multer = require('multer');
const { randomUUID } = require('node:crypto');

const documentsController = require('../controllers/documents.controller');
const { STORAGE_DIR } = require('../config/storage.config');

const router = express.Router();
const maxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
const allowedMimeTypes = new Set((process.env.ALLOWED_MIME_TYPES || [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain',
].join(',')).split(',').map((mimeType) => mimeType.trim()).filter(Boolean));

fs.mkdirSync(STORAGE_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, STORAGE_DIR);
  },
  filename: (_req, file, callback) => {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error('Tipo de arquivo não permitido.'));
    }

    return callback(null, true);
  },
});

router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

module.exports = router;

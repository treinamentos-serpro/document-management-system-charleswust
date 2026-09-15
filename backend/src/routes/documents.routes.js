const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('node:crypto');

const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const storageDir = path.resolve(__dirname, '../../storage');
const maxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000);
const uploadRateLimitMaxRequests = Number(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || 30);
const downloadRateLimitMaxRequests = Number(process.env.DOWNLOAD_RATE_LIMIT_MAX_REQUESTS || 60);
const allowedMimeTypes = new Set((process.env.ALLOWED_MIME_TYPES || [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain',
].join(',')).split(',').map((mimeType) => mimeType.trim()).filter(Boolean));

fs.mkdirSync(storageDir, { recursive: true });

const uploadRateLimit = rateLimit({
  windowMs: rateLimitWindowMs,
  limit: uploadRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Limite de requisições excedido. Tente novamente em instantes.',
    });
  },
});

const downloadRateLimit = rateLimit({
  windowMs: rateLimitWindowMs,
  limit: downloadRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Limite de requisições excedido. Tente novamente em instantes.',
    });
  },
});

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, storageDir);
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

router.post('/upload', uploadRateLimit, upload.single('file'), documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', downloadRateLimit, documentsController.downloadDocument);

module.exports = router;

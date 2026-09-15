const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');

const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const storageDir = path.resolve(__dirname, '../../storage');

fs.mkdirSync(storageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, storageDir);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

module.exports = router;

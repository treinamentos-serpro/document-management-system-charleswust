const fs = require('node:fs');

const documentsService = require('../services/documents.service');

function uploadDocument(req, res) {
  try {
    const file = req.file;
    const owner = req.body?.owner || 'anonymous';
    const document = documentsService.uploadDocument(file, owner);

    return res.status(201).json(document);
  } catch (error) {
    const statusCode = error.message.includes('Arquivo') ? 400 : 500;
    return res.status(statusCode).json({
      message: error.message || 'Erro ao enviar documento.',
    });
  }
}

function listDocuments(req, res) {
  try {
    const documents = documentsService.listDocuments();
    return res.status(200).json(documents);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Erro ao listar documentos.',
    });
  }
}

function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    const document = documentsService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado.' });
    }

    if (!fs.existsSync(document.storagePath)) {
      return res.status(404).json({ message: 'Arquivo físico do documento não encontrado.' });
    }

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);

    const fileStream = fs.createReadStream(document.storagePath);
    fileStream.on('error', () => {
      res.status(500).json({ message: 'Erro ao ler o arquivo solicitado.' });
    });

    return fileStream.pipe(res);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Erro ao baixar documento.',
    });
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};

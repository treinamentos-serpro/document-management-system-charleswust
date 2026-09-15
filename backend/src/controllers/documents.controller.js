const fs = require('node:fs');
const fsPromises = require('node:fs/promises');

const documentsService = require('../services/documents.service');
const BAD_REQUEST_MESSAGES = new Set([
  'Arquivo obrigatório para upload.',
  'Responsável inválido.',
  'Tipo de arquivo não permitido.',
  'Nome de arquivo de armazenamento inválido.',
  'Caminho temporário de upload inválido.',
]);

function getStatusCode(error) {
  return BAD_REQUEST_MESSAGES.has(error.message) ? 400 : 500;
}

function buildContentDisposition(fileName) {
  const asciiFileName = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

async function uploadDocument(req, res) {
  try {
    const file = req.file;
    const owner = req.body?.owner || 'anonymous';
    const document = await documentsService.uploadDocument(file, owner);

    return res.status(201).json(document);
  } catch (error) {
    const statusCode = getStatusCode(error);
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

async function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    const document = documentsService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ message: 'Documento não encontrado.' });
    }

    await fsPromises.access(document.storagePath, fs.constants.R_OK);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', buildContentDisposition(document.originalName));

    const fileStream = fs.createReadStream(document.storagePath);
    fileStream.on('error', (error) => {
      if (!res.headersSent) {
        const statusCode = error.code === 'ENOENT' ? 404 : 500;
        res.status(statusCode).json({ message: statusCode === 404 ? 'Arquivo físico do documento não encontrado.' : 'Erro ao ler o arquivo solicitado.' });
        return;
      }

      res.destroy(error);
    });

    return fileStream.pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Arquivo físico do documento não encontrado.' });
    }

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

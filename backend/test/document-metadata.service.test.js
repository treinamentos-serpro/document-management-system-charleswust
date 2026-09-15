const { test } = require('node:test');
const assert = require('node:assert');

const documentMetadataService = require('../src/services/document-metadata.service');

test('deve sanitizar o nome original e preservar a extensão no nome armazenado', () => {
  const id = '123';
  const originalName = documentMetadataService.sanitizeOriginalName('../pasta/arqui"vo?.txt', id);

  assert.strictEqual(originalName, 'arqui_vo?.txt');
  assert.strictEqual(documentMetadataService.buildStorageFileName(originalName, id), '123.txt');
});

test('deve montar os dados persistidos com responsável normalizado e mime padrão', () => {
  const documentData = documentMetadataService.createDocumentData({
    file: {
      size: 42,
      mimetype: '',
    },
    owner: '  user-123  ',
    id: 'abc',
    storagePath: '/tmp/documento.txt',
    originalName: 'documento.txt',
  });

  assert.strictEqual(documentData.id, 'abc');
  assert.strictEqual(documentData.originalName, 'documento.txt');
  assert.strictEqual(documentData.size, 42);
  assert.strictEqual(documentData.owner, 'user-123');
  assert.strictEqual(documentData.storagePath, '/tmp/documento.txt');
  assert.strictEqual(documentData.mimeType, 'application/octet-stream');
  assert.ok(Date.parse(documentData.uploadedAt), 'a data de upload deve ser válida');
});

test('deve retornar somente os campos públicos do documento', () => {
  const response = documentMetadataService.toDocumentResponse({
    id: 'abc',
    originalName: 'documento.txt',
    size: 42,
    uploadedAt: '2026-09-15T19:00:00.000Z',
    owner: 'user-123',
    storagePath: '/tmp/documento.txt',
    mimeType: 'text/plain',
  });

  assert.deepStrictEqual(response, {
    id: 'abc',
    originalName: 'documento.txt',
    size: 42,
    uploadedAt: '2026-09-15T19:00:00.000Z',
    owner: 'user-123',
  });
});

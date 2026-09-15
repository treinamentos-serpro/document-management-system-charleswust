const { after, beforeEach, test } = require('node:test');
const assert = require('node:assert');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

process.env.STORAGE_DIR = path.join(os.tmpdir(), `dms-backend-tests-${process.pid}-${randomUUID()}`);

const app = require('../src/app');
const repository = require('../src/repositories/documents.repository');

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

async function uploadDocument(server, { content, fileName, mimeType = 'text/plain', owner = 'anonymous' }) {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: mimeType }), fileName);
  formData.append('owner', owner);

  return fetch(`http://127.0.0.1:${server.address().port}/upload`, {
    method: 'POST',
    body: formData,
  });
}

beforeEach(async () => {
  await repository.resetDocumentsStore();
});

after(async () => {
  await repository.resetDocumentsStore();
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('deve fazer upload e listar documentos', async () => {
  const server = await startServer();

  try {
    const uploadResponse = await uploadDocument(server, {
      content: 'conteudo do documento',
      fileName: 'arquivo.txt',
      owner: 'user-123',
    });

    assert.strictEqual(uploadResponse.status, 201, 'o upload deve retornar 201');

    const uploadedDocument = await uploadResponse.json();
    assert.strictEqual(uploadedDocument.originalName, 'arquivo.txt');
    assert.strictEqual(uploadedDocument.owner, 'user-123');
    assert.ok(uploadedDocument.id, 'o documento deve ter identificador');

    const listResponse = await fetch(`http://127.0.0.1:${server.address().port}/documents`);
    assert.strictEqual(listResponse.status, 200, 'a listagem deve retornar 200');

    const documents = await listResponse.json();
    assert.ok(Array.isArray(documents), 'a listagem deve retornar um array');
    assert.ok(documents.some((document) => document.id === uploadedDocument.id), 'o documento enviado deve aparecer na listagem');
  } finally {
    server.close();
  }
});

test('deve baixar o arquivo salvo pelo identificador', async () => {
  const server = await startServer();

  try {
    const uploadResponse = await uploadDocument(server, {
      content: 'texto de teste para download',
      fileName: 'download.txt',
      owner: 'user-456',
    });

    const uploadedDocument = await uploadResponse.json();
    const downloadResponse = await fetch(`http://127.0.0.1:${server.address().port}/documents/${uploadedDocument.id}/download`);

    assert.strictEqual(downloadResponse.status, 200, 'o download deve retornar 200');
    assert.strictEqual(downloadResponse.headers.get('content-type'), 'text/plain');
    const content = await downloadResponse.text();
    assert.strictEqual(content, 'texto de teste para download');
  } finally {
    server.close();
  }
});

test('deve rejeitar upload sem arquivo com resposta JSON', async () => {
  const server = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/upload`, {
      method: 'POST',
      body: new FormData(),
    });

    assert.strictEqual(response.status, 400);
    assert.deepStrictEqual(await response.json(), { message: 'Arquivo obrigatório para upload.' });
  } finally {
    server.close();
  }
});

test('deve rejeitar tipo de arquivo não permitido com resposta JSON', async () => {
  const server = await startServer();

  try {
    const response = await uploadDocument(server, {
      content: 'conteúdo executável',
      fileName: 'arquivo.exe',
      mimeType: 'application/x-msdownload',
    });

    assert.strictEqual(response.status, 400);
    assert.deepStrictEqual(await response.json(), { message: 'Tipo de arquivo não permitido.' });
  } finally {
    server.close();
  }
});

test('deve rejeitar arquivo acima do limite com resposta JSON', async () => {
  const server = await startServer();

  try {
    const response = await uploadDocument(server, {
      content: 'a'.repeat(10 * 1024 * 1024 + 1),
      fileName: 'grande.txt',
    });

    assert.strictEqual(response.status, 400);
    assert.deepStrictEqual(await response.json(), { message: 'Arquivo excede o tamanho máximo permitido.' });
  } finally {
    server.close();
  }
});

test('deve rejeitar responsável inválido sem registrar o documento', async () => {
  const server = await startServer();

  try {
    const uploadResponse = await uploadDocument(server, {
      content: 'conteúdo válido',
      fileName: 'valido.txt',
      owner: 'a'.repeat(101),
    });

    assert.strictEqual(uploadResponse.status, 400);
    assert.deepStrictEqual(await uploadResponse.json(), { message: 'Responsável inválido.' });

    const listResponse = await fetch(`http://127.0.0.1:${server.address().port}/documents`);
    const documents = await listResponse.json();
    assert.ok(!documents.some((document) => document.originalName === 'valido.txt'));
  } finally {
    server.close();
  }
});

test('deve retornar 404 para download de documento inexistente', async () => {
  const server = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/documents/inexistente/download`);

    assert.strictEqual(response.status, 404);
    assert.deepStrictEqual(await response.json(), { message: 'Documento não encontrado.' });
  } finally {
    server.close();
  }
});

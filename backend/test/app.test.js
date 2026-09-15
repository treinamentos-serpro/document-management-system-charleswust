const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const documentsRepository = require('../src/repositories/documents.repository');

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

beforeEach(async () => {
  await documentsRepository.resetDocuments();
});

after(async () => {
  await documentsRepository.resetDocuments();
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('deve fazer upload e listar documentos', async () => {
  const server = await startServer();

  try {
    const formData = new FormData();
    formData.append('file', new Blob(['conteudo do documento'], { type: 'text/plain' }), 'arquivo.txt');
    formData.append('owner', 'user-123');

    const uploadResponse = await fetch(`http://127.0.0.1:${server.address().port}/upload`, {
      method: 'POST',
      body: formData,
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
    const formData = new FormData();
    formData.append('file', new Blob(['texto de teste para download'], { type: 'text/plain' }), 'download.txt');
    formData.append('owner', 'user-456');

    const uploadResponse = await fetch(`http://127.0.0.1:${server.address().port}/upload`, {
      method: 'POST',
      body: formData,
    });

    const uploadedDocument = await uploadResponse.json();
    const downloadResponse = await fetch(`http://127.0.0.1:${server.address().port}/documents/${uploadedDocument.id}/download`);

    assert.strictEqual(downloadResponse.status, 200, 'o download deve retornar 200');
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
    const formData = new FormData();
    formData.append('file', new Blob(['conteúdo executável'], { type: 'application/x-msdownload' }), 'arquivo.exe');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/upload`, {
      method: 'POST',
      body: formData,
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
    const formData = new FormData();
    formData.append('file', new Blob(['a'.repeat(10 * 1024 * 1024 + 1)], { type: 'text/plain' }), 'grande.txt');

    const response = await fetch(`http://127.0.0.1:${server.address().port}/upload`, {
      method: 'POST',
      body: formData,
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
    const formData = new FormData();
    formData.append('file', new Blob(['conteúdo válido'], { type: 'text/plain' }), 'valido.txt');
    formData.append('owner', 'a'.repeat(101));

    const uploadResponse = await fetch(`http://127.0.0.1:${server.address().port}/upload`, {
      method: 'POST',
      body: formData,
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

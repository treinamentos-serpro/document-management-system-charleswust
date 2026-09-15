const documents = [];

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
};

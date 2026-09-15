# Especificação - Document Management System

## 1. Objetivo

Disponibilizar um sistema simples de gestão de documentos que permita ao usuário enviar arquivos, consultá-los em lista e baixá-los por identificador, mantendo o armazenamento local e os metadados em memória durante esta fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário
- Armazenamento local do arquivo em disco
- Registro de metadados do documento em memória

### Fora do escopo

- Armazenamento em nuvem ou externo
- Versionamento de documentos
- Recuperação de arquivos excluídos
- Compartilhamento público de links
- Sistema de autenticação e autorização avançado
- Persistência em banco de dados
- Busca por conteúdo do documento
- Interface de administração complexa

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um documento com arquivo e metadados básicos. |
| RF-02 | O sistema deve aceitar apenas arquivos enviados em requisição multipart/form-data. |
| RF-03 | O sistema deve registrar o documento com um identificador único. |
| RF-04 | O sistema deve exibir a lista de documentos enviados, incluindo metadados principais. |
| RF-05 | O usuário pode baixar um documento a partir do identificador do registro. |
| RF-06 | O sistema deve retornar erro quando o arquivo informado estiver ausente ou inválido. |
| RF-07 | O sistema deve retornar erro quando o documento solicitado não existir. |
| RF-08 | O sistema deve manter o nome original do arquivo para exibição e download. |
| RF-09 | O sistema deve registrar a data e hora do upload em padrão ISO 8601. |
| RF-10 | O sistema deve associar o documento ao identificador do usuário dono. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados no filesystem local da aplicação em backend/storage, com multer e diskStorage. |
| RNF-02 | Os metadados dos documentos devem ser mantidos em memória nesta fase inicial. |
| RNF-03 | A aplicação deve separar responsabilidades por camadas: routes, controllers, services e repositories. |
| RNF-04 | A configuração da aplicação deve seguir o princípio 12-Factor, preferencialmente por variáveis de ambiente. |
| RNF-05 | O backend deve expor endpoints REST simples e previsíveis. |
| RNF-06 | O frontend deve consumir a API via fetch, usando prefixo /api conforme a configuração do Vite. |
| RNF-07 | O sistema deve tratar erros de entrada HTTP e falhas de leitura/escrita de arquivos sem quebrar a aplicação. |
| RNF-08 | O sistema deve evitar path traversal e acessos indevidos ao arquivo armazenado localmente. |

## 5. Modelo de dados

### Entidade principal: Documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| id | string | Identificador único do documento. |
| originalName | string | Nome original do arquivo enviado. |
| size | number | Tamanho do arquivo em bytes. |
| uploadedAt | string | Data e hora do upload em formato ISO 8601. |
| owner | string | Identificador do usuário dono do documento. |
| storagePath | string | Caminho local do arquivo salvo no filesystem da aplicação. |
| mimeType | string | Tipo de conteúdo do arquivo, quando disponível. |

Observações:
- Os campos públicos da API devem priorizar id, originalName, size, uploadedAt e owner.
- storagePath e mimeType podem ser usados internamente para controlar o armazenamento e o download, sem expor necessariamente ao cliente em todas as respostas.
- Em fase inicial, a coleção de documentos fica em memória em um armazenamento simples do tipo mapa ou array.

## 6. Contratos de API

### 6.1. POST /upload

Descrição:
- Recebe um arquivo enviado em multipart/form-data.
- Cria o registro do documento e salva o arquivo no filesystem local.

Entrada:
- multipart/form-data
- campo file: arquivo a ser enviado
- opcionalmente, o sistema pode receber dados do dono por header, query string ou body em versões futuras

Resposta de sucesso:
- HTTP 201 Created

Exemplo de payload:

```json
{
  "id": "doc_123",
  "originalName": "relatorio.pdf",
  "size": 245678,
  "uploadedAt": "2026-09-15T14:30:00.000Z",
  "owner": "user-001"
}
```

Respostas de erro:
- 400 Bad Request: ausencia de arquivo ou conteúdo inválido
- 500 Internal Server Error: falha na escrita do arquivo ou processamento

### 6.2. GET /documents

Descrição:
- Retorna a lista de documentos cadastrados.

Resposta de sucesso:
- HTTP 200 OK

Exemplo:

```json
[
  {
    "id": "doc_123",
    "originalName": "relatorio.pdf",
    "size": 245678,
    "uploadedAt": "2026-09-15T14:30:00.000Z",
    "owner": "user-001"
  },
  {
    "id": "doc_456",
    "originalName": "contrato.docx",
    "size": 987654,
    "uploadedAt": "2026-09-15T15:10:00.000Z",
    "owner": "user-001"
  }
]
```

Respostas de erro:
- 500 Internal Server Error: falha ao recuperar metadados

### 6.3. GET /documents/:id/download

Descrição:
- Recupera o arquivo físico associado ao documento recebido pelo identificador.

Resposta de sucesso:
- HTTP 200 OK
- content-type: mime do arquivo
- Content-Disposition: attachment; filename="nome-original.extensao"

Fluxo esperado:
- buscar o documento pelo id
- localizar o arquivo no storage local
- enviar o conteúdo binário como resposta

Respostas de erro:
- 404 Not Found: documento inexistente
- 400 Bad Request: id inválido
- 500 Internal Server Error: falha ao ler o arquivo

## 7. Decisões arquiteturais

### Backend

- Estrutura em Clean Architecture simples:
  - routes: definição dos endpoints
  - controllers: recebimento e resposta HTTP
  - services: regras de negócio
  - repositories: operação de persistência e acesso ao filesystem
- Fluxo de dependência: routes -> controllers -> services -> repositories
- Os metadados do documento devem ser armazenados em memória, sem banco de dados
- O armazenamento físico dos arquivos deve ocorrer em backend/storage usando multer com diskStorage

### Frontend

- Aplicação com React + Vite
- Componentes funcionais com hooks
- Organização por componentes, páginas e serviços
- Comunicação com o backend via fetch usando prefixo /api

### Segurança e restrições

- Nenhum provedor externo de arquivos deve ser usado
- O sistema deve validar o arquivo recebido antes de salvar
- O download deve garantir que o arquivo solicitado corresponda ao id cadastrado e que o caminho local seja controlado
- Não deve haver versionamento, snapshot ou gestão de histórico nesta fase

## 8. Plano de execução

Importante: este plano é de planejamento e especificação, não inclui a execução dos arquivos do backend e do frontend como código funcional.

### Etapa 1 — Definição da visão e do escopo

- Confirmar o objetivo do sistema
- Validar a lista de funcionalidades essenciais
- Definir o que fica dentro e fora do escopo

Critérios de aceite:
- O objetivo está claro e alinhado ao projeto
- Escopo e limites são documentados
- Não há itens fora do propósito do DMS no planejamento

### Etapa 2 — Modelagem dos metadados do documento

- Definir os campos do documento
- Validar as regras básicas de unicidade e uso
- Definir o formato da data de upload

Critérios de aceite:
- O modelo contém id, originalName, size, uploadedAt e owner
- O armazenamento local e o metadado em memória estão alinhados com a restrição do projeto

### Etapa 3 — Definição dos contratos de API

- Formalizar os endpoints da aplicação
- Definir payloads de entrada e saídas esperadas
- Especificar erros básicos de negócio e HTTP

Critérios de aceite:
- Há contrato para upload, listagem e download
- Os casos de sucesso e falha ficam documentados

### Etapa 4 — Definição da arquitetura de software

- Estabelecer a separação em routes, controllers, services e repositories
- Definir o papel de cada camada
- Mapear o fluxo de dependência e responsabilidades

Critérios de aceite:
- A arquitetura respeita a Clean Architecture simples
- O armazenamento local é tratado no repositório ou camada de persistência
- O backend e o frontend ficam claramente separados

### Etapa 5 — Planejamento do armazenamento local

- Definir a pasta backend/storage como destino dos uploads
- Validar uso de multer com diskStorage
- Definir como o sistema relaciona o arquivo salvo ao metadado no registro

Critérios de aceite:
- O fluxo de arquivo e metadado está coerente
- Há previsibilidade para upload e download local
- Não há uso de serviços externos

### Etapa 6 — Planejamento da integração com o frontend

- Definir os fluxos de upload, listagem e download no cliente
- Especificar estados de carregamento, sucesso e erro
- Validar uso do endpoint com prefixo /api

Critérios de aceite:
- O frontend entende a API do backend
- Há uma visão clara das interações do usuário
- A comunicação fica restrita ao fluxo de dados necessário

### Etapa 7 — Definição de testes de aceite

- Planejar testes para upload bem-sucedido
- Planejar testes para listagem de documentos
- Planejar testes para download do arquivo
- Planejar testes para erros de arquivo ausente, documento inexistente e falha de leitura

Critérios de aceite:
- Há cobertura dos cenários principais
- Os casos negativos ficam previstos antes da implementação
- Os critérios de aceitação do sistema são claros

### Etapa 8 — Validação de entrega

- Revisar a consistência entre requisitos, modelo de dados, API e arquitetura
- Confirmar que a solução respeita a restrição de armazenamento local
- Confirmar que o restante da implementação pode seguir de forma incremental

Critérios de aceite:
- A especificação completa está consistente
- A fase seguinte pode avançar para a implementação com baixo risco de retrabalho
- Nenhuma parte do plano exige armazenamento em nuvem ou persistência externa

## 9. Resumo executivo

Este sistema é uma solução mínima, porém completa para gestão de documentos em uma aplicação web com backend em Node.js + Express e frontend em React + Vite. A exigência principal é manter arquivos no filesystem local da aplicação, via multer e diskStorage, enquanto os metadados ficam em memória. O design proposto é simples, incremental e aderente à Clean Architecture: routes, controllers, services e repositories, com foco em upload, listagem e download como funcionalidades centrais.

# 💳 Payments API

Uma API robusta para processamento de pagamentos, construída com [NestJS](https://nestjs.com/) seguindo os princípios de **DDD (Domain-Driven Design)**, utilizando [TypeORM](https://typeorm.io/) para persistência.

## ✨ Features

- Processamento de pagamentos com validações de domínio
- Arquitetura escalável baseada em DDD
- Camada de aplicação desacoplada do domínio
- Repositórios e serviços orientados a contratos
- Suporte a múltiplos métodos de pagamento
- Integração com gateways externos (mockados ou reais)
- Banco de dados relacional (PostgreSQL recomendado)
- Validação com `class-validator` e `DTOs` claros

🚀 Instalação

Pré-requisitos
	•	Node.js (v18+)
	•	PostgreSQL
	•	Yarn ou npm

Passos

### 1. Clone o projeto
git clone https://github.com/d4vz/nestjs-payments-api.git
cd nestjs-payments-api

### 2. Instale as dependências
yarn

### 3. Configure o .env
cp .env.example .env
#### Edite as variáveis de banco, porta, etc.

### 4. Rode as migrations
yarn typeorm migration:run

### 5. Inicie o servidor
yarn start:dev

⸻

🧪 Testes

# Testes unitários
yarn test

# Testes e2e (end-to-end)
yarn test:e2e

⸻

⚙️ Tecnologias
	•	NestJS - Framework principal
	•	TypeORM - ORM com suporte ao PostgreSQL
	•	PostgreSQL - Banco de dados relacional
	•	class-validator - Validação de entrada
	•	dotenv - Configuração de ambiente

⸻

📌 TODO
	•	Suporte a múltiplos gateways (ex: Stripe, MercadoPago)
	•	Filas para processamento assíncrono
	•	Webhooks para notificações de status
	•	Observabilidade (logs, tracing, metrics)
	•	Auth (JWT ou OAuth2)

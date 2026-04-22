# SIFU - Sistema Integrado Funcional e Unificado

Sistema para gestão da Biblioteca UFERSA com front-end e back-end separados.

## Estrutura do Repositório

```
projeto/
├── front-end/    # Interface do usuário (HTML, CSS, JS)
└── back-end/     # API e lógica do servidor (Node.js)
```

## Como Rodar

### Branch main

```bash
cd back-end
npm install
npm run dev
```
Servidor disponível em http://localhost:3000

### Branch Rodar_Serverless_local

```bash
cd back-end
npm install

# Opção 1: Apenas servidor Node.js
npm run dev

# Opção 2: Serverless Offline (sem DynamoDB local)
npm run offline

# Opção 3: Serverless Offline com DynamoDB Local
npm run dev:offline
```

## Tecnologias

- **Front-end:** HTML5, Tailwind CSS, JavaScript Vanilla
- **Back-end:** Node.js, Express, SQLite/DynamoDB
- **Infraestrutura:** AWS Lambda, Serverless Framework
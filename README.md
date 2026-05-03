# SIFU - Sistema Integrado Funcional e Unificado

Sistema para gestão da Biblioteca UFERSA com front-end e back-end separados.

## Estrutura do Repositório

```
projeto/
├── front-end/    # Interface do usuário (HTML, CSS, JS)
└── back-end/     # API e lógica do servidor (Node.js)
```

## Módulos do Sistema

- **Gestão de Salas** - Cadastro e gerenciamento de salas de estudo
- **Reservas e Empréstimos** - Sistema de reservas de salas e materiais
- **Inventário** - Controle de materiais da biblioteca
- **Ocorrências** - Registro e acompanhamento de ocorrências
- **Painel Institucional** - Dashboard com métricas e relatórios
- **IA Relatórios** - Geração de relatórios inteligentes

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

## Repositórios

- **Origin**: https://github.com/RuanUfersa/-web-2026-1-robsonruans
- **Origin2**: https://github.com/RuanUfersa/-web-2026-1-robsonruan
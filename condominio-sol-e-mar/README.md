# Condomínio Sol e Mar

Estrutura gerada automaticamente: frontend (React + Vite + TS) e backend (Node + Express + Prisma).

Veja subpastas `frontend` e `backend` para instruções de instalação e execução.

## Resumo dos comandos

Na raiz do projeto existem duas aplicações separadas.

Frontend:

```bash
cd condominio-sol-e-mar/frontend
npm install
npm run dev
```

Backend:

```bash
cd condominio-sol-e-mar/backend
npm install
cp .env.example .env
# configure DATABASE_URL e JWT_SECRET
npm run dev
```

Para semear usuários iniciais (admin e síndico):

```bash
cd condominio-sol-e-mar/backend
npm run seed
```


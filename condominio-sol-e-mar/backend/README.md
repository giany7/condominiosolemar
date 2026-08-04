# Backend — Condomínio Sol e Mar

Passos para rodar o backend localmente

1. Instalar dependências

```bash
cd backend
npm install
```

2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e ajuste `DATABASE_URL`, `JWT_SECRET` e `SMTP_*` para envio de e-mail.

3. Gerar Prisma Client e aplicar migrações

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Rodar seed (cria Admin e Síndico)

```bash
npm run seed
```

5. Rodar em modo dev

```bash
npm run dev
```

Endpoints principais

- `GET /api/health` — status
- `POST /api/auth/register` — registrar usuário
- `POST /api/auth/login` — autenticar
- `GET /api/users` — listar usuários (ADMIN)
- `POST /api/reclamacoes` — criar reclamação (pública)

*** End Patch
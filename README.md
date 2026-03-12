# FLN Transfer - Sistema de Gestão de Transfers

Sistema web para gestão de transfers/viagens privativas turísticas em Florianópolis.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **PWA:** next-pwa
- **Gráficos:** Recharts
- **Calendário:** react-big-calendar
- **Exportação:** jsPDF + SheetJS (xlsx)

## Começando

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha com suas credenciais do Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

### 3. Configurar banco de dados

Execute as migrations no Supabase SQL Editor ou via CLI:

```bash
supabase db push
```

Opcionalmente, execute `supabase/seed.sql` para dados de exemplo.

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/     # Login
│   ├── admin/            # Área administrativa
│   │   ├── dashboard/    # Dashboard com gráficos
│   │   ├── calendar/     # Calendário de corridas
│   │   ├── rides/        # CRUD de corridas
│   │   ├── clients/      # Clientes
│   │   ├── agencies/     # Agências
│   │   ├── drivers/      # Motoristas
│   │   ├── reports/      # Relatórios com exportação PDF/Excel
│   │   └── nf/           # Notas Fiscais
│   ├── driver/           # Área do motorista (PWA)
│   └── api/              # API Routes
├── components/
│   ├── shared/           # Sidebar, Header, CurrencySelector
│   └── ui/               # shadcn/ui
├── lib/
│   ├── supabase/         # Clients Supabase
│   ├── formatters.ts     # Formatação
│   ├── types.ts          # Interfaces
│   └── utils.ts          # Utilitários
└── middleware.ts          # Proteção de rotas por role
```

## Deploy

```bash
vercel
```

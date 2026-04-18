# Pak in Melb Quote Frontend

这是一个面向墨尔本接机/落地协助场景的轻量前台站点，基于 `Next.js + TypeScript + Tailwind CSS`。

当前仓库聚焦三件事：

- `/quote`：公开报价与留资
- `/contact`：公开联系与人工确认
- `/admin`：静态管理入口，配合可选 Supabase Edge Function 做最小 leads 管理

仓库不扩展成完整 CRM、支付系统、多角色后台或 VM 常驻 Node 服务。

## 当前部署模型

- Next.js 使用 `output: "export"` 导出静态站点到 `out/`
- VM 只负责托管静态文件
- 公开表单直接用 Supabase anon key 写入 `public.leads`
- service-role key 只保留给可选的 `supabase/functions/leads-admin`

## 本地开发

```bash
npm install
npm run dev
```

默认地址：

```bash
http://localhost:3000
```

## 本地构建与静态预览

```bash
npm run build
npm run start
```

其中：

- `npm run build` 生成静态产物到 `out/`
- `npm run start` 用 Python 在本地预览 `out/`

## 环境变量

先复制：

```bash
cp .env.example .env.local
```

### 前端公开变量

- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_LEADS_TABLE`
- `NEXT_PUBLIC_LEADS_ADMIN_URL`

### 仅服务端 / Edge Function 使用

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_LEADS_TABLE`
- `ADMIN_BEARER_TOKEN`
- `LEADS_ADMIN_ALLOWED_ORIGINS`

## Supabase

现有 migrations：

- `supabase/migrations/20260418_create_leads.sql`
- `supabase/migrations/20260419_public_lead_insert_rls.sql`

其中第二个 migration 用于：

- 开启 `public.leads` 的 RLS
- 仅允许匿名 insert
- 禁止匿名读取、更新、删除

可选管理员接口：

- `supabase/functions/leads-admin/index.ts`

## 静态部署

推荐先在本地构建静态产物：

```bash
./scripts/deploy-manager-vm.sh
```

这个脚本会把静态 `out/` 直接部署到 `manager-vm` 的静态目录，并在切换前做一次 VM 内部短暂静态预览验证。它不会在 VM 上执行 `npm ci`，也不会恢复 `next start`。

完整部署说明见：

- [docs/Stage3-AlwaysOn-Deploy.md](docs/Stage3-AlwaysOn-Deploy.md)

## 质量检查

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run check`

## 主要目录

```text
src/
  app/
  components/
  config/
  data/
  lib/
supabase/
  functions/
  migrations/
tests/
scripts/
```

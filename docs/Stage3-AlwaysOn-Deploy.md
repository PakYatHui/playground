# 段三补充收口：静态托管 + Supabase 写库

本次把段三部署路线切到“静态站点 + Supabase 数据采集”，不再让 Azure VM 承担
`npm ci`、`next build` 或 `next start`。

## 最小架构

- `/`、`/quote`、`/contact`、`/admin`、`/health` 全部由 Next.js 静态导出到 `out/`
- 开启 `trailingSlash: true`，避免在普通静态服务器上访问无扩展名路由时出现 404
- VM 继续只做静态文件托管，不新增常驻 Node 服务
- 公开表单直接从浏览器调用 Supabase REST API，把 lead 写入 `public.leads`
- 前端优先使用 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，并兼容旧的 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` 只留给可选的 `supabase/functions/leads-admin`
- `/admin` 页面本身仍是静态页；要启用真实查询/更新/CSV 导出时，再部署 Edge Function

## 数据流

### 公开写入

1. 用户在 `/quote` 或 `/contact` 填表
2. 前端复用 `src/lib/leads/validation.ts` 和 `src/lib/leads/mappers.ts`
3. 浏览器生成 `lead_id`
4. 浏览器用 anon key POST 到：
   `https://<project>.supabase.co/rest/v1/leads`
5. RLS 只允许 `anon` 执行最小 insert，不允许 select/update/delete

### 管理读取

1. `/admin` 静态页面读取 `NEXT_PUBLIC_LEADS_ADMIN_URL`
2. 浏览器把手工输入的 `ADMIN_BEARER_TOKEN` 发给 `leads-admin` Edge Function
3. Edge Function 用 `SUPABASE_SERVICE_ROLE_KEY` 查询、更新和导出 CSV

## 必要环境变量

### 前端静态站点

- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`（旧配置兼容，可保留）
- `NEXT_PUBLIC_SUPABASE_LEADS_TABLE=leads`
- `NEXT_PUBLIC_LEADS_ADMIN_URL`

### Supabase Edge Function

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_LEADS_TABLE=leads`
- `ADMIN_BEARER_TOKEN`
- `LEADS_ADMIN_ALLOWED_ORIGINS`

## Supabase 变更

### 现有表结构

- `supabase/migrations/20260418_create_leads.sql`

### 新增 RLS migration

- `supabase/migrations/20260419_public_lead_insert_rls.sql`

它做了这些限制：

- 开启 `public.leads` 的 RLS
- 仅给 `anon` 开放 `insert`
- 禁止匿名读取、更新、删除
- 限制公开写入只能创建 `status='new'`
- 限制 `internal_notes=''`
- 限制 `inputs.source` 只能是 `quote` 或 `contact`

## 部署命令

### 1. 本地构建静态产物

```bash
npm ci
npm run build
```

构建结果在：

```bash
out/
```

### 2. 直接部署静态产物到 VM

```bash
./scripts/deploy-manager-vm.sh
```

这个脚本会：

- 本地执行 `npm ci` 和 `npm run build`
- 打包 `out/` 为静态压缩包
- 通过 Azure Run Command 分块发送静态压缩包到 `manager-vm`
- 在 VM 上先用短暂的 Python 静态预览验证 `/quote`、`/contact`、`/health`
- 验证通过后把 `/srv/manager-site` 原子切到新的 release
- 重启现有静态服务 `manager-site.service`

它不会：

- 在 VM 上执行 `npm ci`
- 在 VM 上执行 `next start`
- 引入新的常驻 Node 运行时

如果正式域名还没有指向 VM tunnel，可在本地额外传入：

```bash
ROUTE_DOMAIN_TO_VM=1 VM_TUNNEL_ID=<your-vm-tunnel-id> ./scripts/deploy-manager-vm.sh
```

### 3. 应用 Supabase migration

```bash
npx supabase db push
```

如果当前环境没有 Supabase 登录态，也可以直接在 Supabase SQL Editor 执行：

- `supabase/migrations/20260418_create_leads.sql`
- `supabase/migrations/20260419_public_lead_insert_rls.sql`

### 4. 可选：部署管理员 Edge Function

```bash
npx supabase functions deploy leads-admin
```

然后在 Supabase 项目里配置：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_LEADS_TABLE`
- `ADMIN_BEARER_TOKEN`
- `LEADS_ADMIN_ALLOWED_ORIGINS`

## 当前修改文件

- `src/lib/leads/client.ts`
- `src/lib/leads/public-env.ts`
- `src/lib/leads/admin-client.ts`
- `src/components/AdminRecordsPanel.tsx`
- `src/app/admin/page.tsx`
- `src/app/health/page.tsx`
- `next.config.ts`
- `package.json`
- `.env.example`
- `supabase/migrations/20260419_public_lead_insert_rls.sql`
- `supabase/functions/leads-admin/index.ts`
- `scripts/deploy-manager-vm.sh`

## 验证建议

- 静态页面：`/`、`/quote`、`/contact`、`/admin`、`/health`
- 报价页提交后，Supabase `leads` 表新增一条 `source=quote`
- 联系页提交后，Supabase `leads` 表新增一条 `source=contact`
- 未配置 `NEXT_PUBLIC_LEADS_ADMIN_URL` 时，`/admin` 显示“未启用管理员接口”
- 部署 Edge Function 后，`/admin` 可以读取、更新、导出 CSV

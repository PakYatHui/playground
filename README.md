# Pak in Melb Quote Frontend

这是一个面向单人维护的轻量前台报价平台，基于 `Next.js + TypeScript + App Router`。

当前仓库状态不是脚手架，也不是完整后台系统，而是已经完成段二的公开前台报价器：

- 首页用于展示服务定位、边界和联系入口
- `/quote` 提供 3 步询价表单、规则驱动报价、结果卡片和可复制摘要
- `/contact` 提供独立留资入口
- `/admin` 提供 Bearer token 保护的最小 leads 查询、状态更新和 CSV 导出

本仓库明确不做支付、真实鉴权、CRM、派单或完整运营后台。段三第一部分只冻结最小存储路线与 leads 数据模型，尚未把真实写库流程接入页面。

## 本地启动

```bash
npm install
npm run dev
```

默认访问：

```bash
http://localhost:3000
```

## 构建方式

```bash
npm run build
npm run start
```

## 当前常在线部署

- 段三补充收口默认复用现有 Azure VM `manager-vm`
- VM 上运行整套 Next.js 站点，用于保证 `/quote`、`/contact` 和 `POST /api/leads` 在本机关机后仍可用
- `/admin` 仍保留在同一站点里，但这次不作为长期在线目标扩展范围
- 复用脚本：`scripts/deploy-manager-vm.sh`

## 质量门禁

- ESLint：`npm run lint`
- Prettier：`npm run format`
- 测试入口：`npm run test`
- 一键检查：`npm run check`

## 目录结构

```text
repo/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── contact/
│   │   ├── privacy/
│   │   ├── quote/
│   │   ├── terms/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── checklist.tsx
│   │   ├── page-card.tsx
│   │   └── site-shell.tsx
│   ├── config/
│   │   ├── pricing.ts
│   │   └── quote-rules.ts
│   └── lib/
│       └── quote-engine/
│           ├── index.ts
│           └── types.ts
├── tests/
│   └── quote-engine.test.ts
├── .env.example
├── .eslintrc.json
├── .prettierignore
├── .prettierrc.json
├── package.json
└── tsconfig.json
```

## 页面路由

- `/`
- `/quote`
- `/contact`
- `/admin`
- `/privacy`
- `/terms`

所有页面都通过统一头部导航和底部链接互相可达；仓库中不再保留 `/ops`、`/dashboard` 一类旧后台页面。

## 环境变量说明

复制示例文件后按需修改：

```bash
cp .env.example .env.local
```

变量说明：

- `NEXT_PUBLIC_SITE_NAME`：站点名称
- `NEXT_PUBLIC_SITE_URL`：本地或部署地址，用于 metadata 和站点链接
- `CONTACT_EMAIL`：联系邮箱
- `PORT`：本地运行端口
- `SUPABASE_URL`：Supabase 项目地址，供服务端 leads API 访问使用
- `SUPABASE_SERVICE_ROLE_KEY`：Supabase 服务端密钥，只能放在服务端环境变量
- `SUPABASE_LEADS_TABLE`：leads 表名，默认 `leads`
- `ADMIN_BEARER_TOKEN`：管理 API Bearer token，只能放在服务端环境变量

## 当前实现重点

- 规则配置集中在 `src/config/quote-rules.ts`
- 报价计算、校验和公开解释集中在 `src/lib/quote-engine`
- 报价结果卡片与复制摘要逻辑集中在 `src/lib/quote-presenter.ts`
- 前端最小安全基线在 `next.config.ts` 和 [docs/Security-Baseline.md](docs/Security-Baseline.md)
- CI 只围绕当前前端报价主线执行 `npm ci`、`npm run lint`、`npm test`、`npm run build`

## 阶段状态

- 段一：已完成最小展示、询价、留资和本地记录闭环
- 段二：已完成分步询价、配置驱动规则引擎、可解释校验、结果卡片、复制摘要、安全头、测试与 CI
- 段三第一部分：已冻结边界、选定 `Supabase / Postgres + Next route handler` 路线，并建立最小 `leads` 数据模型
- 段三第二部分：已接入最小后端 API，包括公开写入、Bearer token 管理查询/更新、CSV 导出和 health check
- 段三后续部分：尚未开始，本仓库当前不应被描述为完整后台产品

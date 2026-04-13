# Melbourne Quote Kit

这是一个面向单人维护的 `Next.js + TypeScript + App Router` 项目脚手架。

当前阶段只完成前端工程初始化、基础页面占位、规则配置目录、quote engine 测试入口和统一导航结构，不包含数据库、登录、支付或复杂业务流程。

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

## 开发规范

- ESLint：`npm run lint`
- Prettier：`npm run format`
- 测试入口：`npm run test`

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
│       ├── calculateEstimate.ts
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

所有页面都通过统一头部导航和底部链接互相可达。

## 环境变量说明

复制示例文件后按需修改：

```bash
cp .env.example .env.local
```

变量说明：

- `NEXT_PUBLIC_SITE_NAME`：站点名称，占位文案和后续品牌展示可复用
- `NEXT_PUBLIC_SITE_URL`：本地或部署地址，用于后续 metadata / 轻后端回调配置
- `CONTACT_EMAIL`：联系邮箱占位
- `PORT`：本地运行端口

## 后续扩展建议

- 报价规则继续放在 `src/config`
- 报价计算与判定逻辑继续收敛到 `src/lib/quote-engine`
- 若后续接轻后端，可在 `src/app/api` 或独立服务中扩展，而不破坏当前页面层

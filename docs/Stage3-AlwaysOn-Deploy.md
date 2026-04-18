# 段三补充收口：前台常在线部署

本次仍然属于段三补充收口，不扩成完整后台迁移。

## 目标

- 让 `/quote` 在本机关机后继续可访问
- 让 `/contact` 在本机关机后继续可访问
- 继续复用现有 `POST /api/leads -> Supabase` 写库链路
- `/admin` 保持极简入口，不新增后台产品范围

## 选择的最小方案

选择把当前整套 Next.js 站点部署到现有 Azure VM `manager-vm`。

原因：

- `/quote`、`/contact` 依赖同站点内的 `/api/leads`
- 如果只迁两个页面，反而要额外拆 API、处理跨域和新增维护面
- 当前环境已经有可复用的 VM、Cloudflare tunnel 和管理脚本

## 部署结果要求

- VM 本地 `127.0.0.1:3000` 返回 Next.js 站点
- Cloudflare 正式域名继续使用 `https://manager.pakagent.dpdns.org`
- 正式域名切回 VM tunnel，而不是继续指向本机 tunnel
- `POST /api/leads` 继续使用现有环境变量写入当前 Supabase

## 运维脚本

使用 `scripts/deploy-manager-vm.sh`：

- 读取本机已有 `manager-site.env`
- 通过 Azure run-command 在 VM 上安装最小 Node 运行环境
- 拉取指定 Git 提交并执行 `npm ci`、`npm run build`
- 重写 `manager-site.service` 为 Next.js 服务
- 重启 VM 上的 `manager-site.service` 与 `cloudflared-manager.service`
- 在本机用 Cloudflare tunnel 命令把正式域名路由到 VM tunnel

## 明确不做

- 不重做 Supabase 接入
- 不重建 `leads` 表
- 不加支付、CRM、多角色、派单、完整登录
- 不把 `/admin` 扩成完整后台

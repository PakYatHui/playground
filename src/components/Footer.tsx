import { navigationItems, siteMeta } from "@/src/data/siteContent";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-ink">{siteMeta.brandName}</p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
            墨尔本落地陪同 / 地陪服务公开营销网站原型。当前版本用于展示服务框架、品牌语气与预算估算交互，不代表最终商业信息。
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-slate-500">
          {navigationItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

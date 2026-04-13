import { PageCard } from "@/components/page-card";

export default function TermsPage() {
  return (
    <PageCard
      title="取消与服务说明"
      description="这份说明用于帮助你理解当前 MVP 版本的询价、确认、取消与变更方式。文字尽量直白，方便真实对外使用。"
    >
      <div className="space-y-8 text-sm leading-7 text-stone-700 sm:text-base">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">关于询价和报价</h2>
          <p className="m-0">
            站点当前提供的是服务介绍、询价收集和人工确认入口。你在页面中看到的说明、区间报价、示例价格或系统判断结果，主要用于帮助快速判断需求类型和准备沟通，不代表最终成交，也不构成最终报价承诺。
          </p>
          <p className="m-0">
            最终是否承接、采用哪一种服务形式、实际执行范围以及最终价格，仍要结合具体日期、时段、路线、等待时间、事项复杂度和临时变更，由人工确认后再定。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">我会处理哪些信息</h2>
          <p className="m-0">
            为了回应询价和安排服务，我会处理你提交或沟通中提供的基本信息，例如称呼、联系方式、时间地点、人数、行李情况、用途说明、陪同或入住协助需求，以及与报价和执行直接相关的备注。
          </p>
          <p className="m-0">
            这些信息只会用于沟通、判断可接性、整理需求、安排服务与处理取消或变更，不会因为你发起一次询价，就自动变成长期营销名单。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">取消或变更怎么处理</h2>
          <p className="m-0">
            如果你需要取消、改时间、改地点或调整需求，请尽量尽早联系我。越早说明，越容易重新安排，也越容易判断是否还能按原方向继续服务。
          </p>
          <p className="m-0">
            如果只是轻微调整，例如联系人补充、到达时间小幅变动、地址细化，我通常会先按新信息重新评估；如果已经变成不同路线、不同时间段、等待明显增加、事项数量增加或工作强度变化，报价和服务形式也可能随之调整。
          </p>
          <p className="m-0">
            如果我已经为该时段做了明确预留、临近执行才取消，或变更已经明显超出原询价范围，我会在重新确认时把新的安排方式和可能影响直接说清楚，而不是默认沿用原判断。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">信息保存与删除</h2>
          <p className="m-0">
            询价和沟通记录会以当前轻量运营所需的方式保存，用于回看需求、处理后续沟通、确认变更和保留必要的业务上下文。当前版本不提供复杂账户系统，也没有自助删除面板。
          </p>
          <p className="m-0">
            如果你希望修改或删除已提供的信息，可以直接通过原联系渠道告诉我。我会在合理范围内更新或清理相关记录；如遇到仍需保留的最小必要内容，也会以继续处理该次事项所必需的范围为限。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">当前版本的服务边界</h2>
          <p className="m-0">
            这是一个单人维护的轻量平台，目标是把询价、判断和人工确认流程整理清楚，而不是提供企业级平台式承诺。当前页面不会扩展到支付条款，也不承诺覆盖所有临时情况。
          </p>
          <p className="m-0">
            如果出现超出当前公开范围的需求，我会尽量明确说明能否继续处理、需要补充什么信息，以及是否需要改为单独确认，而不是让你在模糊状态下继续往下走。
          </p>
        </section>
      </div>
    </PageCard>
  );
}

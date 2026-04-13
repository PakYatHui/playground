import { PageCard } from "@/components/page-card";

export default function PrivacyPage() {
  return (
    <PageCard
      title="隐私说明"
      description="这是一份面向当前 MVP 版本的简明隐私说明。它对应的是一个单人维护、以询价和人工确认服务为主的轻量平台，不做超出当前阶段的承诺。"
    >
      <div className="space-y-8 text-sm leading-7 text-stone-700 sm:text-base">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">我会收集哪些信息</h2>
          <p className="m-0">
            当你提交询价、联系我或沟通行程时，我通常会收到这些信息：姓名或称呼、联系方式、服务日期和时间、接送或出发地点、
            目的地、人数、行李情况、是否需要入住协助或陪同、你主动提供的备注，以及沟通过程中与报价和安排行程直接相关的信息。
          </p>
          <p className="m-0">
            当前站点不以复杂账号体系为前提，也不以大规模自动化跟踪为目的。现阶段主要是你主动填写或主动发给我的信息。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">这些信息会用来做什么</h2>
          <p className="m-0">
            这些信息主要用于判断服务是否适合承接、整理需求、人工沟通细节、给出初步报价区间、安排档期，以及在你确认继续推进时完成后续服务准备。
          </p>
          <p className="m-0">
            页面上的价格、区间或系统输出，现阶段都应理解为询价参考和人工整理依据，不代表最终成交，也不构成最终报价承诺。最终是否接单、如何执行、
            最终价格和范围，仍以双方后续确认的实际行程与服务内容为准。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">信息如何保存</h2>
          <p className="m-0">
            询价信息通常会保存在我日常使用的沟通记录、站点后台记录或本地工作资料中，保存方式以便于跟进你的询价和处理后续变更为主，不会为了当前业务之外的用途长期堆积。
          </p>
          <p className="m-0">
            我会尽量只保留完成询价、沟通和服务所需要的信息，并采取常规、合理的方式避免无关人员随意接触这些资料。但这不是企业级托管系统，当前版本也不提供复杂的账户控制、
            自助导出或自助删除功能。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">如何修改或删除信息</h2>
          <p className="m-0">
            如果你希望我更正、补充、删除你此前提供的信息，或不希望我继续保留某次询价记录，可以直接通过你原先联系我的方式再次联系我说明。我会在看到后按实际情况处理，并尽量在合理范围内同步更新相关记录。
          </p>
          <p className="m-0">
            如果某些信息已经进入正在进行中的服务安排、对账或必要留存记录，我可能需要保留其中一部分，但会尽量只保留继续处理该事项所必需的内容。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-stone-900">取消、变更与信息处理</h2>
          <p className="m-0">
            如果询价后没有继续推进，相关信息通常只会保留一段合理时间，供我回看沟通背景或回应后续追问，之后会按需要清理。若你已经预约服务，行程取消或变更时，我会继续使用你已提供的信息来处理改期、
            沟通可行性、重新评估报价，或确认该次服务结束。
          </p>
          <p className="m-0">
            如无继续跟进的必要，我会倾向于减少保留范围，而不是无限期保存。
          </p>
        </section>
      </div>
    </PageCard>
  );
}

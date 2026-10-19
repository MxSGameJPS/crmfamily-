import { Checkout } from "@/components/POS/Checkout/checkout";
import { SessionControls } from "@/components/POS/SessionControls/sessionControls";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";
import styles from "./caixa.module.css";

type Preselection = {
  sourceType: "pet_appointment" | "service_order";
  sourceId: string;
};

export default async function CashierPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceType?: string; sourceId?: string }>;
}) {
  const params = await searchParams;
  let preselect: Preselection | null = null;

  if (params.sourceId && params.sourceType === "pet_appointment") {
    preselect = { sourceType: "pet_appointment", sourceId: params.sourceId };
  } else if (params.sourceId && params.sourceType === "service_order") {
    preselect = { sourceType: "service_order", sourceId: params.sourceId };
  }

  const { auth, supabase, selectedCompany } = await getPosHubContext();
  const service = createPosService(supabase, auth, selectedCompany.id);
  const data = await service.loadHome(preselect);

  return (
    <div className={styles.page}>
      <SessionControls session={data.session} companyId={selectedCompany.id} />
      {data.session ? (
        <Checkout
          catalog={data.catalog}
          customers={data.customers}
          sessionId={data.session.id}
          companyId={selectedCompany.id}
          preselectedItem={data.preselectedItem}
        />
      ) : (
        <section className={styles.lockedNotice}>
          <strong>PDV protegido</strong>
          <span>A venda rápida ficará disponível assim que o operador abrir o caixa desta empresa.</span>
        </section>
      )}
    </div>
  );
}

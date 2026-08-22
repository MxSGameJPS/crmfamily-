import { Checkout } from "@/components/POS/Checkout/checkout";
import { SessionControls } from "@/components/POS/SessionControls/sessionControls";
import { requireCashierUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createPosService } from "@/modules/pos/pos.service";
import styles from "./caixa.module.css";

export default async function CashierPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceType?: string; sourceId?: string }>;
}) {
  const auth = await requireCashierUser();
  const params = await searchParams;
  const sourceType = params.sourceType === "pet_appointment" || params.sourceType === "service_order" ? params.sourceType : null;
  const preselect = sourceType && params.sourceId ? { sourceType, sourceId: params.sourceId } : null;
  const supabase = await createClient();
  const service = createPosService(supabase, auth);
  const data = await service.loadHome(preselect);

  return (
    <div className={styles.page}>
      <SessionControls session={data.session} />
      {data.session ? (
        <Checkout
          catalog={data.catalog}
          customers={data.customers}
          sessionId={data.session.id}
          preselectedItem={data.preselectedItem}
        />
      ) : (
        <section className={styles.lockedNotice}>
          <strong>PDV protegido</strong>
          <span>A venda rápida ficará disponível assim que o operador abrir o caixa.</span>
        </section>
      )}
    </div>
  );
}

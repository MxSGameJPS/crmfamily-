import { History } from "@/components/POS/History/history";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";

export default async function CashierHistoryPage() {
  const { auth, supabase, selectedCompany } = await getPosHubContext();
  const service = createPosService(supabase, auth, selectedCompany.id);
  const data = await service.loadHistory();
  return <History sales={data.sales} session={data.session} companyId={selectedCompany.id} />;
}

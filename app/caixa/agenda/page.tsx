import { Agenda } from "@/components/POS/Agenda/agenda";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";

export default async function CashierAgendaPage() {
  const { auth, supabase, selectedCompany } = await getPosHubContext();
  const service = createPosService(supabase, auth, selectedCompany.id);
  const data = await service.loadAgenda();
  return <Agenda brandKey={data.brandKey} brandName={data.brandName} items={data.items} />;
}

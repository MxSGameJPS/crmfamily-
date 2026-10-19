import { Receipt } from "@/components/POS/Receipt/receipt";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";

export const dynamic = "force-dynamic";

export default async function CashierReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { auth, supabase, selectedCompany } = await getPosHubContext(query.companyId ?? null);
  const service = createPosService(supabase, auth, selectedCompany.id);
  const receipt = await service.loadReceipt(id);
  return <Receipt receipt={receipt} />;
}

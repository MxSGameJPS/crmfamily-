import { ReceiptDecision } from "@/components/POS/ReceiptDecision/receiptDecision";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";

export const dynamic = "force-dynamic";

export default async function CashierReceiptDecisionPage({
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

  return <ReceiptDecision receipt={receipt} />;
}

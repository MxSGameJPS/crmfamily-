import { NextResponse } from "next/server";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";
import { parseCancelSalePayload } from "@/modules/pos/pos.validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = await request.json() as Record<string, unknown>;
    const input = parseCancelSalePayload(payload);
    const preferredCompanyId = typeof payload.companyId === "string" ? payload.companyId : null;
    const { auth, supabase, selectedCompany } = await getPosHubContext(preferredCompanyId);
    const service = createPosService(supabase, auth, selectedCompany.id);
    await service.cancelSale(id, input.reason, input.refundSessionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro inesperado." }, { status: 400 });
  }
}

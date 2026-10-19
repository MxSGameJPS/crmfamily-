import { NextResponse } from "next/server";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";
import { parseCancelSalePayload } from "@/modules/pos/pos.validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = parseCancelSalePayload(await request.json());
    const { auth, supabase, selectedCompany } = await getPosHubContext();
    const service = createPosService(supabase, auth, selectedCompany.id);
    await service.cancelSale(id, input.reason, input.refundSessionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro inesperado." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";
import { parseCashMovementPayload } from "@/modules/pos/pos.validation";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const input = parseCashMovementPayload(payload);
    const preferredCompanyId = typeof payload.companyId === "string" ? payload.companyId : null;
    const { auth, supabase, selectedCompany } = await getPosHubContext(preferredCompanyId);
    const service = createPosService(supabase, auth, selectedCompany.id);
    const movementId = await service.addMovement(input.sessionId, input.movementType, input.amount, input.description);
    return NextResponse.json({ movementId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro inesperado." }, { status: 400 });
  }
}

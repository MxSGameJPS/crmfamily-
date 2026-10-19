import { NextResponse } from "next/server";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";
import { parseCashMovementPayload } from "@/modules/pos/pos.validation";

export async function POST(request: Request) {
  try {
    const input = parseCashMovementPayload(await request.json());
    const { auth, supabase, selectedCompany } = await getPosHubContext();
    const service = createPosService(supabase, auth, selectedCompany.id);
    const movementId = await service.addMovement(input.sessionId, input.movementType, input.amount, input.description);
    return NextResponse.json({ movementId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro inesperado." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";
import { parseSessionPayload } from "@/modules/pos/pos.validation";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const input = parseSessionPayload(payload);
    const preferredCompanyId = typeof payload.companyId === "string" ? payload.companyId : null;
    const { auth, supabase, selectedCompany } = await getPosHubContext(preferredCompanyId);
    const service = createPosService(supabase, auth, selectedCompany.id);

    if (input.action === "open") {
      const sessionId = await service.openSession(input.openingAmount, input.notes);
      return NextResponse.json({ sessionId });
    }

    const summary = await service.closeSession(input.sessionId, input.closingAmount, input.notes);
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro inesperado." }, { status: 400 });
  }
}

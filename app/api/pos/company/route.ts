import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPosHubContext, POS_COMPANY_COOKIE } from "@/lib/pos-hub";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { companyId?: unknown };
    const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
    if (!companyId) {
      return NextResponse.json({ error: "Empresa não informada." }, { status: 400 });
    }

    const context = await getPosHubContext();

    if (!context.hubEnabled) {
      return NextResponse.json({ error: "Este operador não possui acesso ao PDV central." }, { status: 403 });
    }

    const company = context.companies.find((item) => item.id === companyId);
    if (!company) {
      return NextResponse.json({ error: "Empresa não disponível para este PDV." }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set(POS_COMPANY_COOKIE, company.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      ok: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível trocar a empresa do PDV." },
      { status: 400 },
    );
  }
}

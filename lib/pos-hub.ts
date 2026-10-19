import { cookies } from "next/headers";
import { requireCashierUser } from "@/lib/auth";
import { getCompanyBrand } from "@/lib/company-brand";
import { createClient } from "@/lib/supabase/server";

export const POS_COMPANY_COOKIE = "crmfamily_pos_company";

export type PosCompanyOption = {
  id: string;
  name: string;
  slug: string;
  business_type: string;
};

export async function getPosHubContext(preferredCompanyId?: string | null) {
  const auth = await requireCashierUser();
  if (!auth.companyId) throw new Error("Este acesso não está vinculado a uma empresa.");

  const supabase = await createClient();
  const { data: sourceCompany, error: sourceError } = await supabase
    .from("companies")
    .select("id,name,slug,business_type")
    .eq("id", auth.companyId)
    .single();

  if (sourceError || !sourceCompany) throw new Error("Empresa do operador não encontrada.");

  const sourceBrand = getCompanyBrand(sourceCompany.slug, sourceCompany.name);
  const hubEnabled = sourceBrand.key === "schemmer";

  let companies: PosCompanyOption[] = [sourceCompany as PosCompanyOption];

  if (hubEnabled) {
    const { data, error } = await supabase
      .from("companies")
      .select("id,name,slug,business_type")
      .eq("is_active", true)
      .order("name");

    if (error) throw new Error(error.message);
    if (data?.length) companies = data as PosCompanyOption[];
  }

  const cookieStore = await cookies();
  const cookieCompanyId = cookieStore.get(POS_COMPANY_COOKIE)?.value ?? null;
  const requestedId = preferredCompanyId || cookieCompanyId;
  const selectedCompany =
    (requestedId ? companies.find((company) => company.id === requestedId) : null) ??
    companies.find((company) => company.id === auth.companyId) ??
    companies[0];

  if (!selectedCompany) throw new Error("Nenhuma empresa disponível para o PDV.");

  return {
    auth,
    supabase,
    sourceCompany: sourceCompany as PosCompanyOption,
    selectedCompany,
    companies,
    hubEnabled,
  };
}

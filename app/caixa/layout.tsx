import type { CSSProperties } from "react";
import { POSLayout } from "@/components/POS/POSLayout/posLayout";
import { getCompanyBrand } from "@/lib/company-brand";
import { getPosHubContext } from "@/lib/pos-hub";
import { createPosService } from "@/modules/pos/pos.service";

export const dynamic = "force-dynamic";

const brandColors = {
  family: "#13243a",
  sedux: "#c9106a",
  schemmer: "#155fb8",
  housepet: "#b51515",
} as const;

export default async function CashierLayout({ children }: { children: React.ReactNode }) {
  const { auth, supabase, selectedCompany, companies, hubEnabled } = await getPosHubContext();
  const service = createPosService(supabase, auth, selectedCompany.id);
  const brand = getCompanyBrand(selectedCompany.slug, selectedCompany.name);
  const session = await service.getSessionSummary();
  const style = { "--brand": brandColors[brand.key] } as CSSProperties;

  return (
    <div className={brand.className} style={style}>
      <POSLayout
        companyName={brand.name}
        businessLabel={brand.businessLabel}
        brandShort={brand.short}
        userName={auth.fullName ?? auth.email ?? "Operador"}
        cashOpen={Boolean(session)}
        centralMode={hubEnabled}
        selectedCompanyId={selectedCompany.id}
        companies={companies.map((company) => ({ id: company.id, name: company.name }))}
      >
        {children}
      </POSLayout>
    </div>
  );
}

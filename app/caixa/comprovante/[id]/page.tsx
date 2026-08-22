import { redirect } from "next/navigation";
import { requireCashierUser } from "@/lib/auth";

export default async function CashierReceiptRedirect({ params }: { params: Promise<{ id: string }> }) {
  await requireCashierUser();
  const { id } = await params;
  redirect(`/comprovante/caixa/${id}`);
}

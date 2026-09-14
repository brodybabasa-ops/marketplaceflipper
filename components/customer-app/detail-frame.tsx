import { AppPageHeader } from "@/components/customer-app/primitives";

export function CustomerDetailFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 pt-2">
      <AppPageHeader title={title} subtitle={subtitle} />
      <div className="rounded-[22px] bg-white p-4 text-navy">{children}</div>
    </div>
  );
}

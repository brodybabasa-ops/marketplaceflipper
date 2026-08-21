import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { MarketingNav } from "@/components/layout/MarketingNav";

export default function RegisterPage() {
  return (
    <div>
      <MarketingNav />
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}

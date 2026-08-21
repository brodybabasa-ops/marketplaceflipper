import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { MarketingNav } from "@/components/layout/MarketingNav";

export default function LoginPage() {
  return (
    <div>
      <MarketingNav />
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}

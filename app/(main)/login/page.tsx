import { AuthCard } from "@/components/auth-card";
import { ProviderLoginButtons } from "@/components/auth/provider-login-buttons";
import { OrSeparator } from "@/components/ui/or-separator";

export default function LoginPage() {
  return (
    <div className="grow flex flex-col items-center justify-center px-4 sm:px-6">
      <section className="w-full max-w-md space-y-4">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl mb-6 text-center">
        </h1>
        <AuthCard />
        <OrSeparator />
        <ProviderLoginButtons />
      </section>
    </div>
  );
}

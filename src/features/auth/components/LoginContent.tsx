import { useState, type FormEvent } from "react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO: connect the login API
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      {/* Large, soft red glow spreading from the top */}
      <div className="pointer-events-none absolute -top-64 left-1/2 h-[640px] w-[820px] -translate-x-1/2 rounded-full bg-brand/30 blur-[200px]" />

      <GlassCard className="relative w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to Globosoft PMS
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth className="mt-2">
            Sign in
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

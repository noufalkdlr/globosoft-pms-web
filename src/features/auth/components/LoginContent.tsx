import { useState, type FormEvent } from "react";

import { GlowBackground } from "../../../components/layout/GlowBackground";
import { GlassCard } from "../../../components/ui/GlassCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { getErrorMessage } from "../../../lib/api/errors";
import { useLogin } from "../hooks/useLogin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const loginMutation = useLogin();

  const trimmedEmail = email.trim();
  const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
  const isPasswordValid = password.length > 0;

  const emailError =
    emailTouched && !isEmailValid ? "Enter a valid email address." : undefined;
  const passwordError =
    passwordTouched && !isPasswordValid ? "Enter your password." : undefined;

  // Hide a previous server error as soon as the user starts editing again
  function clearServerError() {
    if (loginMutation.isError) {
      loginMutation.reset();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    loginMutation.mutate({ email: trimmedEmail, password });
  }

  return (
    <GlowBackground className="grid place-items-center p-6">
      <GlassCard className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to Globosoft PMS
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@gmail.com"
            value={email}
            error={emailError}
            onChange={(e) => {
              setEmail(e.target.value);
              clearServerError();
            }}
            onBlur={() => setEmailTouched(true)}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={passwordError}
            onChange={(e) => {
              setPassword(e.target.value);
              clearServerError();
            }}
          />

          {loginMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getErrorMessage(loginMutation.error)}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loginMutation.isPending}
            className="mt-2"
          >
            Sign in
          </Button>
        </form>
      </GlassCard>
    </GlowBackground>
  );
}

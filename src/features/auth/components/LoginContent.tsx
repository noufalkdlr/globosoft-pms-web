import { useState } from "react";

import { GlowBackground } from "../../../components/layout/GlowBackground";
import { GlassCard } from "../../../components/ui/GlassCard";
import { GoogleButton } from "../../../components/ui/GoogleButton";
import { LogoMark } from "../../../components/ui/LogoMark";
import { getErrorMessage } from "../../../lib/api/errors";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { AccountChooser } from "./AccountChooser";

export function LoginContent() {
  const [isChoosing, setIsChoosing] = useState(false);

  const googleAuth = useGoogleAuth();

  function handleSelect(credential: string) {
    setIsChoosing(false);
    googleAuth.mutate({ credential });
  }

  return (
    <GlowBackground className="grid place-items-center p-6">
      <GlassCard className="w-full max-w-sm">
        <LogoMark className="mb-5 size-11 text-base" />
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to Globosoft PMS
        </p>

        {isChoosing ? (
          <AccountChooser
            onSelect={handleSelect}
            onCancel={() => setIsChoosing(false)}
          />
        ) : (
          <div className="mt-6 space-y-4">
            <GoogleButton
              loading={googleAuth.isPending}
              onClick={() => {
                googleAuth.reset();
                setIsChoosing(true);
              }}
            />

            {googleAuth.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getErrorMessage(googleAuth.error)}
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Only accounts added by an admin can sign in.
            </p>
          </div>
        )}
      </GlassCard>
    </GlowBackground>
  );
}

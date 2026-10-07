import { useState, type PropsWithChildren } from "react";
import { Download } from "lucide-react";

import { env } from "../../config/env";
import { getPhoneOs } from "../../utils/device";
import { cn } from "../../utils/cn";
import { GlassCard } from "../ui/GlassCard";
import { LogoMark } from "../ui/LogoMark";
import { GlowBackground } from "./GlowBackground";

const STORAGE_KEY = "pms-continue-in-browser";

function readChoice(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberChoice() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage unavailable: the question just comes back next time
  }
}

// On a phone, points people to the phone app instead of the web app, which is
// made for a computer (a board with columns and dragging does not suit a small
// screen). It is a pointer, not a lock: the browser tells us what phone it is,
// so anyone can change that, and "Continue in browser" is always there.
//
// It does nothing until the store address for the visitor's kind of phone is set
// (VITE_ANDROID_APP_URL / VITE_IOS_APP_URL), and never on a computer or a tablet.
export function MobileAppGate({ children }: PropsWithChildren) {
  const [continuesInBrowser, setContinuesInBrowser] = useState(readChoice);

  const os = getPhoneOs();
  const storeUrl = os === "android" ? env.androidAppUrl : os === "ios" ? env.iosAppUrl : undefined;

  if (!os || !storeUrl || continuesInBrowser) {
    return children;
  }

  return (
    <GlowBackground className="grid place-items-center p-6">
      <GlassCard className="w-full max-w-sm text-center">
        <LogoMark className="mx-auto mb-5 size-12 text-base" />
        <h1 className="text-balance text-2xl font-semibold">Use the Globosoft app</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your cards, notifications and moving work along are made for the phone
          app. The website suits a computer better.
        </p>

        {/* A link that looks like the primary button */}
        <a
          href={storeUrl}
          className={cn(
            "mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 font-medium transition",
            "bg-brand text-brand-foreground shadow-brand-glow hover:shadow-brand-glow-strong",
          )}
        >
          <Download className="size-4" aria-hidden="true" />
          {os === "android" ? "Get it on Google Play" : "Download on the App Store"}
        </a>

        <button
          type="button"
          onClick={() => {
            rememberChoice();
            setContinuesInBrowser(true);
          }}
          className="mt-3 w-full rounded-xl px-4 py-3 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          Continue in browser
        </button>
      </GlassCard>
    </GlowBackground>
  );
}

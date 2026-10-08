import { useEffect } from "react";
import { useRouteError } from "react-router";

import { GlowBackground } from "../../components/layout/GlowBackground";
import { MessageCard } from "../../components/ui/MessageCard";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

interface RouteErrorProps {
  // True outside the app's frame (no sidebar to keep): fill the whole window
  fullPage?: boolean;
}

// What a person sees when a page breaks while it is drawn (a bug, or a page
// file that could not be fetched after an update). Better than a blank window:
// it says so, and offers the one thing that usually helps.
export function RouteError({ fullPage = false }: RouteErrorProps) {
  const error = useRouteError();

  useDocumentTitle("Something went wrong");

  // The details go to the console for whoever looks into it
  useEffect(() => {
    console.error(error);
  }, [error]);

  const card = (
    <MessageCard
      title="Something went wrong"
      description="This page couldn't be shown. Reload it, and if it keeps happening, tell whoever looks after the app."
      action={{ label: "Reload", onClick: () => window.location.reload() }}
    />
  );

  return fullPage ? (
    <GlowBackground className="grid place-items-center p-6">
      <div className="w-full max-w-md">{card}</div>
    </GlowBackground>
  ) : (
    card
  );
}

import { GlowBackground } from "../../../components/layout/GlowBackground";
import { UserCard } from "../../auth/components/UserCard";

// TEMPORARY placeholder: replaced by the admin reports dashboard
export function DashboardContent() {
  return (
    <GlowBackground className="grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily and monthly reports will appear here.
          </p>
        </div>
        <UserCard />
      </div>
    </GlowBackground>
  );
}

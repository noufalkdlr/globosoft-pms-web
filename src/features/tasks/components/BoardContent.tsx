import { GlowBackground } from "../../../components/layout/GlowBackground";
import { UserCard } from "../../auth/components/UserCard";

// TEMPORARY placeholder: replaced by the Kanban board
export function BoardContent() {
  return (
    <GlowBackground className="grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Task board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The Kanban board comes next.
          </p>
        </div>
        <UserCard />
      </div>
    </GlowBackground>
  );
}

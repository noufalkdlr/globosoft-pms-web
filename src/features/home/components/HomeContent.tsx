import { PageHeader } from "../../../components/layout/PageHeader";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { useAuthStore } from "../../../stores/authStore";
import { getTodayIst } from "../../../utils/date";
import { getCurrentMonth } from "../../../utils/month";
import { useHomeCards } from "../hooks/useHomeCards";
import { formatToday, getGreeting } from "../lib/greeting";
import { getHomeKind } from "../lib/homeSections";
import { DesignHome } from "./DesignHome";
import { MarketingHome } from "./MarketingHome";

function HomeSkeleton() {
  return (
    <div role="status" aria-label="Loading your day" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <GlassCard key={index} className="h-20 animate-pulse p-4" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <GlassCard key={index} className="h-48 animate-pulse p-4" />
        ))}
      </div>
    </div>
  );
}

// The page members land on after signing in. Admins go to the dashboard.
export function HomeContent() {
  const user = useAuthStore((state) => state.user);
  const cardsQuery = useHomeCards();

  if (!user) {
    return null;
  }

  const firstName = user.name.split(" ")[0];
  const currentMonth = getCurrentMonth();
  const today = getTodayIst();
  const kind = getHomeKind(user);
  const tasks = cardsQuery.data?.items ?? [];

  function renderBody() {
    if (cardsQuery.isPending) {
      return <HomeSkeleton />;
    }

    if (cardsQuery.isError) {
      return (
        <MessageCard
          title="Couldn't load your day"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => cardsQuery.refetch() }}
        />
      );
    }

    return kind === "design" ? (
      <DesignHome tasks={tasks} currentMonth={currentMonth} today={today} />
    ) : (
      <MarketingHome tasks={tasks} currentMonth={currentMonth} today={today} />
    );
  }

  return (
    <div>
      <PageHeader
        // Three pieces of text, not one string: the browser places each piece
        // itself, which is how this title has always been drawn
        title={
          <>
            {getGreeting()}, {firstName}
          </>
        }
        description={formatToday()}
      />

      <div className="mt-6">{renderBody()}</div>
    </div>
  );
}

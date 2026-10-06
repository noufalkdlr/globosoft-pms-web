import { lazy, Suspense } from "react";

import { PageFallback } from "../../components/layout/PageFallback";

// The dashboard, and the charts library it uses, are only downloaded when an
// admin opens it. Everyone else never pays for them.
const DashboardRoute = lazy(() =>
  import("./DashboardRoute").then((module) => ({
    default: module.DashboardRoute,
  })),
);

export function LazyDashboardRoute() {
  return (
    <Suspense fallback={<PageFallback />}>
      <DashboardRoute />
    </Suspense>
  );
}

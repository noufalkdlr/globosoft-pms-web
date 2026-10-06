export default function App() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      {/* വൃത്താകൃതിയിലുള്ള blur ചുവന്ന glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand/40 blur-[120px]" />

      <div className="glass relative w-full max-w-sm rounded-3xl p-8">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to Globosoft PMS
        </p>

        <button className="mt-6 h-12 w-full rounded-xl bg-brand font-medium text-brand-foreground shadow-[0_0_24px_rgb(225_29_46/0.45)]">
          Sign in
        </button>
      </div>
    </div>
  );
}

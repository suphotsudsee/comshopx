"use client";

export default function PosError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="adminShell single">
      <section className="adminWorkspace">
        <div className="adminPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">POS Error</p>
              <h1>Point of Sale failed to load</h1>
              <span>{error.message || "Server-side exception"}</span>
            </div>
          </div>
          {error.digest ? <p className="mutedText">Digest: {error.digest}</p> : null}
          <button className="primaryButton" type="button" onClick={reset}>
            Retry
          </button>
        </div>
      </section>
    </main>
  );
}

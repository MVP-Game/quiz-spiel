export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide">
          Live-Quiz
        </p>

        <h1 className="text-2xl font-bold mt-4">
          Wer hat aktuell die meisten Tore in der Bundesliga?
        </h1>

        <div className="mt-6 space-y-3">
          <button className="w-full rounded-xl border p-3 text-left">
            A) Spieler A
          </button>

          <button className="w-full rounded-xl border p-3 text-left">
            B) Spieler B
          </button>

          <button className="w-full rounded-xl border p-3 text-left">
            C) Spieler C
          </button>

          <button className="w-full rounded-xl border p-3 text-left">
            D) Spieler D
          </button>
        </div>

        <div className="mt-8 rounded-xl bg-gray-100 p-4">
          <p className="font-semibold">Antwort</p>
          <p className="mt-2">
            Die Antwort wird nach dem Aufdecken angezeigt.
          </p>
        </div>
      </div>
    </main>
  );
}
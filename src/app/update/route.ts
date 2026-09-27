import { createClient } from "@supabase/supabase-js";

async function updateBundesligaTopScorer(): Promise<{
  spieler: string;
  tore: number;
  updatedQuestion: unknown;
}> {
  const updaterKey = "bundesliga_top_scorer";

  const response = await fetch(
    "https://v3.football.api-sports.io/players/topscorers?league=78&season=2024",
    {
      headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY!,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();
  const topScorer = data.response?.[0];

  if (!topScorer) {
    throw new Error("Kein Torschütze gefunden.");
  }

  const spieler = topScorer.player.name;
  const tore = topScorer.statistics[0].goals.total;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: updatedQuestion, error } = await supabaseAdmin
    .from("questions")
    .update({
      answer: `${spieler} (${tore} Tore)`,
      source: "API-Football – Bundesliga 2024/25",
      updated_at: new Date().toISOString(),
    })
    .eq("updater_key", updaterKey)
    .eq("update_type", "automatic")
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return {
    spieler,
    tore,
    updatedQuestion,
  };
}

async function updateTestQuestion(): Promise<{
  nachricht: string;
  updatedQuestion: unknown;
}> {
  const updaterKey = "test_updater";

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: updatedQuestion, error } = await supabaseAdmin
    .from("questions")
    .update({
      answer: "Test-Updater funktioniert",
      source: "Automatischer Test-Updater",
      updated_at: new Date().toISOString(),
    })
    .eq("updater_key", updaterKey)
    .eq("update_type", "automatic")
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return {
    nachricht: "Test-Updater erfolgreich",
    updatedQuestion,
  };
}

const updaters = {
  bundesliga_top_scorer: updateBundesligaTopScorer,
  test_updater: updateTestQuestion,
};

type UpdaterKey = keyof typeof updaters;

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json(
      { error: "Nicht autorisiert." },
      { status: 401 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: automaticQuestions, error: questionsError } =
    await supabaseAdmin
      .from("questions")
      .select("id, updater_key")
      .eq("update_type", "automatic");

  if (questionsError) {
    return Response.json(
      { error: questionsError.message },
      { status: 500 }
    );
  }

  const updaterKeys = [
    ...new Set(
      (automaticQuestions ?? [])
        .map((question) => question.updater_key)
        .filter(
          (key): key is UpdaterKey =>
            typeof key === "string" && key in updaters
        )
    ),
  ];

  const results: unknown[] = [];

  try {
    for (const updaterKey of updaterKeys) {
      const result = await updaters[updaterKey]();

      results.push({
        updaterKey,
        ...result,
      });
    }
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Aktualisieren.",
      },
      { status: 500 }
    );
  }

  return Response.json({
    erfolg: true,
    anzahlUpdater: updaterKeys.length,
    aktualisierteUpdater: results,
  });
}
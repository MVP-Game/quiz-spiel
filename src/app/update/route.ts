import { createClient } from "@supabase/supabase-js";
import { updateBundesligaTopScorer } from "@/lib/updaters/bundesligaTopScorer";
import { updateBundesligaStandings } from "@/lib/updaters/bundesligaStandings";

const updaterGroups = {
  bundesliga_top_scorer: "bundesliga_top_scorers",
  bundesliga_leader: "bundesliga_standings",
  bundesliga_second: "bundesliga_standings",
} as const;

type UpdaterKey = keyof typeof updaterGroups;

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
            typeof key === "string" && key in updaterGroups
        )
    ),
  ];

  const groups = new Set(
    updaterKeys.map((updaterKey) => updaterGroups[updaterKey])
  );

  const results: unknown[] = [];

  try {
    if (groups.has("bundesliga_top_scorers")) {
      const result = await updateBundesligaTopScorer();

      results.push({
        gruppe: "bundesliga_top_scorers",
        result,
      });
    }

    if (groups.has("bundesliga_standings")) {
      const result = await updateBundesligaStandings();

      results.push({
        gruppe: "bundesliga_standings",
        result,
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
    anzahlFrageTypen: updaterKeys.length,
    anzahlApiGruppen: groups.size,
    aktualisierteGruppen: results,
  });
}
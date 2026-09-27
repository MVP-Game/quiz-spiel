import { createClient } from "@supabase/supabase-js";
import { updateBundesligaTopScorer } from "@/lib/updaters/bundesligaTopScorer";
import { updateBundesligaLeader } from "@/lib/updaters/bundesligaLeader";

const updaters = {
  bundesliga_top_scorer: updateBundesligaTopScorer,
  bundesliga_leader: updateBundesligaLeader,
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
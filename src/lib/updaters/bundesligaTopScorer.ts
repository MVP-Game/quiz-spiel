import { createClient } from "@supabase/supabase-js";
import { fetchApiFootball } from "@/lib/football/apiFootball";

export async function updateBundesligaTopScorer(): Promise<{
  spieler: string;
  tore: number;
  updatedQuestion: unknown;
}> {
  const updaterKey = "bundesliga_top_scorer";

  const data = await fetchApiFootball(
    "/players/topscorers?league=78&season=2024"
  );

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
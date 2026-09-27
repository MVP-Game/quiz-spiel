import { createClient } from "@supabase/supabase-js";
import { fetchApiFootball } from "@/lib/football/apiFootball";

export async function updateBundesligaStandings(): Promise<{
  erster: string;
  zweiter: string;
  updatedQuestions: unknown;
}> {
  const data = await fetchApiFootball(
    "/standings?league=78&season=2024"
  );

  const table = data.response?.[0]?.league?.standings?.[0];

  if (!table || table.length < 2) {
    throw new Error("Bundesliga-Tabelle konnte nicht geladen werden.");
  }

  const erster = table[0];
  const zweiter = table[1];

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: leaderQuestion, error: leaderError } = await supabaseAdmin
    .from("questions")
    .update({
      answer: `${erster.team.name} (${erster.points} Punkte)`,
      source: "API-Football – Bundesliga 2024/25",
      updated_at: new Date().toISOString(),
    })
    .eq("updater_key", "bundesliga_leader")
    .eq("update_type", "automatic")
    .select();

  if (leaderError) {
    throw new Error(leaderError.message);
  }

  const { data: secondQuestion, error: secondError } = await supabaseAdmin
    .from("questions")
    .update({
      answer: `${zweiter.team.name} (${zweiter.points} Punkte)`,
      source: "API-Football – Bundesliga 2024/25",
      updated_at: new Date().toISOString(),
    })
    .eq("updater_key", "bundesliga_second")
    .eq("update_type", "automatic")
    .select();

  if (secondError) {
    throw new Error(secondError.message);
  }

  return {
    erster: erster.team.name,
    zweiter: zweiter.team.name,
    updatedQuestions: {
      leaderQuestion,
      secondQuestion,
    },
  };
}
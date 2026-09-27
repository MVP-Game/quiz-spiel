import { createClient } from "@supabase/supabase-js";
import { fetchApiFootball } from "@/lib/football/apiFootball";

export async function updateBundesligaLeader(): Promise<{
  verein: string;
  punkte: number;
  updatedQuestion: unknown;
}> {
  const updaterKey = "bundesliga_leader";

  const data = await fetchApiFootball(
    "/standings?league=78&season=2024"
  );

  const table = data.response?.[0]?.league?.standings?.[0];
  const leader = table?.[0];

  if (!leader) {
    throw new Error("Kein Tabellenführer gefunden.");
  }

  const verein = leader.team.name;
  const punkte = leader.points;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: updatedQuestion, error } = await supabaseAdmin
    .from("questions")
    .update({
      answer: `${verein} (${punkte} Punkte)`,
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
    verein,
    punkte,
    updatedQuestion,
  };
}
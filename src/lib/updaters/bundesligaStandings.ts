import { createClient } from "@supabase/supabase-js";
import { fetchApiFootball } from "@/lib/football/apiFootball";

export async function updateBundesligaStandings(): Promise<{
  erster: string;
  zweiter: string;
  letzter: string;
  meisteTore: string;
  wenigsteGegentore: string;
  besteTordifferenz: string;
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
  const letzter = table[table.length - 1];

  const meisteTore = [...table].sort(
    (a, b) => b.all.goals.for - a.all.goals.for
  )[0];

  const wenigsteGegentore = [...table].sort(
    (a, b) => a.all.goals.against - b.all.goals.against
  )[0];

  const besteTordifferenz = [...table].sort(
    (a, b) => b.goalsDiff - a.goalsDiff
  )[0];

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  async function updateQuestion(
    updaterKey: string,
    answer: string
  ) {
    const { data: updatedQuestion, error } = await supabaseAdmin
      .from("questions")
      .update({
        answer,
        source: "API-Football – Bundesliga 2024/25",
        updated_at: new Date().toISOString(),
      })
      .eq("updater_key", updaterKey)
      .eq("update_type", "automatic")
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return updatedQuestion;
  }

  const leaderQuestion = await updateQuestion(
    "bundesliga_leader",
    `${erster.team.name} (${erster.points} Punkte)`
  );

  const secondQuestion = await updateQuestion(
    "bundesliga_second",
    `${zweiter.team.name} (${zweiter.points} Punkte)`
  );

  const lastQuestion = await updateQuestion(
    "bundesliga_last",
    `${letzter.team.name} (${letzter.points} Punkte)`
  );

  const mostGoalsQuestion = await updateQuestion(
    "bundesliga_most_goals",
    `${meisteTore.team.name} (${meisteTore.all.goals.for} Tore)`
  );

  const fewestConcededQuestion = await updateQuestion(
    "bundesliga_fewest_conceded",
    `${wenigsteGegentore.team.name} (${wenigsteGegentore.all.goals.against} Gegentore)`
  );

  const bestGoalDifferenceQuestion = await updateQuestion(
    "bundesliga_best_goal_difference",
    `${besteTordifferenz.team.name} (${besteTordifferenz.goalsDiff > 0 ? "+" : ""}${besteTordifferenz.goalsDiff})`
  );

  return {
    erster: erster.team.name,
    zweiter: zweiter.team.name,
    letzter: letzter.team.name,
    meisteTore: meisteTore.team.name,
    wenigsteGegentore: wenigsteGegentore.team.name,
    besteTordifferenz: besteTordifferenz.team.name,
    updatedQuestions: {
      leaderQuestion,
      secondQuestion,
      lastQuestion,
      mostGoalsQuestion,
      fewestConcededQuestion,
      bestGoalDifferenceQuestion,
    },
  };
}
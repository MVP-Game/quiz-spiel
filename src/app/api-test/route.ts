import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${process.env.UPDATE_SECRET}`) {
    return Response.json(
      { error: "Nicht autorisiert." },
      { status: 401 }
    );
  }
  // 1. Torschützenliste von API-Football abrufen
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
    return Response.json(
      { error: "Kein Torschütze gefunden." },
      { status: 500 }
    );
  }

  const spieler = topScorer.player.name;
  const tore = topScorer.statistics[0].goals.total;

  // 2. Serverseitige Verbindung zu Supabase
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // 3. Karte #1 aktualisieren
  const { data: updatedQuestion, error } = await supabaseAdmin
    .from("questions")
    .update({
      answer: `${spieler} (${tore} Tore)`,
      source: "API-Football – Bundesliga 2024/25",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select();

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json({
    erfolg: true,
    karte: 1,
    spieler,
    tore,
    aktualisierteZeilen: updatedQuestion,
  });
}
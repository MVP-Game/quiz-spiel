const API_BASE_URL = "https://v3.football.api-sports.io";

export async function fetchApiFootball(endpoint: string) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY fehlt.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `API-Football Fehler: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(
      `API-Football meldet einen Fehler: ${JSON.stringify(data.errors)}`
    );
  }

  return data;
}
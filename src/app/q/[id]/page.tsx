import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuestionPage({ params }: Props) {
  const { id } = await params;

  const { data: question, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !question) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border p-6">
          <h1 className="text-2xl font-bold">
            Karte nicht gefunden
          </h1>

          <p className="mt-2 text-gray-500">
            Die Karte #{id} existiert nicht.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide">
          Live-Quiz
        </p>

        <p className="text-sm text-gray-500 mt-2">
          Karte #{question.id}
        </p>

        <h1 className="text-2xl font-bold mt-4">
          {question.question}
        </h1>

<div className="mt-8 rounded-xl bg-gray-100 p-4 text-gray-900">
  <p className="font-semibold">
    Antwort
  </p>

  <p className="mt-2">
    {question.answer}
  </p>
</div>

        <p className="text-xs text-gray-500 mt-6">
          Quelle: {question.source}
        </p>
      </div>
    </main>
  );
}
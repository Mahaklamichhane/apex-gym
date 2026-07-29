import { ExerciseDetail } from "@/features/exercises/components/exercise-detail";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <ExerciseDetail id={exerciseId} />
    </div>
  );
}

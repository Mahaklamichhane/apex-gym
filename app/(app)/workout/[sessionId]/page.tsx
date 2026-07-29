import { WorkoutMode } from "@/features/workout-session/components/workout-mode";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <WorkoutMode id={sessionId} />
    </div>
  );
}

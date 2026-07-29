"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Weight } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/services/supabase/client";
import { fetchWeightHistory, logWeight } from "@/services/body/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ListSkeleton } from "@/components/states";
import { formatRelativeDate } from "@/utils/format";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function BodyTracker() {
  const qc = useQueryClient();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayISO());

  const { data, isPending } = useQuery({
    queryKey: ["weight-history"],
    queryFn: () => fetchWeightHistory(createClient()),
    staleTime: 30 * 1000,
  });

  const save = useMutation({
    mutationFn: () => logWeight(createClient(), Number(weight), date),
    onSuccess: () => {
      toast.success("Weight logged");
      setWeight("");
      qc.invalidateQueries({ queryKey: ["weight-history"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Couldn't save weight"),
  });

  const chartData =
    data?.map((m) => ({
      date: new Date(m.measuredAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      weight: m.weightKg,
    })) ?? [];

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(weight);
          if (!Number.isFinite(n) || n <= 0)
            return toast.error("Enter a valid weight");
          save.mutate();
        }}
        className="flex flex-wrap items-end gap-3 rounded-xl border p-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            inputMode="decimal"
            placeholder="78.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-32"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <Button type="submit" disabled={save.isPending}>
          Log weight
        </Button>
      </form>

      {isPending ? (
        <ListSkeleton rows={3} />
      ) : chartData.length === 0 ? (
        <EmptyState
          icon={Weight}
          title="No weigh-ins yet"
          description="Log your weight to see your trend over time."
        />
      ) : (
        <>
          <div className="rounded-xl border p-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                    stroke="var(--muted-foreground)"
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ul className="divide-y rounded-xl border">
            {[...(data ?? [])].reverse().map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">
                  {formatRelativeDate(m.measuredAt)}
                </span>
                <span className="font-medium tabular-nums">{m.weightKg} kg</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

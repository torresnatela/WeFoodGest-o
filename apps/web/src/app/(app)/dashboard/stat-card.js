import Card from "@/components/ui/card";

export default function StatCard({ label, value }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-display text-2xl font-bold text-ink">{value}</span>
    </Card>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatCompact } from "@/lib/constants";

interface KPICardsProps {
  loading: boolean;
  stats?: {
    totalDistricts: number;
    avgMedianHouseValue: number;
    avgMedianIncome: number;
    totalPopulation: number;
  };
}

export function KPICards({ loading, stats }: KPICardsProps) {
  const kpis = [
    { title: "Total Districts", value: stats ? stats.totalDistricts.toLocaleString() : "--" },
    { title: "Avg Median House Value", value: stats ? formatCurrency(stats.avgMedianHouseValue) : "--" },
    { title: "Avg Median Income", value: stats ? formatCurrency(stats.avgMedianIncome * 10000) : "--" },
    { title: "Total Population", value: stats ? formatCompact(stats.totalPopulation) : "--" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {kpis.map((kpi, i) => (
        <Card key={i}>
          <CardContent className="p-6 flex flex-col justify-center h-full">
            {loading ? (
              <>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <p className="text-3xl font-bold mt-1.5" style={{ color: "#0079F2" }}>{kpi.value}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

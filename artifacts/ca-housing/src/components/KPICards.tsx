import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatCompact } from "@/lib/constants";
import { Home, DollarSign, TrendingUp, Users } from "lucide-react";

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
    {
      title: "Avg Median House Value",
      value: stats ? formatCurrency(stats.avgMedianHouseValue) : "--",
      icon: Home,
      primary: true,
    },
    {
      title: "Avg Median Income",
      value: stats ? formatCurrency(stats.avgMedianIncome * 10000) : "--",
      icon: DollarSign,
      primary: false,
    },
    {
      title: "Total Districts",
      value: stats ? stats.totalDistricts.toLocaleString() : "--",
      icon: TrendingUp,
      primary: false,
    },
    {
      title: "Total Population",
      value: stats ? formatCompact(stats.totalPopulation) : "--",
      icon: Users,
      primary: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={i}
            className={kpi.primary ? "border-[#0079F2]/30 bg-[#0079F2]/5 dark:bg-[#0079F2]/10" : ""}
          >
            <CardContent className="p-6 flex flex-col justify-center h-full">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p
                      className={`font-bold mt-1.5 ${kpi.primary ? "text-4xl" : "text-3xl"}`}
                      style={{ color: "#0079F2" }}
                    >
                      {kpi.value}
                    </p>
                  </div>
                  <div className={`rounded-lg p-2 mt-0.5 ${kpi.primary ? "bg-[#0079F2]/15" : "bg-muted"}`}>
                    <Icon className={`w-5 h-5 ${kpi.primary ? "text-[#0079F2]" : "text-muted-foreground"}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

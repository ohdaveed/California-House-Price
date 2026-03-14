import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Line, Legend } from "recharts";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";
import { CHART_COLORS, CustomTooltip, CustomLegend } from "@/lib/constants";
import type { AgeDistributionBucket } from "@workspace/api-client-react";

interface AgeDistributionBarProps {
  loading: boolean;
  data?: AgeDistributionBucket[];
  isDark: boolean;
}

export function AgeDistributionBar({ loading, data = [], isDark }: AgeDistributionBarProps) {
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Housing Age Distribution & Price</CardTitle>
        {!loading && data.length > 0 && (
          <CSVLink
            data={data}
            filename="age-distribution.csv"
            className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
          >
            <Download className="w-3.5 h-3.5" />
          </CSVLink>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {loading ? (
          <Skeleton className="w-full h-[250px]" />
        ) : (
          <ResponsiveContainer width="100%" height={250} debounce={0}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="ageRange" 
                tick={{ fontSize: 11, fill: tickColor }} 
                stroke={tickColor} 
                angle={-30}
                textAnchor="end"
                height={40}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12, fill: tickColor }} 
                stroke={tickColor}
                width={50}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: tickColor }} 
                stroke={tickColor}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
              <Legend content={<CustomLegend />} />
              <Bar 
                yAxisId="left"
                dataKey="count" 
                name="District Count"
                fill={CHART_COLORS.blue}
                fillOpacity={0.8} 
                activeBar={{ fillOpacity: 1 }} 
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgPrice"
                name="Avg Price"
                stroke={CHART_COLORS.purple}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS.purple }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";
import { CHART_COLORS, CustomTooltip, CustomLegend } from "@/lib/constants";
import type { StarbucksPriceImpact } from "@workspace/api-client-react";

interface StarbucksImpactLineProps {
  loading: boolean;
  data?: StarbucksPriceImpact[];
  isDark: boolean;
}

export function StarbucksImpactLine({ loading, data = [], isDark }: StarbucksImpactLineProps) {
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const formattedData = data.map(d => ({
    ...d,
    "Nearby Starbucks": d.avgPriceNearby,
    "Overall Average": d.avgPriceOther
  }));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Starbucks Price Impact</CardTitle>
          <CardDescription className="text-xs mt-1">Districts within ~15km of a Starbucks opening showed higher prices</CardDescription>
        </div>
        {!loading && formattedData.length > 0 && (
          <CSVLink
            data={formattedData}
            filename="starbucks-impact.csv"
            className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80 shrink-0"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
          >
            <Download className="w-3.5 h-3.5" />
          </CSVLink>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {loading ? (
          <Skeleton className="w-full h-[300px]" />
        ) : (
          <ResponsiveContainer width="100%" height={300} debounce={0}>
            <LineChart data={formattedData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="openYear" 
                tick={{ fontSize: 12, fill: tickColor }} 
                stroke={tickColor} 
                tickMargin={10}
              />
              <YAxis 
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: tickColor }} 
                stroke={tickColor}
                width={65}
                domain={['auto', 'auto']}
              />
              <Tooltip cursor={{ stroke: tickColor, strokeDasharray: '3 3' }} content={<CustomTooltip />} isAnimationActive={false} />
              <Legend content={<CustomLegend />} />
              <Line 
                type="monotone" 
                dataKey="Nearby Starbucks" 
                stroke="#00704A" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: "#00704A", stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="Overall Average" 
                stroke={CHART_COLORS.purple} 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="5 5"
                activeDot={{ r: 4, fill: CHART_COLORS.purple, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

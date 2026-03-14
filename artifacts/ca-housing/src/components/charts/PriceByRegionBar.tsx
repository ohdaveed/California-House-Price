import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";
import { CHART_COLOR_LIST, CustomTooltip } from "@/lib/constants";
import type { RegionPrice } from "@workspace/api-client-react";

interface PriceByRegionBarProps {
  loading: boolean;
  data?: RegionPrice[];
  isDark: boolean;
}

export function PriceByRegionBar({ loading, data = [], isDark }: PriceByRegionBarProps) {
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const sortedData = [...data].sort((a, b) => b.avgPrice - a.avgPrice);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Avg Price by Region</CardTitle>
        {!loading && data.length > 0 && (
          <CSVLink
            data={sortedData}
            filename="price-by-region.csv"
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
            <BarChart data={sortedData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="oceanProximity" 
                tick={{ fontSize: 11, fill: tickColor }} 
                stroke={tickColor} 
                angle={-20}
                textAnchor="end"
                height={50}
                tickMargin={5}
              />
              <YAxis 
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: tickColor }} 
                stroke={tickColor}
                width={60}
              />
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Bar 
                dataKey="avgPrice" 
                name="Avg Price"
                fillOpacity={0.9} 
                activeBar={{ fillOpacity: 1 }} 
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

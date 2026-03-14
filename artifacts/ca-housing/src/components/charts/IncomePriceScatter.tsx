import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ZAxis } from "recharts";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";
import { CHART_COLOR_LIST, CustomTooltip } from "@/lib/constants";
import type { IncomePricePoint } from "@workspace/api-client-react";

interface ScatterChartProps {
  loading: boolean;
  data?: IncomePricePoint[];
  isDark: boolean;
}

export function ScatterChart({ loading, data = [], isDark }: ScatterChartProps) {
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const groupedData = data.reduce((acc, curr) => {
    if (!acc[curr.oceanProximity]) acc[curr.oceanProximity] = [];
    acc[curr.oceanProximity].push(curr);
    return acc;
  }, {} as Record<string, IncomePricePoint[]>);

  const categories = Object.keys(groupedData);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Income vs House Value</CardTitle>
        {!loading && data.length > 0 && (
          <CSVLink
            data={data}
            filename="income-price-scatter.csv"
            className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
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
            <RechartsScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                type="number" 
                dataKey="medianIncome" 
                name="Income (x$10k)" 
                tick={{ fontSize: 12, fill: tickColor }} 
                stroke={tickColor} 
                domain={['auto', 'auto']}
              />
              <YAxis 
                type="number" 
                dataKey="medianHouseValue" 
                name="House Value" 
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: tickColor }} 
                stroke={tickColor}
              />
              <ZAxis type="number" range={[15, 15]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
              <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
              
              {categories.map((cat, i) => (
                <Scatter 
                  key={cat} 
                  name={cat} 
                  data={groupedData[cat]} 
                  fill={CHART_COLOR_LIST[i % CHART_COLOR_LIST.length]} 
                  fillOpacity={0.6}
                  isAnimationActive={false}
                />
              ))}
            </RechartsScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "10px 14px", border: "1px solid #e0e0e0", color: "#1a1a1a", fontSize: "13px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
      <div style={{ fontWeight: 600, marginBottom: "4px" }}>{data.oceanProximity}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ color: "#666" }}>Income:</span>
        <span>${(data.medianIncome * 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ color: "#666" }}>Value:</span>
        <span>${data.medianHouseValue.toLocaleString()}</span>
      </div>
    </div>
  );
}

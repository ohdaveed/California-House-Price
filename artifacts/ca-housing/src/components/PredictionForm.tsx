import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePredictHousingPrice, PredictionResult } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

const predictionSchema = z.object({
  medianIncome: z.number().min(0.5).max(15),
  housingMedianAge: z.number().min(1).max(52),
  totalRooms: z.coerce.number().min(1).max(40000),
  totalBedrooms: z.coerce.number().min(1).max(6500),
  population: z.coerce.number().min(1).max(36000),
  households: z.coerce.number().min(1).max(6000),
  latitude: z.coerce.number().min(32).max(42),
  longitude: z.coerce.number().min(-125).max(-114),
  oceanProximity: z.string().min(1),
});

type PredictionFormValues = z.infer<typeof predictionSchema>;

export function PredictionForm({ isDark }: { isDark: boolean }) {
  const [result, setResult] = useState<PredictionResult | null>(null);
  
  const form = useForm<PredictionFormValues>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      medianIncome: 5.0,
      housingMedianAge: 25,
      totalRooms: 2000,
      totalBedrooms: 400,
      population: 1000,
      households: 350,
      latitude: 37.77,
      longitude: -122.42,
      oceanProximity: "NEAR BAY",
    },
  });

  const predictMutation = usePredictHousingPrice();

  function onSubmit(data: PredictionFormValues) {
    predictMutation.mutate({ data }, {
      onSuccess: (res) => {
        setResult(res);
      }
    });
  }

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI Price Prediction</CardTitle>
        <CardDescription>Adjust features to see how they impact home values</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              
              <FormField
                control={form.control}
                name="medianIncome"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center pb-2">
                      <FormLabel>Median Income: ${(field.value * 10000).toLocaleString()}</FormLabel>
                    </div>
                    <FormControl>
                      <Slider
                        min={0.5} max={15} step={0.1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="housingMedianAge"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center pb-2">
                      <FormLabel>Housing Age: {field.value} yrs</FormLabel>
                    </div>
                    <FormControl>
                      <Slider
                        min={1} max={52} step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="totalRooms" render={({ field }) => (
                <FormItem><FormLabel>Total Rooms</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="totalBedrooms" render={({ field }) => (
                <FormItem><FormLabel>Total Bedrooms</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="population" render={({ field }) => (
                <FormItem><FormLabel>Population</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="households" render={({ field }) => (
                <FormItem><FormLabel>Households</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="latitude" render={({ field }) => (
                  <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="longitude" render={({ field }) => (
                  <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="oceanProximity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ocean Proximity</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="<1H OCEAN">&lt;1H OCEAN</SelectItem>
                      <SelectItem value="INLAND">INLAND</SelectItem>
                      <SelectItem value="ISLAND">ISLAND</SelectItem>
                      <SelectItem value="NEAR BAY">NEAR BAY</SelectItem>
                      <SelectItem value="NEAR OCEAN">NEAR OCEAN</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={predictMutation.isPending}>
              {predictMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Model...</> : "Predict Price"}
            </Button>
          </form>
        </Form>

        {result && (
          <div className="mt-8 pt-6 border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Predicted Home Value</p>
              <h3 className="text-4xl font-bold tracking-tight" style={{ color: CHART_COLORS.blue }}>
                ${result.predictedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Model Confidence: <span className="font-semibold text-foreground">{(result.confidence * 100).toFixed(1)}%</span>
              </p>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-4 text-center">Feature Importance</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={result.featureImportance} layout="vertical" margin={{ left: 40, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border p-2 rounded shadow-md text-xs">
                            <span className="font-semibold">{payload[0].payload.feature}:</span> {(payload[0].value as number * 100).toFixed(1)}%
                          </div>
                        )
                      }
                      return null;
                    }} 
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {result.featureImportance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.blue} fillOpacity={0.7 + (entry.importance * 0.3)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

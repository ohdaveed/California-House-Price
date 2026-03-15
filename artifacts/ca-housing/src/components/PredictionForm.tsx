import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePredictHousingPrice, PredictionResult } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { Loader2, MapPin, Home, Users, DollarSign } from "lucide-react";
import {
  CA_CITIES,
  BEDROOM_PRESETS,
  DISTRICT_SIZE_PRESETS,
  OCEAN_PROXIMITY_LABELS,
  type OceanProximity,
} from "@/lib/ca-cities";

const MIN_PRICE = 15000;
const MAX_PRICE = 500001;

const predictionSchema = z.object({
  cityIndex: z.number().min(0),
  medianIncome: z.number().min(0.5).max(15),
  housingMedianAge: z.number().min(1).max(52),
  bedroomPreset: z.number().min(0).max(4),
  districtSizePreset: z.number().min(0).max(3),
  oceanProximity: z.string().min(1),
});

type FormValues = z.infer<typeof predictionSchema>;

const PROXIMITY_OVERRIDE_OPTIONS = Object.entries(OCEAN_PROXIMITY_LABELS) as [OceanProximity, string][];

export function PredictionForm({ isDark }: { isDark: boolean }) {
  const [result, setResult] = useState<PredictionResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      cityIndex: 0,
      medianIncome: 5.0,
      housingMedianAge: 25,
      bedroomPreset: 2,
      districtSizePreset: 1,
      oceanProximity: CA_CITIES[0].oceanProximity,
    },
  });

  const predictMutation = usePredictHousingPrice();

  function onSubmit(data: FormValues) {
    const city = CA_CITIES[data.cityIndex];
    const bedrooms = BEDROOM_PRESETS[data.bedroomPreset];
    const district = DISTRICT_SIZE_PRESETS[data.districtSizePreset];

    predictMutation.mutate(
      {
        data: {
          medianIncome: data.medianIncome,
          housingMedianAge: data.housingMedianAge,
          totalRooms: bedrooms.rooms * (district.households / 380),
          totalBedrooms: bedrooms.bedrooms * (district.households / 380),
          population: district.population,
          households: district.households,
          latitude: city.latitude,
          longitude: city.longitude,
          oceanProximity: data.oceanProximity as OceanProximity,
        },
      },
      { onSuccess: (res) => setResult(res) }
    );
  }

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const pricePct = result
    ? Math.max(0, Math.min(1, (result.predictedValue - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)))
    : null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>AI Price Prediction</CardTitle>
        <CardDescription>Describe the area to estimate a home value</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <FormField
              control={form.control}
              name="cityIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> City / Area</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(val) => {
                      const idx = Number(val);
                      field.onChange(idx);
                      form.setValue("oceanProximity", CA_CITIES[idx].oceanProximity);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Choose a city" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CA_CITIES.map((city, i) => (
                        <SelectItem key={city.name} value={String(i)}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="oceanProximity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROXIMITY_OVERRIDE_OPTIONS.map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medianIncome"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center pb-1">
                    <FormLabel className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Household income</FormLabel>
                    <span className="text-sm font-semibold tabular-nums">${(field.value * 10000).toLocaleString()}</span>
                  </div>
                  <FormControl>
                    <Slider min={0.5} max={15} step={0.1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                  </FormControl>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>$5,000</span><span>$150,000</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="housingMedianAge"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center pb-1">
                    <FormLabel className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> Housing age</FormLabel>
                    <span className="text-sm font-semibold tabular-nums">{field.value} yrs</span>
                  </div>
                  <FormControl>
                    <Slider min={1} max={52} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
                  </FormControl>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>New build</span><span>52 yrs old</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bedroomPreset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BEDROOM_PRESETS.map((p, i) => (
                          <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="districtSizePreset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Neighborhood</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISTRICT_SIZE_PRESETS.map((p, i) => (
                          <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={predictMutation.isPending}>
              {predictMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
                : "Predict Price"}
            </Button>
          </form>
        </Form>

        {result && (
          <div className="mt-8 pt-6 border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Estimated Home Value</p>
              <h3 className="text-4xl font-bold tracking-tight" style={{ color: CHART_COLORS.blue }}>
                ${result.predictedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Model accuracy: <span className="font-semibold text-foreground">{(result.modelAccuracy * 100).toFixed(1)}%</span> R² on held-out test data
              </p>
            </div>

            {pricePct !== null && (
              <div className="mb-5">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>$15k (dataset min)</span>
                  <span>$500k+ (dataset max)</span>
                </div>
                <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "linear-gradient(to right, rgb(26,152,80), rgb(253,174,97), rgb(215,48,39))" }}>
                  <div
                    className="absolute top-0 h-full w-0.5 bg-white shadow-md"
                    style={{ left: `${pricePct * 100}%`, transition: "left 0.6s ease" }}
                  />
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-1">
                  {pricePct < 0.33 ? "Below average" : pricePct < 0.67 ? "Near median" : "Above average"} for California (1990 census)
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-3 text-center">What's driving this estimate</h4>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={result.featureImportance} layout="vertical" margin={{ left: 40, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} width={80} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border p-2 rounded shadow-md text-xs">
                            <span className="font-semibold">{payload[0].payload.feature}:</span>{" "}
                            {((payload[0].value as number) * 100).toFixed(1)}% weight
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {result.featureImportance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.blue} fillOpacity={0.55 + entry.importance * 0.45} />
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

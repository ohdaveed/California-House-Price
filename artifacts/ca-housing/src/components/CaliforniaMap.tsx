import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { interpolateRdYlGn } from "d3-scale-chromatic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HousingDistrict, StarbucksLocation } from "@workspace/api-client-react";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createStarbucksIcon = () =>
  L.divIcon({
    html: `<div style="background-color:#00704A;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg></div>`,
    className: "custom-sbux-icon",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const sbuxIcon = createStarbucksIcon();

const getColor = (value: number, min: number, max: number) => {
  const normalized = 1 - Math.max(0, Math.min(1, (value - min) / (max - min)));
  return interpolateRdYlGn(normalized);
};

interface CaliforniaMapProps {
  loading: boolean;
  districts?: HousingDistrict[];
  starbucks?: StarbucksLocation[];
  isDark: boolean;
}

export function CaliforniaMap({ loading, districts = [], starbucks = [], isDark }: CaliforniaMapProps) {
  const [mounted, setMounted] = useState(false);
  const [showHousing, setShowHousing] = useState(true);
  const [showStarbucks, setShowStarbucks] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Skeleton className="w-full h-[600px] rounded-lg" />;

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-4 pt-4 pb-2 space-y-0">
        <CardTitle className="text-base flex flex-wrap items-center justify-between gap-y-2">
          <span>California Housing Value Map</span>
          <div className="flex flex-wrap items-center gap-3 text-xs font-normal">
            <button
              onClick={() => setShowStarbucks((v) => !v)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors ${
                showStarbucks
                  ? "border-[#00704A]/40 bg-[#00704A]/10 text-[#00704A]"
                  : "border-border text-muted-foreground opacity-50"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#00704A] inline-block" />
              Starbucks
            </button>
            <button
              onClick={() => setShowHousing((v) => !v)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors ${
                showHousing
                  ? "border-border bg-muted/50 text-foreground"
                  : "border-border text-muted-foreground opacity-50"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[rgb(26,152,80)] inline-block" />
              Housing
            </button>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="tabular-nums">$15k</span>
              <div
                className="w-20 h-2 rounded overflow-hidden"
                style={{ background: "linear-gradient(to right, rgb(26,152,80), rgb(253,174,97), rgb(215,48,39))" }}
              />
              <span className="tabular-nums">$500k+</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 pb-4 px-4 min-h-[500px]">
        {loading ? (
          <Skeleton className="w-full h-full rounded-md" />
        ) : (
          <div className="rounded-md overflow-hidden border border-border h-full z-0 relative isolate">
            <MapErrorBoundary>
              <MapContainer
                key={tileUrl}
                center={[37.0, -119.5]}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
                zoomAnimation={false}
              >
                <TileLayer url={tileUrl} />
                {showHousing && districts.map((d) => (
                  <CircleMarker
                    key={`dist-${d.id}`}
                    center={[d.latitude, d.longitude]}
                    radius={4}
                    pathOptions={{
                      fillColor: getColor(d.medianHouseValue, 10000, 500000),
                      color: "transparent",
                      fillOpacity: 0.8,
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold mb-1">${d.medianHouseValue.toLocaleString()}</p>
                        <p>Age: {d.housingMedianAge} yrs</p>
                        <p>Income: ${(d.medianIncome * 10000).toLocaleString()}</p>
                        <p>Pop: {d.population}</p>
                        <p>Region: {d.oceanProximity}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                {showStarbucks && starbucks.map((s) => (
                  <Marker key={`sbux-${s.id}`} position={[s.latitude, s.longitude]} icon={sbuxIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{s.name}</p>
                        <p>{s.city}</p>
                        <p>Opened: {s.openYear || "Unknown"}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </MapErrorBoundary>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

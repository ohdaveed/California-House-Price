import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KPICards } from "@/components/KPICards";
import { CaliforniaMap } from "@/components/CaliforniaMap";
import { ScatterChart } from "@/components/charts/IncomePriceScatter";
import { PriceByRegionBar } from "@/components/charts/PriceByRegionBar";
import { AgeDistributionBar } from "@/components/charts/AgeDistributionBar";
import { StarbucksImpactLine } from "@/components/charts/StarbucksImpactLine";
import { PredictionForm } from "@/components/PredictionForm";

import {
  useGetHousingStats,
  useGetHousingDistricts,
  useGetIncomePriceData,
  useGetPriceByRegion,
  useGetAgeDistribution,
  useGetStarbucksLocations,
  useGetStarbucksPriceImpact,
} from "@workspace/api-client-react";

export function Dashboard() {
  const [isDark, setIsDark] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const { data: statsData, isLoading: loadingStats, isFetching: fetchStats, dataUpdatedAt } = useGetHousingStats();
  const { data: districtsData, isLoading: loadingDist, isFetching: fetchDist } = useGetHousingDistricts({ limit: 500 });
  const { data: incomeData, isLoading: loadingInc, isFetching: fetchInc } = useGetIncomePriceData();
  const { data: regionData, isLoading: loadingReg, isFetching: fetchReg } = useGetPriceByRegion();
  const { data: ageData, isLoading: loadingAge, isFetching: fetchAge } = useGetAgeDistribution();
  const { data: sbuxLocations, isLoading: loadingSbux, isFetching: fetchSbux } = useGetStarbucksLocations();
  const { data: sbuxImpact, isLoading: loadingImpact, isFetching: fetchImpact } = useGetStarbucksPriceImpact();

  const loading = loadingStats || loadingDist || loadingInc || loadingReg || loadingAge || loadingSbux || loadingImpact ||
                  fetchStats || fetchDist || fetchInc || fetchReg || fetchAge || fetchSbux || fetchImpact;

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const lastRefreshed = dataUpdatedAt
    ? (() => {
        const d = new Date(dataUpdatedAt);
        return `${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()} on ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      })()
    : null;

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <DashboardHeader 
          loading={loading} 
          lastRefreshed={lastRefreshed} 
          onRefresh={handleRefresh} 
          isDark={isDark} 
          setIsDark={setIsDark} 
        />

        <KPICards loading={loadingStats || fetchStats} stats={statsData} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="h-[600px]">
              <CaliforniaMap 
                loading={loadingDist || loadingSbux || fetchDist || fetchSbux} 
                districts={districtsData} 
                starbucks={sbuxLocations} 
                isDark={isDark} 
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceByRegionBar loading={loadingReg || fetchReg} data={regionData} isDark={isDark} />
              <AgeDistributionBar loading={loadingAge || fetchAge} data={ageData} isDark={isDark} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScatterChart loading={loadingInc || fetchInc} data={incomeData} isDark={isDark} />
              <StarbucksImpactLine loading={loadingImpact || fetchImpact} data={sbuxImpact} isDark={isDark} />
            </div>
          </div>
          
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <PredictionForm isDark={isDark} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { RefreshCw, ChevronDown, Check, Printer, Sun, Moon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface DashboardHeaderProps {
  loading: boolean;
  lastRefreshed?: string | null;
  onRefresh: () => void;
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

const INTERVAL_OPTIONS = [
  { label: "Off", ms: 0 },
  { label: "Every 10s", ms: 10 * 1000 },
  { label: "Every 30s", ms: 30 * 1000 },
  { label: "Every 1 min", ms: 60 * 1000 },
  { label: "Every 5 min", ms: 5 * 60 * 1000 },
];

export function DashboardHeader({ loading, lastRefreshed, onRefresh, isDark, setIsDark }: DashboardHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoRefreshMs, setAutoRefreshMs] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (loading) {
      setIsSpinning(true);
    } else {
      const t = setTimeout(() => setIsSpinning(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (autoRefreshMs === 0) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries();
    }, autoRefreshMs);
    return () => clearInterval(interval);
  }, [autoRefreshMs, queryClient]);

  const buttonStyle = {
    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
    color: isDark ? "#c8c9cc" : "#4b5563",
  };

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="pt-2">
        <h1 className="font-bold text-[32px] tracking-tight">California Housing Predictor</h1>
        <p className="text-muted-foreground mt-1 text-[15px]">Real-time housing market analytics and predictive modeling</p>
        {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-2">Last refresh: {lastRefreshed}</p>}
      </div>
      <div className="flex items-center gap-3 pt-2 print:hidden">
        {/* Split Refresh Button */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px]"
            style={buttonStyle}
          >
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isSpinning ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <div className="w-px h-4 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center justify-center px-1.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-[30px] w-40 bg-popover border border-border rounded-md shadow-md z-50 overflow-hidden py-1">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => { setAutoRefreshMs(opt.ms); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-muted flex items-center justify-between"
                >
                  <span>{opt.label}</span>
                  {autoRefreshMs === opt.ms && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => window.print()}
          disabled={loading}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
          style={buttonStyle}
          title="Print or Export to PDF"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsDark((d) => !d)}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
          style={buttonStyle}
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

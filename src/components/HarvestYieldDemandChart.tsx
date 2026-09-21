import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  Sprout, 
  BarChart3, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  Wheat, 
  Info,
  Layers
} from 'lucide-react';

interface CropTrendData {
  month: string;
  stage: string;
  wheatYield: number;      // Qtl / Acre
  wheatDemand: number;     // 0-100 index
  wheatPrice: number;      // ₹/Qtl
  soyYield: number;
  soyDemand: number;
  soyPrice: number;
  bajraYield: number;
  bajraDemand: number;
  bajraPrice: number;
  jowarYield: number;
  jowarDemand: number;
  jowarPrice: number;
}

const SEASONAL_DATA: CropTrendData[] = [
  { month: 'Oct 2025', stage: 'Early Sowing & Field Prep', wheatYield: 0, wheatDemand: 62, wheatPrice: 2350, soyYield: 14, soyDemand: 82, soyPrice: 4750, bajraYield: 18, bajraDemand: 74, bajraPrice: 2450, jowarYield: 8, jowarDemand: 65, jowarPrice: 3800 },
  { month: 'Nov 2025', stage: 'Germination & Vegetative', wheatYield: 4, wheatDemand: 66, wheatPrice: 2420, soyYield: 18, soyDemand: 88, soyPrice: 4890, bajraYield: 22, bajraDemand: 79, bajraPrice: 2520, jowarYield: 12, jowarDemand: 69, jowarPrice: 3950 },
  { month: 'Dec 2025', stage: 'Tillering & Crown Root Irrigation', wheatYield: 10, wheatDemand: 71, wheatPrice: 2550, soyYield: 20, soyDemand: 84, soyPrice: 4950, bajraYield: 24, bajraDemand: 76, bajraPrice: 2580, jowarYield: 16, jowarDemand: 74, jowarPrice: 4100 },
  { month: 'Jan 2026', stage: 'Booting & Flowering Cycle', wheatYield: 16, wheatDemand: 78, wheatPrice: 2750, soyYield: 21, soyDemand: 79, soyPrice: 5050, bajraYield: 25, bajraDemand: 71, bajraPrice: 2610, jowarYield: 20, jowarDemand: 80, jowarPrice: 4250 },
  { month: 'Feb 2026', stage: 'Milking & Dough Maturity', wheatYield: 24, wheatDemand: 86, wheatPrice: 2980, soyYield: 22, soyDemand: 83, soyPrice: 5180, bajraYield: 25, bajraDemand: 75, bajraPrice: 2650, jowarYield: 23, jowarDemand: 85, jowarPrice: 4380 },
  { month: 'Mar 2026', stage: 'Rabi Harvest Peak & Threshing', wheatYield: 32, wheatDemand: 95, wheatPrice: 3280, soyYield: 23, soyDemand: 89, soyPrice: 5320, bajraYield: 26, bajraDemand: 82, bajraPrice: 2720, jowarYield: 26, jowarDemand: 92, jowarPrice: 4550 },
  { month: 'Apr 2026', stage: 'APMC Mandi Inflow & Export Rush', wheatYield: 29, wheatDemand: 98, wheatPrice: 3450, soyYield: 23, soyDemand: 94, soyPrice: 5460, bajraYield: 26, bajraDemand: 87, bajraPrice: 2800, jowarYield: 26, jowarDemand: 96, jowarPrice: 4680 },
  { month: 'May 2026', stage: 'Warehouse Holding & Summer Pulse', wheatYield: 22, wheatDemand: 91, wheatPrice: 3380, soyYield: 24, soyDemand: 92, soyPrice: 5400, bajraYield: 27, bajraDemand: 84, bajraPrice: 2780, jowarYield: 25, jowarDemand: 89, jowarPrice: 4600 },
];

type CropKey = 'all' | 'wheat' | 'soy' | 'bajra' | 'jowar';
type MetricView = 'dual' | 'yield' | 'demand' | 'price';

export default function HarvestYieldDemandChart() {
  const [selectedCrop, setSelectedCrop] = useState<CropKey>('wheat');
  const [metricView, setMetricView] = useState<MetricView>('dual');

  const cropLabels: Record<CropKey, { name: string; variety: string; msp: string; badge: string }> = {
    all: { name: 'Composite Agrarian Index', variety: 'All Harvest Strains', msp: '₹2,275 - ₹4,892/Qtl', badge: 'State Overview' },
    wheat: { name: 'Sharbati Gold Wheat', variety: 'Rabi Crop • Grade A+', msp: 'MSP: ₹2,275/Qtl', badge: 'Peak Harvest Ahead' },
    soy: { name: 'Yellow Soybean (JS-335)', variety: 'Kharif/Rabi • Oilseed', msp: 'MSP: ₹4,892/Qtl', badge: 'High Mill Demand' },
    bajra: { name: 'Pearl Millet (Desi Hybrid)', variety: 'Coarse Grain • Nutri-Cereal', msp: 'MSP: ₹2,500/Qtl', badge: 'Export Inflow' },
    jowar: { name: 'Maldandi White Jowar (M-35-1)', variety: 'Dryland Rabi • Premium', msp: 'MSP: ₹3,180/Qtl', badge: 'Baking & Flour Rush' }
  };

  const currentInfo = cropLabels[selectedCrop];

  // Helper to get formatted chart items
  const chartData = SEASONAL_DATA.map((item) => {
    let yieldVal = item.wheatYield;
    let demandVal = item.wheatDemand;
    let priceVal = item.wheatPrice;

    if (selectedCrop === 'soy') {
      yieldVal = item.soyYield;
      demandVal = item.soyDemand;
      priceVal = item.soyPrice;
    } else if (selectedCrop === 'bajra') {
      yieldVal = item.bajraYield;
      demandVal = item.bajraDemand;
      priceVal = item.bajraPrice;
    } else if (selectedCrop === 'jowar') {
      yieldVal = item.jowarYield;
      demandVal = item.jowarDemand;
      priceVal = item.jowarPrice;
    } else if (selectedCrop === 'all') {
      yieldVal = Math.round((item.wheatYield + item.soyYield + item.bajraYield + item.jowarYield) / 4);
      demandVal = Math.round((item.wheatDemand + item.soyDemand + item.bajraDemand + item.jowarDemand) / 4);
      priceVal = Math.round((item.wheatPrice + item.soyPrice + item.bajraPrice + item.jowarPrice) / 4);
    }

    return {
      month: item.month,
      stage: item.stage,
      yieldVal,
      demandVal,
      priceVal,
      // Multi-crop lines for composite view
      wheatYield: item.wheatYield,
      soyYield: item.soyYield,
      bajraYield: item.bajraYield,
      jowarYield: item.jowarYield,
      wheatDemand: item.wheatDemand,
      soyDemand: item.soyDemand,
      bajraDemand: item.bajraDemand,
      jowarDemand: item.jowarDemand,
      wheatPrice: item.wheatPrice,
      soyPrice: item.soyPrice,
      bajraPrice: item.bajraPrice,
      jowarPrice: item.jowarPrice
    };
  });

  // Custom agrarian tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#d8e5da] shadow-xl text-xs space-y-2 min-w-[220px]">
          <div className="border-b border-[#e5ece6] pb-2">
            <span className="font-serif font-bold text-[#14532d] text-sm block">{label}</span>
            <span className="text-[11px] text-[#496552] flex items-center gap-1 mt-0.5">
              <Sprout className="h-3 w-3 text-[#15803d]" />
              {dataPoint.stage}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {(metricView === 'dual' || metricView === 'yield') && (
              <div className="flex items-center justify-between">
                <span className="text-[#3b5343] font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#15803d]"></span>
                  Projected Yield:
                </span>
                <span className="font-bold text-[#14532d] font-mono">
                  {dataPoint.yieldVal} Qtl/Acre ({dataPoint.yieldVal * 2} bags)
                </span>
              </div>
            )}

            {(metricView === 'dual' || metricView === 'demand') && (
              <div className="flex items-center justify-between">
                <span className="text-[#3b5343] font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
                  Market Demand Index:
                </span>
                <span className="font-bold text-amber-800 font-mono">
                  {dataPoint.demandVal} / 100
                </span>
              </div>
            )}

            {(metricView === 'dual' || metricView === 'price') && (
              <div className="flex items-center justify-between pt-1 border-t border-[#f0f4f0]">
                <span className="text-[#3b5343] font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#2563eb]"></span>
                  Mandi Benchmark:
                </span>
                <span className="font-bold text-[#1e40af] font-mono">
                  ₹{dataPoint.priceVal.toLocaleString('en-IN')}/Qtl
                </span>
              </div>
            )}
          </div>

          <div className="pt-1 text-[10px] text-gray-500 italic bg-[#f7faf7] px-2 py-1 rounded-lg">
            {dataPoint.demandVal > 85 
              ? '🔥 Peak trading velocity: Highest spot realization window' 
              : '🌱 Cultivation & growth phase: Moderate storage demand'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#d8e5da] shadow-sm mb-8 relative overflow-hidden">
      
      {/* Background organic glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Header & Controls Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-[#e9efe9]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#15803d] mb-1">
            <TrendingUp className="h-4 w-4 text-[#15803d]" />
            <span>Yield Intelligence & APMC Market Demand Forecast</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#14532d]">
            Projected Crop Yields & Seasonal Market Trends
          </h3>
          <p className="text-xs text-[#496552] mt-0.5 max-w-xl">
            Live Recharts predictive trajectory combining agronomic maturity schedules (Quintals/Acre) with APMC seasonal buyer demand trends.
          </p>
        </div>

        {/* View Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-[#f2f7f3] p-1 rounded-2xl border border-[#d2e2d5]">
            <button
              onClick={() => setMetricView('dual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricView === 'dual' ? 'bg-[#14532d] text-white shadow-xs' : 'text-[#496552] hover:text-[#14532d]'
              }`}
            >
              Yield & Demand
            </button>
            <button
              onClick={() => setMetricView('yield')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricView === 'yield' ? 'bg-[#14532d] text-white shadow-xs' : 'text-[#496552] hover:text-[#14532d]'
              }`}
            >
              Yield Only
            </button>
            <button
              onClick={() => setMetricView('demand')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricView === 'demand' ? 'bg-[#14532d] text-white shadow-xs' : 'text-[#496552] hover:text-[#14532d]'
              }`}
            >
              Demand Curve
            </button>
            <button
              onClick={() => setMetricView('price')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metricView === 'price' ? 'bg-[#14532d] text-white shadow-xs' : 'text-[#496552] hover:text-[#14532d]'
              }`}
            >
              Mandi Rate (₹)
            </button>
          </div>
        </div>
      </div>

      {/* Crop Selection Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-5">
        {(['wheat', 'soy', 'bajra', 'jowar', 'all'] as CropKey[]).map((ck) => (
          <button
            key={ck}
            onClick={() => setSelectedCrop(ck)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              selectedCrop === ck
                ? 'bg-[#14532d] text-white shadow-xs'
                : 'bg-[#f6faf6] text-[#33533b] hover:bg-[#eaf4eb] border border-[#d8e5da]'
            }`}
          >
            <Wheat className={`h-3.5 w-3.5 ${selectedCrop === ck ? 'text-[#fde047]' : 'text-[#15803d]'}`} />
            <span>{cropLabels[ck].name}</span>
          </button>
        ))}
      </div>

      {/* Crop Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-[#f7faf7] rounded-2xl border border-[#e2ede4]">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Crop Strain</span>
          <span className="text-xs font-bold text-[#14532d] block truncate mt-0.5">{currentInfo.name}</span>
          <span className="text-[10px] text-[#15803d] font-medium">{currentInfo.variety}</span>
        </div>

        <div className="p-3 bg-[#f7faf7] rounded-2xl border border-[#e2ede4]">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Govt Support MSP</span>
          <span className="text-xs font-bold text-amber-900 block truncate mt-0.5">{currentInfo.msp}</span>
          <span className="text-[10px] text-amber-700 font-medium">Assured price floor</span>
        </div>

        <div className="p-3 bg-[#f7faf7] rounded-2xl border border-[#e2ede4]">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Projected Peak Yield</span>
          <span className="text-xs font-bold text-[#14532d] block truncate mt-0.5">
            {selectedCrop === 'wheat' ? '32 Qtl/Acre' : selectedCrop === 'soy' ? '24 Qtl/Acre' : selectedCrop === 'bajra' ? '27 Qtl/Acre' : '26 Qtl/Acre'}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">+14% vs district avg</span>
        </div>

        <div className="p-3 bg-[#f7faf7] rounded-2xl border border-[#e2ede4]">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Peak Demand Window</span>
          <span className="text-xs font-bold text-sky-900 block truncate mt-0.5">March - April 2026</span>
          <span className="text-[10px] text-sky-700 font-medium">98/100 demand index</span>
        </div>
      </div>

      {/* Main Recharts Line Chart */}
      <div className="h-72 sm:h-80 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2ee" />
            <XAxis 
              dataKey="month" 
              stroke="#6b8070" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#d8e5da' }}
            />
            
            {/* Left Axis for Yield */}
            {(metricView === 'dual' || metricView === 'yield') && (
              <YAxis 
                yAxisId="yield"
                stroke="#15803d" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#d8e5da' }}
                domain={[0, 40]}
                unit=" Q"
              />
            )}

            {/* Right Axis for Demand Index or Price */}
            {metricView === 'dual' && (
              <YAxis 
                yAxisId="demand"
                orientation="right"
                stroke="#d97706" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#fde68a' }}
                domain={[40, 100]}
                unit="%"
              />
            )}

            {metricView === 'demand' && (
              <YAxis 
                stroke="#d97706" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#fde68a' }}
                domain={[40, 100]}
                unit="%"
              />
            )}

            {metricView === 'price' && (
              <YAxis 
                stroke="#2563eb" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#bfdbfe' }}
                domain={['dataMin - 200', 'dataMax + 200']}
                unit="₹"
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: '10px' }}
            />

            {/* Dual Mode Lines */}
            {metricView === 'dual' && (
              <>
                <Line 
                  yAxisId="yield"
                  type="monotone" 
                  dataKey="yieldVal" 
                  name="Projected Yield (Quintals/Acre)" 
                  stroke="#15803d" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#15803d', stroke: '#fff', strokeWidth: 2 }} 
                  activeDot={{ r: 7, stroke: '#15803d', strokeWidth: 2, fill: '#86efac' }} 
                />
                <Line 
                  yAxisId="demand"
                  type="monotone" 
                  dataKey="demandVal" 
                  name="Seasonal Mandi Demand Index (%)" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 2"
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} 
                  activeDot={{ r: 7, stroke: '#d97706', strokeWidth: 2, fill: '#fef08a' }} 
                />
              </>
            )}

            {/* Yield Only Mode */}
            {metricView === 'yield' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="yieldVal" 
                  name={`${currentInfo.name} Yield (Qtl/Acre)`} 
                  stroke="#15803d" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#15803d', stroke: '#fff', strokeWidth: 2 }} 
                  activeDot={{ r: 7 }} 
                />
                {selectedCrop === 'all' && (
                  <>
                    <Line type="monotone" dataKey="wheatYield" name="Wheat Yield" stroke="#14532d" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="soyYield" name="Soybean Yield" stroke="#0284c7" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="bajraYield" name="Bajra Yield" stroke="#84cc16" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="jowarYield" name="Jowar Yield" stroke="#d97706" strokeWidth={1.5} dot={false} />
                  </>
                )}
              </>
            )}

            {/* Demand Only Mode */}
            {metricView === 'demand' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="demandVal" 
                  name="Mandi Demand Index (0-100)" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} 
                  activeDot={{ r: 7 }} 
                />
                <ReferenceLine y={85} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'High Demand Threshold', fill: '#dc2626', fontSize: 10 }} />
              </>
            )}

            {/* Price Only Mode */}
            {metricView === 'price' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="priceVal" 
                  name="APMC Spot Rate (₹/Quintal)" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} 
                  activeDot={{ r: 7 }} 
                />
                <ReferenceLine y={2275} stroke="#16a34a" strokeDasharray="3 3" label={{ value: 'Wheat MSP ₹2,275', fill: '#16a34a', fontSize: 10 }} />
              </>
            )}

          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Advisory Footer */}
      <div className="mt-4 pt-3.5 border-t border-[#e9efe9] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#496552]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#15803d] shrink-0" />
          <span>
            <strong>Gramonnati Advisory:</strong> Highest realization occurs in late March & April when mandi arrivals peak alongside mill demand. Consider booking transport 10 days in advance.
          </span>
        </div>
        <div className="shrink-0 text-[11px] font-mono text-[#15803d] font-bold bg-[#ecfdf5] px-2.5 py-1 rounded-full border border-[#a7f3d0]">
          Updated Daily via APMC Benchmarks
        </div>
      </div>

    </div>
  );
}

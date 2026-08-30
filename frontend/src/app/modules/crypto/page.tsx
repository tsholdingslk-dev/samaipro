"use client";

import { useState, useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";

type Coin = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change_24h: number;
  market_cap: number;
  volume: number;
  image?: string;
  high_24h?: number;
  low_24h?: number;
};

type NewsArticle = {
  id: string;
  title: string;
  body: string;
  source: string;
  url: string;
  categories: string;
};

type Candle = {
  index: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  type: "bull" | "bear";
  pattern?: string;
};

type Tab = "overview" | "strategy" | "time_prediction" | "candlesticks" | "ai_analysis" | "news" | "coin_research";

export default function CryptoModulePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [coins, setCoins] = useState<Coin[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);

  // Time-Series Prediction state
  const [timePredictSymbol, setTimePredictSymbol] = useState("TRX");
  const [timePredictInterval, setTimePredictInterval] = useState("15m");
  const [timeWindow, setTimeWindow] = useState("7:00 PM - 7:15 PM");
  const [timePredictResult, setTimePredictResult] = useState<any>(null);
  const [loadingTimePredict, setLoadingTimePredict] = useState(false);

  // Candlestick state
  const [selectedCandleSymbol, setSelectedCandleSymbol] = useState("BTC");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [latestPattern, setLatestPattern] = useState("");
  const [candleTrend, setCandleTrend] = useState("");
  const [loadingCandles, setLoadingCandles] = useState(false);
  const [selectedHoverCandle, setSelectedHoverCandle] = useState<Candle | null>(null);
  const [candlestickAiAnalysis, setCandlestickAiAnalysis] = useState("");
  const [loadingCandleAi, setLoadingCandleAi] = useState(false);


  // NY Strategy state
  const [strategySymbol, setStrategySymbol] = useState("EURUSD");
  const [strategyAsset, setStrategyAsset] = useState("forex");
  const [strategyData, setStrategyData] = useState<any>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const runNyStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStrategy(true);
    setStrategyData(null);
    try {
      const res = await apiFetch(`/crypto/strategy/ny-breakout?symbol=${strategySymbol}&asset_type=${strategyAsset}`);
      setStrategyData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStrategy(false);
    }
  };

  useEffect(() => {
    if (activeTab === "strategy" && strategyData && chartContainerRef.current) {
      // Initialize TradingView Lightweight Chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
      }

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 350,
        layout: {
          background: { type: ColorType.Solid, color: "#0f172a" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.1)" },
          horzLines: { color: "rgba(255, 255, 255, 0.1)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        }
      });
      chartInstanceRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#34d399",
        downColor: "#fb7185",
        borderVisible: false,
        wickUpColor: "#34d399",
        wickDownColor: "#fb7185"
      });

      // Map API candle format to lightweight-charts format
      const cData = strategyData.candles.map((c: any) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      
      candlestickSeries.setData(cData);

      // Add Price Lines for 9:30 AM Range, SL, TP, Entry
      candlestickSeries.createPriceLine({
        price: strategyData.range_high,
        color: "rgba(167, 139, 250, 0.6)",
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: "9:30 AM High",
      });
      candlestickSeries.createPriceLine({
        price: strategyData.range_low,
        color: "rgba(167, 139, 250, 0.6)",
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "9:30 AM Low",
      });
      candlestickSeries.createPriceLine({
        price: strategyData.flip_zone,
        color: "#fbbf24",
        lineWidth: 2,
        axisLabelVisible: true,
        title: "Flip Zone (Entry)",
      });
      candlestickSeries.createPriceLine({
        price: strategyData.stop_loss,
        color: "#fb7185",
        lineWidth: 1,
        axisLabelVisible: true,
        title: "Stop Loss",
      });
      candlestickSeries.createPriceLine({
        price: strategyData.take_profit,
        color: "#34d399",
        lineWidth: 1,
        axisLabelVisible: true,
        title: "Take Profit 1:2",
      });

      chart.timeScale().fitContent();
    }
  }, [strategyData, activeTab]);

  // Run Time-Series Price Prediction
  const runTimePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTimePredict(true);
    setTimePredictResult(null);

    try {
      const formData = new FormData();
      formData.append("symbol", timePredictSymbol);
      formData.append("interval", timePredictInterval);
      formData.append("time_window", timeWindow);

      const data = await apiFetch("/crypto/time-series-predict", {
        method: "POST",
        body: formData,
      });

      setTimePredictResult(data);
    } catch (err) {
      console.error("Time prediction failed", err);
    } finally {
      setLoadingTimePredict(false);
    }
  };

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiFocus, setAiFocus] = useState("general");
  const [loadingAi, setLoadingAi] = useState(false);
  const [providerUsed, setProviderUsed] = useState("");

  // Coin research state
  const [searchSymbol, setSearchSymbol] = useState("");
  const [coinReport, setCoinReport] = useState("");
  const [loadingCoinReport, setLoadingCoinReport] = useState(false);

  // Fetch Candlesticks
  const fetchCandlesticks = async (sym: string) => {
    setLoadingCandles(true);
    try {
      const data = await apiFetch(`/crypto/candlesticks?symbol=${sym}&count=16`);
      if (data.candles) {
        setCandles(data.candles);
        setLatestPattern(data.latest_pattern);
        setCandleTrend(data.trend);
        setSelectedHoverCandle(data.candles[data.candles.length - 1]);
      }
    } catch (err) {
      console.error("Failed to fetch candlesticks", err);
    } finally {
      setLoadingCandles(false);
    }
  };

  // Run AI Candlestick Technical Analysis
  const runCandlestickAi = async () => {
    if (!candles.length) return;
    setLoadingCandleAi(true);
    setCandlestickAiAnalysis("");

    try {
      const formData = new FormData();
      formData.append("symbol", selectedCandleSymbol);
      formData.append("pattern", latestPattern || "Standard Candle");

      const data = await apiFetch("/crypto/analyze-candlestick", {
        method: "POST",
        body: formData,
      });

      setCandlestickAiAnalysis(data.analysis || "No technical breakdown available.");
    } catch (err) {
      console.error("Candlestick AI analysis failed", err);
      setCandlestickAiAnalysis("Failed to generate technical analysis.");
    } finally {
      setLoadingCandleAi(false);
    }
  };

  // Fetch Live Market Data
  const fetchMarketData = async () => {
    setLoadingCoins(true);
    try {
      const data = await apiFetch("/crypto/market");
      if (data.coins) setCoins(data.coins);
    } catch (err) {
      console.error("Failed to fetch crypto market data", err);
    } finally {
      setLoadingCoins(false);
    }
  };

  // Fetch Live Crypto News
  const fetchNewsData = async () => {
    setLoadingNews(true);
    try {
      const data = await apiFetch("/crypto/news");
      if (data.articles) setNews(data.articles);
    } catch (err) {
      console.error("Failed to fetch crypto news data", err);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchNewsData();
    fetchCandlesticks("BTC");
  }, []);

  // Run AI Overall Market Analysis
  const runAiAnalysis = async (focusType: string) => {
    setLoadingAi(true);
    setAiFocus(focusType);
    setAiAnalysis("");

    try {
      const formData = new FormData();
      formData.append("focus", focusType);
      formData.append("symbol", "GLOBAL");

      const data = await apiFetch("/crypto/analyze", {
        method: "POST",
        body: formData,
      });

      setAiAnalysis(data.analysis || "No analysis generated.");
      setProviderUsed(data.provider_used || "AI Engine");
    } catch (err) {
      console.error("AI Analysis failed", err);
      setAiAnalysis("Failed to generate AI Market Analysis.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Run AI Coin Deep Research
  const runCoinResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSymbol.trim()) return;

    setLoadingCoinReport(true);
    setCoinReport("");

    try {
      const formData = new FormData();
      formData.append("symbol", searchSymbol.toUpperCase());
      formData.append("focus", "coin_forecast");

      const data = await apiFetch("/crypto/analyze", {
        method: "POST",
        body: formData,
      });

      setCoinReport(data.analysis || "No research report generated.");
    } catch (err) {
      console.error("Coin research failed", err);
      setCoinReport("Failed to generate coin research report.");
    } finally {
      setLoadingCoinReport(false);
    }
  };


  return (
    <div className="page-container" style={{ padding: "1.5rem" }}>
      <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "2.2rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
            🪙 Crypto Market Live Research Studio
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Real-Time Prices, Global Regulatory News, Crash Risk Prediction & AI Market Intelligence
          </p>
        </div>

        {/* Live Top Ticker Strip */}
        {coins.length > 0 && (
          <div style={{
            display: "flex",
            gap: "1rem",
            overflowX: "auto",
            padding: "0.8rem",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            border: "1px solid var(--border)"
          }}>
            {coins.slice(0, 6).map((c) => (
              <div key={c.symbol} style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "150px" }}>
                {c.image && <img src={c.image} alt={c.symbol} style={{ width: "24px", height: "24px" }} />}
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "bold" }}>{c.symbol}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-main)" }}>${c.price.toLocaleString()}</div>
                  <div style={{ fontSize: "0.75rem", color: c.change_24h >= 0 ? "#34d399" : "#fb7185" }}>
                    {c.change_24h >= 0 ? "▲" : "▼"} {Math.abs(c.change_24h)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { key: "overview", label: "📈 Live Market Coins" },
            { key: "strategy", label: "🔥 Pro Trading Signals (ICT)" },
            { key: "time_prediction", label: "⏱️ Time-Based Micro Prediction" },
            { key: "candlesticks", label: "🕯️ Candlestick Studio & Patterns" },
            { key: "ai_analysis", label: "🧠 AI Market & Crash Risk" },
            { key: "news", label: "📰 Crypto News & Regulation" },
            { key: "coin_research", label: "🔍 Coin Deep Research" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as Tab);
                if (tab.key === "candlesticks" && !candles.length) fetchCandlesticks(selectedCandleSymbol);
                if (tab.key === "ai_analysis" && !aiAnalysis) runAiAnalysis("general");
              }}
              className="btn-primary"
              style={{
                background: activeTab === tab.key ? "var(--primary)" : "transparent",
                border: `2px solid var(--primary)`,
                color: activeTab === tab.key ? "white" : "var(--primary)",
                padding: "0.5rem 1.2rem",
                fontSize: "0.9rem",
                borderRadius: "20px"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        
        {/* TAB: NY 9:30 AM BREAKOUT STRATEGY */}
        {activeTab === "strategy" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", color: "var(--primary)" }}>🔥 ICT 9:30 AM NY Breakout & Flip Zone</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>World-Class Algorithm generating exact Entry, Stop Loss, and Take Profit.</p>
              </div>
            </div>

            <form onSubmit={runNyStrategy} style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Asset Class</label>
                <select className="input-field" value={strategyAsset} onChange={(e) => setStrategyAsset(e.target.value)} style={{ width: "100%", marginTop: "0.3rem" }}>
                  <option value="forex">Forex & Metals</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Symbol</label>
                <select className="input-field" value={strategySymbol} onChange={(e) => setStrategySymbol(e.target.value)} style={{ width: "100%", marginTop: "0.3rem" }}>
                  {strategyAsset === "forex" ? (
                    <>
                      <option value="EURUSD">EUR/USD</option>
                      <option value="GBPUSD">GBP/USD</option>
                      <option value="XAUUSD">GOLD (XAU/USD)</option>
                    </>
                  ) : (
                    <>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="SOL">Solana (SOL)</option>
                    </>
                  )}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="submit" className="btn-primary" disabled={loadingStrategy}>
                  {loadingStrategy ? "Scanning Market..." : "🎯 Scan for Signals"}
                </button>
              </div>
            </form>

            {strategyData && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
                {/* Dashboard Metrics */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, padding: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Detected Trend</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: strategyData.trend.includes("Bullish") ? "#34d399" : "#fb7185", marginTop: "0.3rem" }}>
                      {strategyData.trend}
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: "1rem", background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.4)", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Signal Execution</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#60a5fa", marginTop: "0.3rem" }}>
                      {strategyData.entry_signal}
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Risk / Reward</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fbbf24", marginTop: "0.3rem" }}>
                      {strategyData.risk_reward_ratio}
                    </div>
                  </div>
                </div>

                {/* Entry Values */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div style={{ padding: "0.8rem", borderLeft: "3px solid #fbbf24", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ENTRY (Flip Zone)</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{strategyData.flip_zone}</div>
                  </div>
                  <div style={{ padding: "0.8rem", borderLeft: "3px solid #fb7185", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>STOP LOSS</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{strategyData.stop_loss}</div>
                  </div>
                  <div style={{ padding: "0.8rem", borderLeft: "3px solid #34d399", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>TAKE PROFIT</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{strategyData.take_profit}</div>
                  </div>
                </div>

                {/* TradingView Chart Container */}
                <div style={{
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                }}>
                  <div style={{ background: "#1e293b", padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                    <span>{strategySymbol} / {strategyAsset.toUpperCase()} - 5m Timeframe (UTC)</span>
                    <span style={{ color: "#fbbf24" }}>● Live Signal Connected</span>
                  </div>
                  <div ref={chartContainerRef} style={{ width: "100%", height: "350px", position: "relative" }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: TIME-BASED MICRO PREDICTION STUDIO */}
        {activeTab === "time_prediction" && (
          <div>
            <form onSubmit={runTimePrediction} style={{
              background: "rgba(0,0,0,0.3)",
              padding: "1.2rem",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              marginBottom: "1.5rem"
            }}>
              <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem" }}>⏱️ Select Target Asset & Custom Time Interval</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Asset Symbol</label>
                  <select className="input-field" value={timePredictSymbol} onChange={(e) => setTimePredictSymbol(e.target.value)}>
                    <option value="TRX">TRX (TRON)</option>
                    <option value="BTC">BTC (Bitcoin)</option>
                    <option value="ETH">ETH (Ethereum)</option>
                    <option value="SOL">SOL (Solana)</option>
                    <option value="BNB">BNB (Binance Coin)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Time Interval</label>
                  <select className="input-field" value={timePredictInterval} onChange={(e) => setTimePredictInterval(e.target.value)}>
                    <option value="15m">15 Minutes (Micro-Interval)</option>
                    <option value="1h">1 Hour (Short-Term)</option>
                    <option value="4h">4 Hours (Intraday)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Target Time Window</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 7:00 PM - 7:15 PM"
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loadingTimePredict}>
                {loadingTimePredict ? "Running AI Time-Series Prediction Engine..." : "⚡ Generate Time-Series Price Prediction"}
              </button>
            </form>

            {/* PREDICTION METRICS & REPORT DASHBOARD */}
            {timePredictResult && (
              <div className="animate-fade-in">
                {/* Metric Cards Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div style={{ padding: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Predicted Target</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#34d399" }}>
                      ${timePredictResult.predicted_target}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.2rem" }}>
                      +{timePredictResult.change_pct}% Projected
                    </div>
                  </div>

                  <div style={{ padding: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Model Confidence</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#60a5fa" }}>
                      {timePredictResult.confidence}%
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>High-Accuracy Accuracy</div>
                  </div>

                  <div style={{ padding: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Futures Sentiment</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                      <span style={{ color: "#34d399" }}>{timePredictResult.long_ratio}% L</span> / <span style={{ color: "#fb7185" }}>{timePredictResult.short_ratio}% S</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.2rem" }}>Buyers Dominating</div>
                  </div>

                  <div style={{ padding: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Support / Resistance</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "bold" }}>
                      Sup: ${timePredictResult.support}
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#fb7185" }}>
                      Res: ${timePredictResult.resistance}
                    </div>
                  </div>
                </div>

                {/* Detailed AI Analytical Forecast Report */}
                <div style={{
                  padding: "1.5rem",
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  lineHeight: "1.7",
                  fontSize: "0.95rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <h3 style={{ color: "var(--primary)" }}>⏱️ Time-Series Forecast Breakdown ({timePredictResult.time_window})</h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Engine: {timePredictResult.provider_used}</span>
                  </div>
                  {timePredictResult.analysis.split("\n").map((line: string, idx: number) => (
                    <div key={idx} style={{ marginBottom: "0.3rem" }}>{line}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CANDLESTICK STUDIO */}
        {activeTab === "candlesticks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontWeight: "bold" }}>Select Symbol:</span>
                {["BTC", "ETH", "SOL", "BNB", "XRP"].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      setSelectedCandleSymbol(sym);
                      fetchCandlesticks(sym);
                    }}
                    style={{
                      padding: "0.3rem 0.8rem",
                      borderRadius: "15px",
                      background: selectedCandleSymbol === sym ? "var(--primary)" : "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              <button onClick={runCandlestickAi} className="btn-primary" disabled={loadingCandleAi || !candles.length} style={{ fontSize: "0.85rem" }}>
                {loadingCandleAi ? "Analyzing..." : "🤖 AI Technical Pattern Analysis"}
              </button>
            </div>

            {loadingCandles ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading Candlestick chart...</div>
            ) : (
              <div>
                {/* Pattern Alert Badge */}
                <div style={{
                  padding: "0.8rem 1.2rem",
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  borderRadius: "10px",
                  marginBottom: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <strong>Latest Detected Pattern:</strong>{" "}
                    <span style={{ color: "#60a5fa", fontWeight: "bold" }}>{latestPattern || "Consolidation Range"}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Trend: {candleTrend}</div>
                </div>

                {/* SVG Candlestick Chart Renderer */}
                <div style={{
                  background: "#0f172a",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1rem",
                  position: "relative"
                }}>
                  {candles.length > 0 && (() => {
                    const minLow = Math.min(...candles.map(c => c.low));
                    const maxHigh = Math.max(...candles.map(c => c.high));
                    const range = Math.max(maxHigh - minLow, 1);
                    const svgHeight = 260;
                    const svgWidth = 800;
                    const candleWidth = Math.floor(svgWidth / candles.length) - 8;

                    const getY = (price: number) => {
                      return svgHeight - 30 - ((price - minLow) / range) * (svgHeight - 60);
                    };

                    return (
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "260px", overflow: "visible" }}>
                        {/* Horizontal Price Grid Lines */}
                        <line x1="0" y1={getY(maxHigh)} x2={svgWidth} y2={getY(maxHigh)} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                        <line x1="0" y1={getY((maxHigh + minLow) / 2)} x2={svgWidth} y2={getY((maxHigh + minLow) / 2)} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                        <line x1="0" y1={getY(minLow)} x2={svgWidth} y2={getY(minLow)} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

                        {candles.map((c, i) => {
                          const x = i * (candleWidth + 8) + 15;
                          const highY = getY(c.high);
                          const lowY = getY(c.low);
                          const openY = getY(c.open);
                          const closeY = getY(c.close);
                          const bodyTop = Math.min(openY, closeY);
                          const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
                          const isBull = c.close >= c.open;
                          const color = isBull ? "#34d399" : "#fb7185";

                          return (
                            <g
                              key={i}
                              onMouseEnter={() => setSelectedHoverCandle(c)}
                              style={{ cursor: "pointer" }}
                            >
                              {/* Upper and Lower Wick Line */}
                              <line x1={x + candleWidth / 2} y1={highY} x2={x + candleWidth / 2} y2={lowY} stroke={color} strokeWidth="2" />
                              {/* Candle Real Body */}
                              <rect
                                x={x}
                                y={bodyTop}
                                width={candleWidth}
                                height={bodyHeight}
                                fill={color}
                                rx="2"
                              />
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>

                {/* Hover Details Panel */}
                {selectedHoverCandle && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "0.5rem",
                    padding: "0.8rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    fontSize: "0.85rem",
                    textAlign: "center"
                  }}>
                    <div>Open: <strong style={{ color: "var(--text-main)" }}>${selectedHoverCandle.open}</strong></div>
                    <div>High: <strong style={{ color: "#34d399" }}>${selectedHoverCandle.high}</strong></div>
                    <div>Low: <strong style={{ color: "#fb7185" }}>${selectedHoverCandle.low}</strong></div>
                    <div>Close: <strong style={{ color: "var(--text-main)" }}>${selectedHoverCandle.close}</strong></div>
                    <div>Volume: <strong>{selectedHoverCandle.volume.toLocaleString()}</strong></div>
                  </div>
                )}

                {/* AI Candlestick Analysis Output */}
                {candlestickAiAnalysis && (
                  <div style={{
                    padding: "1.2rem",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    lineHeight: "1.7",
                    fontSize: "0.95rem"
                  }}>
                    <h3 style={{ color: "var(--primary)", marginBottom: "0.8rem" }}>AI Candlestick Technical Analysis Breakdown</h3>
                    {candlestickAiAnalysis.split("\n").map((line, idx) => (
                      <div key={idx} style={{ marginBottom: "0.3rem" }}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: OVERVIEW COINS GRID */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.3rem" }}>Live Cryptocurrency Assets</h2>
              <button onClick={fetchMarketData} className="btn-primary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>
                🔄 Refresh Prices
              </button>
            </div>

            {loadingCoins ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading live crypto prices...</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {coins.map((c) => (
                  <div key={c.id} style={{
                    padding: "1rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {c.image && <img src={c.image} alt={c.name} style={{ width: "32px", height: "32px" }} />}
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{c.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.symbol}</div>
                        </div>
                      </div>
                      <span style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        background: c.change_24h >= 0 ? "rgba(52, 211, 153, 0.15)" : "rgba(251, 113, 133, 0.15)",
                        color: c.change_24h >= 0 ? "#34d399" : "#fb7185"
                      }}>
                        {c.change_24h >= 0 ? "+" : ""}{c.change_24h}%
                      </span>
                    </div>

                    <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                      ${c.price ? c.price.toLocaleString() : "N/A"}
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                      <span>Mkt Cap: ${c.market_cap ? (c.market_cap / 1e9).toFixed(2) + "B" : "N/A"}</span>
                      <span>Vol: ${c.volume ? (c.volume / 1e9).toFixed(2) + "B" : "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI MARKET & CRASH RISK ANALYSIS */}
        {activeTab === "ai_analysis" && (
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
              <button onClick={() => runAiAnalysis("general")} className="btn-primary" style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}>
                📊 General Market Health
              </button>
              <button onClick={() => runAiAnalysis("crash_risk")} className="btn-primary" style={{ fontSize: "0.85rem", padding: "0.4rem 1rem", background: "#e11d48", border: "none" }}>
                ⚠️ Crash Risk & Liquidations
              </button>
              <button onClick={() => runAiAnalysis("regulation")} className="btn-primary" style={{ fontSize: "0.85rem", padding: "0.4rem 1rem", background: "#8b5cf6", border: "none" }}>
                ⚖️ Global Regulations Impact
              </button>
            </div>

            {loadingAi ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                🤖 SAM AI is analyzing live prices, headlines & macro indicators...
              </div>
            ) : (
              <div style={{
                padding: "1.5rem",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                lineHeight: "1.7",
                fontSize: "0.95rem"
              }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Engine Used: {providerUsed} | Focus: {aiFocus.toUpperCase()}
                </div>
                {aiAnalysis.split("\n").map((line, i) => (
                  <div key={i} style={{ marginBottom: line.startsWith("#") || line.startsWith("1.") ? "0.8rem" : "0.3rem" }}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CRYPTO NEWS */}
        {activeTab === "news" && (
          <div>
            <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Global Crypto News & Regulatory Headlines</h2>
            {loadingNews ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading crypto news feed...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {news.map((item) => (
                  <div key={item.id} style={{
                    padding: "1rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#60a5fa", marginBottom: "0.4rem" }}>
                      <span>📰 {item.source}</span>
                      <span>{item.categories}</span>
                    </div>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>{item.body}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem", color: "var(--primary)" }}>
                        Read full article →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COIN DEEP RESEARCH */}
        {activeTab === "coin_research" && (
          <div>
            <form onSubmit={runCoinResearch} style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem" }}>
              <input
                type="text"
                className="input-field"
                placeholder="Enter coin symbol (e.g. BTC, ETH, SOL, SUI, PEPE)..."
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary" disabled={loadingCoinReport}>
                {loadingCoinReport ? "Analyzing..." : "🔍 Run AI Research"}
              </button>
            </form>

            {coinReport && (
              <div style={{
                padding: "1.5rem",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                lineHeight: "1.7"
              }}>
                <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>AI Research Report for {searchSymbol.toUpperCase()}</h3>
                {coinReport.split("\n").map((line, i) => (
                  <div key={i} style={{ marginBottom: "0.3rem" }}>{line}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/modules" className="btn-primary" style={{ textDecoration: "none", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            ← Back to Modules
          </Link>
        </div>

      </div>
    </div>
  );
}

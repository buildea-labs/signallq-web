"use client";

import { useEffect, useState } from "react";
import { ToolBackLink } from "@/components/ToolBackLink";
import { useRouter } from "next/navigation";

interface GameData {
  id: string;
  name: string;
  category: "BATTLE_ROYALE" | "FPS_COMPETITIVO" | "MOBA" | "CASUAL" | "CLOUD_GAMING" | "OUTRO";
}

const GAMES: GameData[] = [
  { id: "freefire", name: "Free Fire", category: "BATTLE_ROYALE" },
  { id: "fortnite", name: "Fortnite", category: "BATTLE_ROYALE" },
  { id: "warzone", name: "Call of Duty: Warzone", category: "BATTLE_ROYALE" },
  { id: "apex_legends", name: "Apex Legends", category: "BATTLE_ROYALE" },
  { id: "pubg_battlegrounds", name: "PUBG: Battlegrounds", category: "BATTLE_ROYALE" },
  { id: "valorant", name: "Valorant", category: "FPS_COMPETITIVO" },
  { id: "codm", name: "Call of Duty Mobile", category: "FPS_COMPETITIVO" },
  { id: "ea_fc", name: "EA FC", category: "FPS_COMPETITIVO" },
  { id: "overwatch", name: "Overwatch", category: "FPS_COMPETITIVO" },
  { id: "rainbow_six_siege", name: "Rainbow Six Siege", category: "FPS_COMPETITIVO" },
  { id: "marvel_rivals", name: "Marvel Rivals", category: "FPS_COMPETITIVO" },
  { id: "the_finals", name: "THE FINALS", category: "FPS_COMPETITIVO" },
  { id: "counter_strike_2", name: "Counter-Strike 2", category: "FPS_COMPETITIVO" },
  { id: "rocket_league", name: "Rocket League", category: "FPS_COMPETITIVO" },
  { id: "league_of_legends", name: "League of Legends", category: "MOBA" },
  { id: "dota_2", name: "Dota 2", category: "MOBA" },
  { id: "minecraft", name: "Minecraft", category: "CASUAL" },
  { id: "roblox", name: "Roblox", category: "CASUAL" },
  { id: "genshin_impact", name: "Genshin Impact", category: "CASUAL" },
  { id: "dead_by_daylight", name: "Dead by Daylight", category: "CASUAL" },
  { id: "destiny_2", name: "Destiny 2", category: "CASUAL" },
];

export function JogosModal({ isIntercepted = false }: { isIntercepted?: boolean }) {
  const router = useRouter();
  const [selectedGameId, setSelectedGameId] = useState<string>("valorant");
  const [testResult, setTestResult] = useState<any>(null);
  
  useEffect(() => {
    if (isIntercepted) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isIntercepted]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("signallq_last_result");
      if (stored) {
        setTestResult(JSON.parse(stored));
      }
    }
  }, []);

  const handleClose = () => {
    router.back();
  };
  
  const selectedGame = GAMES.find(g => g.id === selectedGameId);

  // Engine Gamer (simplificada, inspirada no Android)
  let statusGamer = "Indisponvel";
  let statusColor = "var(--text-tertiary)";
  let statusIcon = "help";
  let recomendation = "";

  if (testResult && testResult.latency !== undefined) {
    const ping = testResult.latency;
    const cat = selectedGame?.category;

    if (cat === "FPS_COMPETITIVO" || cat === "BATTLE_ROYALE") {
      if (ping < 30) { statusGamer = "Excelente"; statusColor = "var(--success)"; statusIcon = "check_circle"; }
      else if (ping < 60) { statusGamer = "Bom"; statusColor = "#eab308"; statusIcon = "warning"; } // yellow
      else { statusGamer = "Instvel"; statusColor = "var(--error)"; statusIcon = "error"; }
    } else {
      // Casual e MOBA so mais tolerantes
      if (ping < 50) { statusGamer = "Excelente"; statusColor = "var(--success)"; statusIcon = "check_circle"; }
      else if (ping < 100) { statusGamer = "Bom"; statusColor = "#eab308"; statusIcon = "warning"; }
      else { statusGamer = "Instvel"; statusColor = "var(--error)"; statusIcon = "error"; }
    }
    
    if (testResult.jitter > 15) {
      recomendation = "Seu Jitter est alto. O jogo pode apresentar travamentos (teleportes). Use cabo de rede se possvel.";
      if (statusGamer === "Excelente") { statusGamer = "Bom"; statusColor = "#eab308"; }
    } else {
      recomendation = statusGamer === "Excelente" ? "Conexo perfeita para jogar sem lag!" : "Evite downloads e streaming simultneos para melhorar o ping.";
    }
  }

  const content = (
    <div className="relative bg-[color:var(--bg-card)] border border-[color:var(--border)] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-[500px] w-full mx-4 flex flex-col gap-6 animate-in zoom-in-95 duration-300">
      
      {isIntercepted && <button 
        onClick={handleClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[color:var(--bg-secondary)] hover:bg-[color-mix(in_srgb,_var(--bg-secondary)_80%,_white)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors z-10"
        aria-label="Fechar"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>}

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,_var(--accent)_15%,_transparent)] flex items-center justify-center text-[color:var(--accent)]">
          <span className="material-symbols-outlined text-[28px]">sports_esports</span>
        </div>
        <div>
          <h1 className="m-0 font-bold text-[22px] text-[color:var(--text-primary)]">Modo Gamer</h1>
          <p className="m-0 text-[13px] text-[color:var(--text-secondary)] mt-0.5">Anlise da rede para jogos online</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-bold text-[color:var(--text-primary)]">Qual jogo você quer analisar?</label>
        <select 
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="p-3 bg-[color:var(--bg-secondary)] border border-[color:var(--border)] rounded-xl text-[14px] font-medium outline-none focus:border-[color:var(--accent)] transition-colors"
        >
          {GAMES.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.category.replace('_', ' ')})</option>
          ))}
        </select>
      </div>

      {!testResult || testResult.latency === undefined ? (
        <div className="bg-[color-mix(in_srgb,_var(--warning)_10%,_transparent)] border border-[color-mix(in_srgb,_var(--warning)_30%,_transparent)] rounded-2xl p-4 flex flex-col items-center text-center gap-3 animate-in fade-in">
          <span className="material-symbols-outlined text-[32px] text-[color:var(--warning)]">query_stats</span>
          <h3 className="m-0 font-bold text-[16px] text-[color:var(--text-primary)]">Faltam Dados de Ping</h3>
          <p className="m-0 text-[14px] text-[color:var(--text-secondary)] leading-relaxed">
            Seu ltimo teste no incluiu a latncia completa. Para o motor gamer funcionar perfeitamente, por favor, realize o <b>Diagnóstico Completo</b> na tela inicial.
          </p>
          <button onClick={handleClose} className="mt-2 bg-[color:var(--accent)] text-white font-bold px-6 py-2 rounded-full hover:opacity-90 transition-opacity">
            Ir para Diagnóstico
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-in fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[color:var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[12px] text-[color:var(--text-secondary)] font-medium">Seu Ping</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-[24px] text-[color:var(--text-primary)]">{testResult.latency.toFixed(0)}</span>
                <span className="text-[12px] font-bold text-[color:var(--text-tertiary)]">ms</span>
              </div>
            </div>
            <div className="bg-[color:var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-1">
              <span className="text-[12px] text-[color:var(--text-secondary)] font-medium">Jitter</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-[24px] text-[color:var(--text-primary)]">{testResult.jitter?.toFixed(0) || "--"}</span>
                <span className="text-[12px] font-bold text-[color:var(--text-tertiary)]">ms</span>
              </div>
            </div>
          </div>

          <div 
            className="p-5 rounded-2xl flex flex-col gap-2 border"
            style={{ 
              backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
              borderColor: `color-mix(in srgb, ${statusColor} 30%, transparent)`
            }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: statusColor }}>{statusIcon}</span>
              <h3 className="m-0 font-bold text-[18px]" style={{ color: statusColor }}>{statusGamer}</h3>
            </div>
            <p className="m-0 text-[14px] text-[color:var(--text-primary)] leading-relaxed font-medium">
              {recomendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (isIntercepted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="absolute inset-0" onClick={handleClose} aria-label="Fechar modal" />
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-4 py-12">
      <div className="w-full max-w-[500px] px-4 box-border">
        <ToolBackLink />
      </div>
      {content}
    </div>
  );
}

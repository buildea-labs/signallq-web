"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DnsResult {
  provider: string;
  name: string;
  latencyMs: number | null;
  error?: boolean;
}

const PROVIDERS = [
  { id: "google", name: "Google DNS", url: "https://dns.google/resolve?name=signallq.com" },
  { id: "cloudflare", name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query?name=signallq.com", headers: { accept: "application/dns-json" } },
  { id: "quad9", name: "Quad9", url: "https://dns.quad9.net:5053/dns-query?name=signallq.com", headers: { accept: "application/dns-json" } }
];

export function DnsModal({ isIntercepted = false, activeTutorial }: { isIntercepted?: boolean, activeTutorial?: string }) {
  const router = useRouter();
  const [results, setResults] = useState<DnsResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isIntercepted) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isIntercepted]);

  useEffect(() => {
    // Só roda o benchmark se estiver na aba principal (sem tutorial ativo)
    if (activeTutorial) return;
    
    let isMounted = true;
    const runBenchmark = async () => {
      setLoading(true);
      const promises = PROVIDERS.map(async (prov) => {
        const start = performance.now();
        try {
          const res = await fetch(prov.url, {
            headers: prov.headers || {},
            cache: 'no-store'
          });
          if (!res.ok) throw new Error("Falha HTTP");
          await res.json();
          const end = performance.now();
          return { provider: prov.id, name: prov.name, latencyMs: Math.round(end - start) };
        } catch (e) {
          return { provider: prov.id, name: prov.name, latencyMs: null, error: true };
        }
      });
      
      const res = await Promise.all(promises);
      if (isMounted) {
        // Ordena do menor pro maior ping (ignorando erros)
        setResults(res.sort((a, b) => {
          if (a.latencyMs === null) return 1;
          if (b.latencyMs === null) return -1;
          return a.latencyMs - b.latencyMs;
        }));
        setLoading(false);
      }
    };
    runBenchmark();
    return () => { isMounted = false; };
  }, [activeTutorial]);

  const handleClose = () => {
    router.back();
  };

  const getTutorialContent = (t: string) => {
    switch (t) {
      case "windows":
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="font-bold text-[16px] flex items-center gap-2"><span className="material-symbols-outlined text-[color:var(--accent)]">desktop_windows</span> Windows</h3>
            <ul className="m-0 pl-0 list-none flex flex-col gap-3 text-[14px] text-[color:var(--text-secondary)]">
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">1</span> Pressione Win + R, digite <b>ncpa.cpl</b> e d Enter.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">2</span> Clique com o boto direito na sua rede e v em <b>Propriedades</b>.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">3</span> D duplo clique em <b>Protocolo IP Verso 4 (TCP/IPv4)</b>.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">4</span> Marque "Usar os seguintes endereos de servidor DNS" e insira os IPs.</li>
            </ul>
          </div>
        );
      case "android":
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="font-bold text-[16px] flex items-center gap-2"><span className="material-symbols-outlined text-[color:var(--accent)]">android</span> Android</h3>
            <ul className="m-0 pl-0 list-none flex flex-col gap-3 text-[14px] text-[color:var(--text-secondary)]">
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">1</span> Abra as <b>Configuraes</b> e v em <b>Rede e Internet</b> (ou Conexes).</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">2</span> Toque em <b>DNS Privado</b> (Private DNS).</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">3</span> Escolha <b>Nome do host do provedor de DNS Particular</b>.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">4</span> Digite ex: <b>dns.google</b> ou <b>1dot1dot1dot1.cloudflare-dns.com</b>.</li>
            </ul>
          </div>
        );
      case "ios":
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="font-bold text-[16px] flex items-center gap-2"><span className="material-symbols-outlined text-[color:var(--accent)]">phone_iphone</span> iPhone (iOS)</h3>
            <ul className="m-0 pl-0 list-none flex flex-col gap-3 text-[14px] text-[color:var(--text-secondary)]">
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">1</span> Abra os <b>Ajustes</b> e toque em <b>Wi-Fi</b>.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">2</span> Toque no cone azul <b>( i )</b> ao lado da sua rede conectada.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">3</span> Desa at <b>Configurar DNS</b> e mude para <b>Manual</b>.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">4</span> Apague os antigos, adicione os novos IPs e toque em <b>Salvar</b>.</li>
            </ul>
          </div>
        );
      case "roteador":
        return (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="font-bold text-[16px] flex items-center gap-2"><span className="material-symbols-outlined text-[color:var(--accent)]">router</span> Roteador (Geral)</h3>
            <ul className="m-0 pl-0 list-none flex flex-col gap-3 text-[14px] text-[color:var(--text-secondary)]">
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">1</span> Acesse o IP do roteador (ex: <b>192.168.0.1</b>) no navegador.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">2</span> Faa login com admin/senha (geralmente atrs do aparelho).</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">3</span> Procure as configuraes de <b>DHCP</b> ou <b>Rede LAN / WAN</b>.</li>
              <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-[color:var(--surface-elevated)] flex items-center justify-center font-bold text-[12px]">4</span> Altere os campos <b>DNS Primrio e Secundrio</b> e reinicie.</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  const content = (
    <div className="relative bg-[color:var(--surface)] border border-[color:var(--border)] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-[500px] w-full mx-4 flex flex-col gap-6 animate-in zoom-in-95 duration-300">
      
      <button 
        onClick={handleClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[color:var(--surface-elevated)] hover:bg-[color-mix(in_srgb,_var(--surface-elevated)_80%,_white)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors z-10"
        aria-label="Fechar"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,_var(--accent)_15%,_transparent)] flex items-center justify-center text-[color:var(--accent)]">
          <span className="material-symbols-outlined text-[28px]">dns</span>
        </div>
        <div>
          <h1 className="m-0 font-bold text-[22px] text-[color:var(--text-primary)]">Rotas e DNS</h1>
          <p className="m-0 text-[13px] text-[color:var(--text-secondary)] mt-0.5">Velocidade de acesso aos sites</p>
        </div>
      </div>

      <div className="flex border-b border-[color:var(--border)] gap-6 text-[14px] font-medium overflow-x-auto no-scrollbar">
        <Link href="/dns" scroll={false} className={`pb-2 border-b-2 transition-colors whitespace-nowrap no-underline ${!activeTutorial ? 'border-[color:var(--accent)] text-[color:var(--text-primary)]' : 'border-transparent text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]'}`}>Benchmark</Link>
        <Link href="/dns/windows" scroll={false} className={`pb-2 border-b-2 transition-colors whitespace-nowrap no-underline ${activeTutorial === 'windows' ? 'border-[color:var(--accent)] text-[color:var(--text-primary)]' : 'border-transparent text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]'}`}>Windows</Link>
        <Link href="/dns/android" scroll={false} className={`pb-2 border-b-2 transition-colors whitespace-nowrap no-underline ${activeTutorial === 'android' ? 'border-[color:var(--accent)] text-[color:var(--text-primary)]' : 'border-transparent text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]'}`}>Android</Link>
        <Link href="/dns/ios" scroll={false} className={`pb-2 border-b-2 transition-colors whitespace-nowrap no-underline ${activeTutorial === 'ios' ? 'border-[color:var(--accent)] text-[color:var(--text-primary)]' : 'border-transparent text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]'}`}>iOS</Link>
        <Link href="/dns/roteador" scroll={false} className={`pb-2 border-b-2 transition-colors whitespace-nowrap no-underline ${activeTutorial === 'roteador' ? 'border-[color:var(--accent)] text-[color:var(--text-primary)]' : 'border-transparent text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]'}`}>Roteador</Link>
      </div>

      {!activeTutorial ? (
        <div className="flex flex-col gap-3 animate-in fade-in duration-300">
          <p className="m-0 text-[13px] text-[color:var(--text-secondary)]">Tempo de resposta dos provedores pblicos a partir da sua rede.</p>
          
          <div className="flex flex-col gap-2 mt-2">
            {loading ? (
              <div className="flex flex-col gap-2 opacity-50 animate-pulse">
                {[1,2,3].map(i => (
                  <div key={i} className="h-[64px] rounded-2xl bg-[color:var(--surface-elevated)] w-full"></div>
                ))}
              </div>
            ) : (
              results.map((res, index) => (
                <div key={res.provider} className={`p-4 rounded-2xl flex items-center justify-between border ${index === 0 ? 'bg-[color-mix(in_srgb,_var(--success)_10%,_transparent)] border-[color-mix(in_srgb,_var(--success)_30%,_transparent)]' : 'bg-[color:var(--surface-elevated)] border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[20px] ${index === 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--text-tertiary)]'}`}>
                      {index === 0 ? 'bolt' : 'public'}
                    </span>
                    <div>
                      <h3 className="m-0 font-bold text-[14px] text-[color:var(--text-primary)]">{res.name}</h3>
                      {index === 0 && <span className="text-[11px] font-semibold text-[color:var(--success)] uppercase">Mais Rpido</span>}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-[16px] text-[color:var(--text-primary)]">
                    {res.latencyMs !== null ? `${res.latencyMs} ms` : <span className="text-[color:var(--error)] text-[14px]">Falha</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        getTutorialContent(activeTutorial)
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
    <div className="w-full flex justify-center py-12">
      {content}
    </div>
  );
}

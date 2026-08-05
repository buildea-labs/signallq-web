"use client";

import { useEffect, useState } from "react";
import { ToolBackLink } from "@/components/ToolBackLink";
import { useRouter } from "next/navigation";

export function IpModal({ isIntercepted = false }: { isIntercepted?: boolean }) {
  const router = useRouter();
  const [ipv4, setIpv4] = useState<string | null>(null);
  const [ipv6, setIpv6] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedV4, setCopiedV4] = useState(false);
  const [copiedV6, setCopiedV6] = useState(false);

  useEffect(() => {
    // Lock scroll body if intercepted (modal mode)
    if (isIntercepted) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isIntercepted]);

  useEffect(() => {
    const fetchIps = async () => {
      setLoading(true);
      try {
        // Fetch IPv4
        const res4 = await fetch("https://api.ipify.org?format=json").catch(() => null);
        if (res4 && res4.ok) {
          const data = await res4.json();
          setIpv4(data.ip);
        }

        // Fetch IPv6
        const res6 = await fetch("https://api6.ipify.org?format=json").catch(() => null);
        if (res6 && res6.ok) {
          const data = await res6.json();
          if (data.ip !== ipv4) {
            setIpv6(data.ip);
          }
        }
      } catch (err) {
        console.error("Falha ao buscar IP", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIps();
  }, [ipv4]);

  const handleClose = () => {
    router.back();
  };

  const copyToClipboard = (text: string, type: 'v4' | 'v6') => {
    navigator.clipboard.writeText(text);
    if (type === 'v4') {
      setCopiedV4(true);
      setTimeout(() => setCopiedV4(false), 2000);
    } else {
      setCopiedV6(true);
      setTimeout(() => setCopiedV6(false), 2000);
    }
  };

  const isCGNATLikely = !loading && ipv4 && !ipv6;

  const content = (
    <div className="relative bg-[color:var(--bg-card)] border border-[color:var(--border)] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-[480px] w-full mx-4 flex flex-col gap-6 animate-in zoom-in-95 duration-300">
      
      {isIntercepted && <button 
        onClick={handleClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[color:var(--bg-secondary)] hover:bg-[color-mix(in_srgb,_var(--bg-secondary)_80%,_white)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
        aria-label="Fechar"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>}

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,_var(--accent)_15%,_transparent)] flex items-center justify-center text-[color:var(--accent)]">
          <span className="material-symbols-outlined text-[28px]">public</span>
        </div>
        <div>
          <h1 className="m-0 font-bold text-[22px] text-[color:var(--text-primary)]">Meu IP</h1>
          <p className="m-0 text-[13px] text-[color:var(--text-secondary)] mt-0.5">Identificação na internet</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* IPv4 */}
        <div className="bg-[color:var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">IPv4 Público</span>
          <div className="flex items-center justify-between">
            {loading ? (
              <span className="text-[18px] font-mono text-[color:var(--text-tertiary)] animate-pulse">Carregando...</span>
            ) : ipv4 ? (
              <span className="text-[18px] sm:text-[20px] font-mono font-bold text-[color:var(--text-primary)]">{ipv4}</span>
            ) : (
              <span className="text-[16px] text-[color:var(--error)]">Indisponível</span>
            )}
            
            {!loading && ipv4 && (
              <button 
                onClick={() => copyToClipboard(ipv4, 'v4')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[color-mix(in_srgb,_var(--accent)_15%,_transparent)] text-[color:var(--accent)] hover:bg-[color-mix(in_srgb,_var(--accent)_25%,_transparent)] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">{copiedV4 ? 'check' : 'content_copy'}</span>
                <span className="text-[12px] font-semibold">{copiedV4 ? 'Copiado' : 'Copiar'}</span>
              </button>
            )}
          </div>
        </div>

        {/* IPv6 */}
        <div className="bg-[color:var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">IPv6 Público</span>
          <div className="flex items-center justify-between gap-4">
            {loading ? (
              <span className="text-[18px] font-mono text-[color:var(--text-tertiary)] animate-pulse">Carregando...</span>
            ) : ipv6 ? (
              <span className="text-[14px] sm:text-[16px] font-mono font-bold text-[color:var(--text-primary)] break-all">{ipv6}</span>
            ) : (
              <span className="text-[14px] text-[color:var(--text-tertiary)]">Não detectado ou não suportado pela sua rede</span>
            )}
            
            {!loading && ipv6 && (
              <button 
                onClick={() => copyToClipboard(ipv6, 'v6')}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[color-mix(in_srgb,_var(--accent)_15%,_transparent)] text-[color:var(--accent)] hover:bg-[color-mix(in_srgb,_var(--accent)_25%,_transparent)] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">{copiedV6 ? 'check' : 'content_copy'}</span>
                <span className="text-[12px] font-semibold">{copiedV6 ? 'Copiar' : ''}</span>
              </button>
            )}
          </div>
        </div>

        {/* CGNAT Info */}
        {!loading && (
          <div className={`p-4 rounded-2xl border ${isCGNATLikely ? 'bg-[color-mix(in_srgb,_var(--warning)_10%,_transparent)] border-[color-mix(in_srgb,_var(--warning)_30%,_transparent)]' : 'bg-[color-mix(in_srgb,_var(--success)_10%,_transparent)] border-[color-mix(in_srgb,_var(--success)_30%,_transparent)]'}`}>
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined text-[20px] ${isCGNATLikely ? 'text-[color:var(--warning)]' : 'text-[color:var(--success)]'}`}>
                {isCGNATLikely ? 'router' : 'verified_user'}
              </span>
              <div>
                <h3 className={`m-0 font-bold text-[14px] ${isCGNATLikely ? 'text-[color:var(--warning)]' : 'text-[color:var(--success)]'}`}>
                  {isCGNATLikely ? 'CGNAT Detectado (Provável)' : 'IP Exclusivo / IPv6 Ativo'}
                </h3>
                <p className="m-0 mt-1 text-[12px] text-[color:var(--text-secondary)] leading-relaxed">
                  {isCGNATLikely 
                    ? "Sua rede não possui IPv6 e seu IPv4 provavelmente é compartilhado com outros clientes da operadora (CGNAT). Isso pode causar dificuldades em jogos online, abertura de portas e câmeras de segurança."
                    : "Você possui conectividade IPv6 (ou um IP público direto), garantindo comunicação direta sem compartilhamento forçado de rotas por CGNAT."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );

  // Se for modal, renderizamos com fundo escuro e blur
  if (isIntercepted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="absolute inset-0" onClick={handleClose} aria-label="Fechar modal" />
        {content}
      </div>
    );
  }

  // Se não for modal (acesso direto à página /meu-ip)
  return (
    <div className="w-full flex flex-col items-center gap-4 py-12">
      <div className="w-full max-w-[500px] px-4 box-border">
        <ToolBackLink />
      </div>
      {content}
    </div>
  );
}

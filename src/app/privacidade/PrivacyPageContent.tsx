"use client"

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { PageShell } from '../../components/PageShell'
import {
  AccessibleAccordion,
  HighlightSection,
  IllustrationWrapper,
  InformationGroup,
  InstitutionalHero,
  ReadingLayout,
} from '../../components/institutional/InstitutionalFoundation'

type Platform = 'android' | 'web'

const platformCopy: Record<Platform, { label: string; title: string; summary: string; data: { label: string; value: string }[]; details: { title: string; content: string }[] }> = {
  android: {
    label: 'Android',
    title: 'No aplicativo Android',
    summary: 'O app mede a conexão e recursos de rede do aparelho. Resultados, preferências e perfis ficam no dispositivo; alguns envios só ocorrem conforme o consentimento e o recurso usado.',
    data: [
      { label: 'No aparelho', value: 'Medições, diagnósticos, preferências, perfis de conexão e dados de rede usados pelo app são persistidos em bancos Room/SQLite e DataStore.' },
      { label: 'Permissões', value: 'Internet e estado da rede; Wi‑Fi e localização para recursos de Wi‑Fi; telefonia para métricas móveis quando solicitada; notificações para alertas. O uso depende do recurso e da permissão concedida.' },
      { label: 'Enviado com consentimento', value: 'Eventos de uso, resultados de diagnóstico não contaminados, identificador anônimo do dispositivo, modelo, versão do Android, versão e canal do app podem seguir para Firebase e para o Worker administrativo do SignallQ.' },
      { label: 'Anúncios', value: 'O Google Mobile Ads/AdMob só pode receber pedido de anúncio após o fluxo UMP aplicável. Configuração remota de anúncios usa Firebase Remote Config.' },
    ],
    details: [
      { title: 'Medição, diagnóstico e infraestrutura', content: 'A medição troca tráfego com serviços de rede. O diagnóstico remoto e o ingest usam Workers da Cloudflare quando o recurso aplicável é executado. IPs e metadados técnicos de conexão podem ser processados transitoriamente pela infraestrutura de rede necessária à requisição; isso não equivale a afirmar que o SignallQ os armazena.' },
      { title: 'Analytics e falhas', content: 'O código integra Firebase Analytics e Firebase Crashlytics. O Analytics registra eventos, identificador de sessão e propriedades de ambiente, canal de distribuição e tipo de build; o Crashlytics pode receber dados técnicos de falha conforme o SDK da Firebase. A política não promete anonimato absoluto.' },
      { title: 'Excluir, exportar e controlar', content: 'Em Ajustes > Privacidade, o app oferece limpar histórico, apagar dados locais e resetar o app, com confirmação. No Histórico, as medições podem ser exportadas por período em CSV ou PDF e compartilhadas pelo sistema Android; o arquivo é gerado temporariamente no cache. O consentimento LGPD pode ser alterado em Ajustes > Privacidade; o consentimento de anúncios é administrado pelo fluxo UMP quando aplicável.' },
    ],
  },
  web: {
    label: 'Web/PWA',
    title: 'No site e na PWA',
    summary: 'O navegador mede a conexão, guarda o histórico neste navegador e pode enviar telemetria de uso pelo proxy do site. Não há login nem sincronização em nuvem nesta fase.',
    data: [
      { label: 'No navegador', value: 'IndexedDB guarda medições, metadados declarados e comparações antes/depois. localStorage guarda a decisão de anúncios, o aviso de instalação e um bloqueio temporário de teste. sessionStorage guarda um identificador de telemetria e o contexto, as respostas e o estado do questionário da medição atual.' },
      { label: 'Medição', value: 'Download e upload usam endpoints speed.cloudflare.com; a sondagem de DNS consulta cloudflare-dns.com; a latência pode usar o Worker de sonda configurado. Esses serviços recebem a requisição e o IP público necessário para respondê-la.' },
      { label: 'Telemetria', value: 'O site envia eventos de uso (tipo de evento, identificador de sessão, data, versão e, quando aplicável, tela, recurso ou duração) para /api/track. O servidor Vercel encaminha o pedido autenticado ao Worker administrativo Cloudflare quando SITE_INGEST_KEY está configurada.' },
      { label: 'Cookies e anúncios', value: 'O site não define cookies próprios no código auditado. Se o ID público do AdSense estiver configurado, o script Google só é carregado após consentimento; a Google pode usar seus próprios cookies e tecnologias.' },
    ],
    details: [
      { title: 'Histórico, exclusão e exportação', content: 'O Histórico permite excluir uma medição, apagar uma conexão com seus vínculos ou limpar todos os dados. A exportação gera um arquivo com as medições e comparações selecionadas; nada disso cria sincronização entre navegadores ou aparelhos.' },
      { title: 'Hospedagem, PWA e terceiros', content: 'O Next.js usa handlers no servidor, compatíveis com hospedagem Vercel. A PWA usa um service worker para cache de recursos. Cloudflare é usado pelos endpoints de medição, DNS, Workers e infraestrutura desses serviços. Não foi identificado script de Cloudflare Web Analytics, Firebase, Sentry ou crash reporting no Site/PWA auditado.' },
      { title: 'Consentimento e retirada', content: 'A decisão aceitar/recusar anúncios fica em localStorage e pode ser removida ao limpar os dados do site. Recusar impede o carregamento do script AdSense pelo código. Caso o navegador ou um terceiro mantenha dados próprios, use também os controles do navegador e as políticas desse terceiro.' },
    ],
  },
}

function PlatformDetails({ platform }: { platform: Platform }) {
  const content = platformCopy[platform]
  return (
    <section aria-labelledby={`${platform}-details`} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 id={`${platform}-details`} className="title-large m-0">{content.title}</h2>
        <p className="body-medium m-0 text-pretty">{content.summary}</p>
      </div>
      <InformationGroup items={content.data} />
      <AccessibleAccordion title="Detalhes técnicos" items={content.details} />
    </section>
  )
}

export default function PrivacyPageContent() {
  const [platform, setPlatform] = useState<Platform>('android')
  useEffect(() => {
    const load = () => setPlatform(window.location.hash === '#web-pwa' ? 'web' : 'android')
    load()
    window.addEventListener('hashchange', load)
    return () => window.removeEventListener('hashchange', load)
  }, [])

  const select = (next: Platform) => {
    setPlatform(next)
    window.history.replaceState(null, '', next === 'web' ? '#web-pwa' : '#android')
  }

  return (
    <PageShell contentMax="860px" mobilePadding="pt-7 px-5 pb-10">
      <ReadingLayout className="flex flex-col gap-7">
        <InstitutionalHero
          overline="Privacidade"
          title="Uma política para o SignallQ, com detalhes por plataforma"
          summary="Leia o que é tratado no Android e na Web/PWA, o que fica local e quando há envio a serviços externos."
          meta="Versão 1.0 · Atualizada em 1º de agosto de 2026"
          illustration={<IllustrationWrapper><ShieldCheck size={48} strokeWidth={1.5} /></IllustrationWrapper>}
        />

        <HighlightSection title="Resumo direto">
          <p>O SignallQ trata dados técnicos para medir e explicar a conexão. Android e Web/PWA não usam os mesmos serviços nem guardam dados do mesmo modo. Esta página separa armazenamento local, processamento transitório e envio remoto sem prometer anonimato absoluto.</p>
          <p className="mt-2">
            <strong>Prefere uma leitura mais rápida?</strong> Consulte a nossa <a href="/privacidade/matriz" className="text-[var(--accent)] hover:underline font-medium">Matriz de Privacidade</a> para um resumo detalhado e tabelado.
          </p>
        </HighlightSection>

        <section aria-labelledby="common-policy" className="flex flex-col gap-4">
          <h2 id="common-policy" className="title-large m-0">O que vale para as duas plataformas</h2>
          <InformationGroup items={[
            { label: 'Finalidade', value: 'Executar medições e diagnósticos, manter recursos locais e, quando houver consentimento ou uso do recurso correspondente, melhorar confiabilidade, produto e publicidade.' },
            { label: 'Bases legais', value: 'Execução das funcionalidades solicitadas, consentimento quando exigido e legítimo interesse para segurança e melhoria, sempre conforme a legislação aplicável.' },
            { label: 'Papéis e terceiros', value: 'O SignallQ define a finalidade do seu produto. Provedores como Google, Firebase, Vercel e Cloudflare tratam dados conforme seus serviços e políticas; o papel jurídico exato pode variar pelo serviço e contrato.' },
            { label: 'Segurança e retenção', value: 'Dados locais permanecem até você excluí-los ou limpar o aplicativo/navegador. O código auditado não define um prazo único para dados remotos; eles seguem a configuração e as políticas dos provedores aplicáveis.' },
          ]} />
        </section>

        <section aria-labelledby="platform-selector" className="flex flex-col gap-4">
          <h2 id="platform-selector" className="title-large m-0">Detalhes por plataforma</h2>
          <div role="group" aria-label="Selecionar plataforma" className="flex w-fit rounded-[var(--radius-button)] border p-1" style={{ borderColor: 'var(--border)' }}>
            {(['android', 'web'] as const).map((item) => (
              <button key={item} type="button" aria-pressed={platform === item} onClick={() => select(item)} className="label-large rounded-[calc(var(--radius-button)-2px)] px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]" style={platform === item ? { background: 'var(--accent)', color: 'var(--on-accent)' } : undefined}>
                {platformCopy[item].label}
              </button>
            ))}
          </div>
          <div aria-live="polite"><PlatformDetails platform={platform} /></div>
          <noscript>
            <div className="flex flex-col gap-5">
              <p>Sem JavaScript, os detalhes das duas plataformas continuam disponíveis abaixo.</p>
              <PlatformDetails platform="android" />
              <PlatformDetails platform="web" />
            </div>
          </noscript>
        </section>

        <AccessibleAccordion title="Direitos, contato e alterações" items={[
          { title: 'Seus direitos e como falar conosco', defaultOpen: true, content: <p>Você pode pedir confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamento e revisão de consentimento, conforme a LGPD e os limites aplicáveis. Para dúvidas ou solicitações, escreva para <a href="mailto:suporte@signallq.com">suporte@signallq.com</a>.</p> },
          { title: 'Histórico de alterações', defaultOpen: true, content: <p>Versão 1.0 (1º de agosto de 2026): política unificada criada após auditoria do código Android e Web/PWA. Mudanças relevantes serão registradas nesta seção com a nova data de versão.</p> },
        ]} />
      </ReadingLayout>
    </PageShell>
  )
}

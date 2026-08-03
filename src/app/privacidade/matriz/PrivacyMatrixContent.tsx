import { ShieldAlert } from 'lucide-react'
import { PageShell } from '../../../components/PageShell'
import {
  HighlightSection,
  IllustrationWrapper,
  InstitutionalHero,
  AccessibleAccordion,
} from '../../../components/institutional/InstitutionalFoundation'
import Link from 'next/link'

export default function PrivacyMatrixContent() {
  return (
    <PageShell contentMax="1024px" mobilePadding="pt-7 px-5 pb-10">
      <div className="flex flex-col gap-7 w-full max-w-[1024px]">
        <InstitutionalHero
          overline="Matriz de Privacidade"
          title="Privacidade em Resumo"
          summary="Entenda rapidamente quais dados usamos, onde ficam armazenados e por quê. O SignallQ respeita a transparência e não guarda informações além do necessário."
          illustration={<IllustrationWrapper><ShieldAlert size={48} strokeWidth={1.5} /></IllustrationWrapper>}
        />

        <HighlightSection>
          <p>
            O SignallQ trata dados técnicos para medir e explicar a conexão. Android e Web/PWA não usam os mesmos serviços nem guardam dados do mesmo modo.
            Consulte a <Link href="/privacidade" className="text-[var(--accent)] hover:underline">Política de Privacidade completa</Link> para ver o texto jurídico.
          </p>
        </HighlightSection>

        <section aria-labelledby="matrix-title" className="flex flex-col gap-4">
          <h2 id="matrix-title" className="title-large m-0">Matriz de Dados Tratados</h2>
          
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[color:var(--border)]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[color:var(--bg-secondary)] border-b border-[color:var(--border)]">
                  <th className="p-3 label-large font-medium">Dado / Categoria</th>
                  <th className="p-3 label-large font-medium">Plataforma</th>
                  <th className="p-3 label-large font-medium">Onde fica</th>
                  <th className="p-3 label-large font-medium">Finalidade</th>
                  <th className="p-3 label-large font-medium">Serviço Externo</th>
                  <th className="p-3 label-large font-medium">Retenção / Exclusão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)] body-medium">
                <tr>
                  <td className="p-3 font-medium">Histórico e Medições de Rede</td>
                  <td className="p-3">Android e Web</td>
                  <td className="p-3">Navegador (IndexedDB) ou App (Room)</td>
                  <td className="p-3">Exibir histórico local ao usuário e avaliar evolução</td>
                  <td className="p-3">Cloudflare (Transitório)</td>
                  <td className="p-3">Até exclusão manual ou reset do app/navegador</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Contexto e Preferências Locais</td>
                  <td className="p-3">Android e Web</td>
                  <td className="p-3">Local (Storage/DataStore)</td>
                  <td className="p-3">Salvar consentimentos, temas e questionários</td>
                  <td className="p-3">Nenhum</td>
                  <td className="p-3">Até exclusão manual pelo usuário</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Telemetria (Uso)</td>
                  <td className="p-3">Web e Android</td>
                  <td className="p-3">Servidor SignallQ</td>
                  <td className="p-3">Melhoria do produto e análise de usabilidade</td>
                  <td className="p-3">Vercel (Rota) / Cloudflare (Worker Ingest)</td>
                  <td className="p-3">Regras do provedor (Sem prazo único definido)</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Logs de Falha e Analytics</td>
                  <td className="p-3">Android</td>
                  <td className="p-3">Servidores Firebase</td>
                  <td className="p-3">Diagnóstico de erros, estabilidade e analítica de público</td>
                  <td className="p-3">Firebase Crashlytics & Analytics</td>
                  <td className="p-3">Conforme políticas de retenção do Google</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Consentimento e Anúncios</td>
                  <td className="p-3">Web (e Android UMP)</td>
                  <td className="p-3">Navegador / App</td>
                  <td className="p-3">Monetização e personalização de anúncios</td>
                  <td className="p-3">AdSense / Google AdMob</td>
                  <td className="p-3">Enquanto válido o consentimento; revogável</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="glossary-title" className="flex flex-col gap-4">
          <h2 id="glossary-title" className="title-large m-0">Glossário e Termos Técnicos</h2>
          <AccessibleAccordion items={[
            { title: 'Ingest e Telemetria', content: <p><strong>Ingest</strong> é a porta de entrada de dados; o serviço que recebe e encaminha as informações. <strong>Telemetria</strong> é a medição remota e automática de como o produto é usado, sem identificar a pessoa.</p> },
            { title: 'Resultado contaminado', content: <p>Medição cujo resultado sofreu interferência de gargalos na própria rede local (como Wi-Fi fraco) em vez da conexão do provedor.</p> },
            { title: 'Operador e Controlador', content: <p><strong>Controlador</strong> decide por que e como os dados são tratados. <strong>Operador</strong> realiza o tratamento em nome do controlador.</p> },
            { title: 'Identificador', content: <p>Um código gerado para reconhecer um aparelho ou sessão de uso, sem saber o nome, e-mail ou dados diretos do usuário (anonimização relativa).</p> },
          ]} />
        </section>

        <section aria-labelledby="practical-guide-title" className="flex flex-col gap-4">
          <h2 id="practical-guide-title" className="title-large m-0">Orientação Prática</h2>
          <AccessibleAccordion items={[
            { title: 'Como apagar histórico local', content: <p>No <strong>Android</strong>: vá em Ajustes &gt; Privacidade e selecione &quot;Apagar histórico&quot; ou &quot;Resetar app&quot;. Na <strong>Web</strong>: abra a aba Histórico e clique no botão de lixeira, ou limpe os dados de navegação no próprio navegador.</p> },
            { title: 'Como revisar consentimento', content: <p>Na Web, você pode revogar apagando os dados locais do site. No Android, vá em Ajustes &gt; Privacidade para reabrir o painel de consentimento de anúncios.</p> },
            { title: 'Diferenças entre Android e Web/PWA', content: <p>A Web guarda dados usando recursos do navegador e usa serviços como Vercel/Cloudflare. O Android possui banco de dados próprio e integra SDKs do Google (Firebase, AdMob) de forma nativa.</p> },
            { title: 'Solicitar informações', content: <p>Você tem direitos conforme a LGPD. Para dúvidas sobre o tratamento, envie e-mail para <a href="mailto:suporte@signallq.com">suporte@signallq.com</a>.</p> },
          ]} />
        </section>
      </div>
    </PageShell>
  )
}

import { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { DnsModal } from "@/components/dns/DnsModal";

export async function generateMetadata(props: { params: Promise<{ tutorial: string }> }): Promise<Metadata> {
  const params = await props.params;
  const tutorialName = params.tutorial.charAt(0).toUpperCase() + params.tutorial.slice(1);
  return {
    title: `Como mudar o DNS no ${tutorialName} | SignallQ`,
    description: `Aprenda o passo a passo de como alterar as configurações de DNS no seu dispositivo ${tutorialName} para melhorar a velocidade da sua internet.`,
    alternates: {
      canonical: `https://signallq.com/dns/${params.tutorial}`,
    },
  };
}

export function generateStaticParams() {
  return [
    { tutorial: 'windows' },
    { tutorial: 'android' },
    { tutorial: 'ios' },
    { tutorial: 'roteador' },
  ]
}

export default async function DnsTutorialPage({
  params,
}: {
  params: Promise<{ tutorial: string }>;
}) {
  const { tutorial } = await params;
  return (
    <PageShell align="center" contentMax="860px">
      <DnsModal isIntercepted={false} activeTutorial={tutorial} />
    </PageShell>
  );
}

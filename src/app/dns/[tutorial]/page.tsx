import { Banda } from "@/components/Banda";
import { Metadata } from "next";
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
    <Banda className="py-8 md:py-12 lg:py-16">
      <DnsModal isIntercepted={false} activeTutorial={tutorial} />
    </Banda>
  );
}

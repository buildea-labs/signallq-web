"use client";

import { Banda } from "@/components/Banda";
import { CompleteDiagnosis } from "@/components/home/CompleteDiagnosis";
import { HomeProductContext } from "@/components/home/HomeProductContext";
import { QuickTestJourney } from "@/components/home/QuickTestJourney";
import { useSpeedTestJourney } from "@/hooks/useSpeedTestJourney";

export function TesteVelocidadeClient() {
  const journey = useSpeedTestJourney();

  return (
    <div className="flex w-full flex-col">
      <h1 className="sr-only">Teste de velocidade da sua internet</h1>
      
      <Banda tint="secondary" className="py-12 md:py-16">
        <div className="flex flex-col items-center gap-6 max-w-[860px] mx-auto w-full">
          {!journey.isProblem && !journey.hasVisibleResult && !journey.isRunning && (
            <div className="text-center mb-4">
              <h2 className="text-[color:var(--text-primary)] font-bold text-[28px] md:text-[36px] leading-[1.2]">
                Sua internet está ruim?
              </h2>
              <p className="text-[color:var(--text-secondary)] text-[16px] md:text-[18px] mt-3">
                Faça o teste de velocidade e descubra se o problema é o sinal, o roteador ou a operadora.
              </p>
            </div>
          )}
          <QuickTestJourney journey={journey} />
        </div>
      </Banda>

      {!journey.isProblem && (
        <Banda className="py-8 md:py-12">
          <CompleteDiagnosis journey={journey} />
        </Banda>
      )}

      <div className={journey.isIdle || journey.hasVisibleResult ? "block" : "hidden"}>
        <Banda tint="secondary" className="py-12">
          <HomeProductContext visible={journey.isIdle || journey.hasVisibleResult} />
        </Banda>
      </div>
    </div>
  );
}

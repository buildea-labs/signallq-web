// @ts-nocheck
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // A nova versão só ativa quando a pessoa escolhe Atualizar no app. Isso
  // evita recarga silenciosa durante uma medição ou com dados locais abertos.
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

let claimClientsAfterConfirmedUpdate = false

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SKIP_WAITING') return
  // `clientsClaim` global fica desligado para não trocar o controller de uma
  // aba espontaneamente. A confirmação arma o claim para o próximo activate.
  claimClientsAfterConfirmedUpdate = true
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  // O claim é parte da ativação da versão confirmada, não uma troca de
  // controller durante a instalação ou uma atualização descoberta em fundo.
  if (claimClientsAfterConfirmedUpdate) event.waitUntil(self.clients.claim())
})

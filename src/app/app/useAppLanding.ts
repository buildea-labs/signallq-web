import { SIGNALLQ_TEST_GROUP_URL } from '@/lib/config'
import {
  FEATURE_APP_LANDING_WEB_TEST_CLICADO,
  FEATURE_DOWNLOAD_APP_CLICADO,
  trackFeatureUsed,
} from '@/lib/telemetry'

export function useAppLanding() {
  const entrarNaListaDeTeste = () => {
    trackFeatureUsed(FEATURE_DOWNLOAD_APP_CLICADO)
    window.open(SIGNALLQ_TEST_GROUP_URL, '_blank', 'noopener,noreferrer')
  }

  // CTA secundário ("Testar no navegador agora") — navega para "/" via
  // <Link> normal (não window.open); só registra telemetria separada do
  // clique, distinta do CTA primário do grupo de testadores (#61).
  const testarNoNavegador = () => {
    trackFeatureUsed(FEATURE_APP_LANDING_WEB_TEST_CLICADO)
  }

  return { entrarNaListaDeTeste, testarNoNavegador }
}

import { SIGNALLQ_TEST_GROUP_URL } from '@/lib/config'
import { FEATURE_DOWNLOAD_APP_CLICADO, trackFeatureUsed } from '@/lib/telemetry'

export function useAppLanding() {
  const entrarNaListaDeTeste = () => {
    trackFeatureUsed(FEATURE_DOWNLOAD_APP_CLICADO)
    window.open(SIGNALLQ_TEST_GROUP_URL, '_blank', 'noopener,noreferrer')
  }

  return { entrarNaListaDeTeste }
}

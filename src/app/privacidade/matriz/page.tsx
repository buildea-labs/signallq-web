import type { Metadata } from 'next'
import { PAGE_META } from '../../../lib/pageMetaCatalog'
import { routeMetadata } from '../../../lib/routeMetadata'
import PrivacyMatrixContent from './PrivacyMatrixContent'

export const metadata: Metadata = routeMetadata(PAGE_META['/privacidade/matriz'])

export default function PrivacyMatrixPage() {
  return <PrivacyMatrixContent />
}

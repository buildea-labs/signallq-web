export interface CanonicalOffer {
  id: string; // Unique ID (e.g. CLR202600002868)
  provider: 'CLARO' | 'VIVO' | 'TIM';
  name: string;
  price: number;
  downloadSpeedMbps: number | null;
  uploadSpeedMbps: number | null;
  technology: string[];
  fidelityMonths: number | null;
  coverageIbge: string[]; // List of IBGE codes
  validityStart: string | null;
  validityEnd: string | null;
  rawSource: any; // Keep the original JSON for audit
}

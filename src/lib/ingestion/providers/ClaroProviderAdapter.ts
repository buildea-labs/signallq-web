import AdmZip from 'adm-zip';
import { CanonicalOffer } from '../models/CanonicalOffer';

export class ClaroProviderAdapter {
  private readonly baseUrl = 'https://www.claro.com.br/institucional/regulatorio';
  
  public async fetchAndParseOffers(): Promise<CanonicalOffer[]> {
    console.log('[ClaroAdapter] Fetching regulatory page to find ZIP link...');
    const htmlResponse = await fetch(this.baseUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch regulatory page: ${htmlResponse.statusText}`);
    }
    
    const html = await htmlResponse.text();
    const zipMatch = html.match(/href=['"]([^'"]+pf\.zip)['"]/i);
    
    if (!zipMatch) {
      throw new Error('Could not find pf.zip link on the Claro regulatory page.');
    }
    
    const zipUrl = zipMatch[1].startsWith('http') ? zipMatch[1] : `https://www.claro.com.br${zipMatch[1]}`;
    console.log(`[ClaroAdapter] Found ZIP link: ${zipUrl}`);
    
    console.log('[ClaroAdapter] Downloading ZIP...');
    const zipResponse = await fetch(zipUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!zipResponse.ok) {
      throw new Error(`Failed to download ZIP: ${zipResponse.statusText}`);
    }
    
    const arrayBuffer = await zipResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('[ClaroAdapter] Unzipping in memory...');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    const jsonEntry = zipEntries.find(entry => entry.name.endsWith('.json') && entry.name.includes('ofertasAtualizadas'));
    
    if (!jsonEntry) {
      throw new Error('Could not find the JSON file inside the ZIP.');
    }
    
    console.log(`[ClaroAdapter] Found JSON entry: ${jsonEntry.entryName}. Parsing...`);
    const jsonContent = jsonEntry.getData().toString('utf8');
    const rawData = JSON.parse(jsonContent);
    
    const rawOffers = Array.isArray(rawData) ? rawData : (rawData.ofertas || []);
    console.log(`[ClaroAdapter] Found ${rawOffers.length} total raw offers.`);
    
    const canonicalOffers: CanonicalOffer[] = [];
    
    for (const raw of rawOffers) {
      if (!raw.SCM) continue; // Only process SCM (Banda Larga Fixa)
      
      const scm = raw.SCM;
      let download = null;
      let upload = null;
      
      if (scm.velocidade) {
        if (scm.velocidade.download) download = parseFloat(scm.velocidade.download.replace(',', '.'));
        if (scm.velocidade.upload) upload = parseFloat(scm.velocidade.upload.replace(',', '.'));
      }
      
      let price = 0;
      if (raw.precoSemDescontos) {
        price = parseFloat(String(raw.precoSemDescontos).replace(',', '.'));
      } else if (raw.custoInicial) {
        price = parseFloat(String(raw.custoInicial).replace(',', '.'));
      }
      
      let fidelityMonths = null;
      if (raw.fidelizacao && raw.fidelizacao.tempoFidelizacao) {
        fidelityMonths = parseInt(raw.fidelizacao.tempoFidelizacao, 10);
      }
      
      canonicalOffers.push({
        id: raw.identificadorUnico,
        provider: 'CLARO',
        name: raw.nomeOferta,
        price,
        downloadSpeedMbps: download,
        uploadSpeedMbps: upload,
        technology: scm.listaTecnologia || [],
        fidelityMonths,
        coverageIbge: raw.areasAbrangencia || [],
        validityStart: raw.dataInicioOferta || null,
        validityEnd: raw.dataFimOferta || null,
        rawSource: raw
      });
    }
    
    return canonicalOffers;
  }
}

# Entrada por problema: limite contratual

Status: US #7.

O Site/PWA apresenta cinco relatos do visitante antes da medição: conexão lenta, travando, quedas frequentes, alcance ruim do Wi-Fi e jogos ou chamadas ruins.

Esses relatos não são diagnóstico, classificação ou conclusão. A versão 6 do contrato oficial Android/Cloudflare (`DiagnosticSnapshot`) ainda não define um campo para eles. Por isso, nesta etapa eles acompanham apenas a sessão de medição na interface e a telemetria anônima do funil; o cliente não anexa um atributo ad-hoc ao `POST /api/diagnostic/evaluate`.

Quando o contrato oficial publicar um campo próprio, a adaptação deve ser feita no mapeador de transporte e enviada sem transformar, para que o Worker oficial permaneça a única fonte de perguntas, regras e conclusões.

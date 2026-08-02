import glob
import re

files = [
    "src/app/NotFoundClient.tsx",
    "src/app/dns/DnsClient.tsx",
    "src/app/historico/HistoricoClient.tsx",
    "src/app/internet-boa-mas-travando/InternetBoaMasTravandoClient.tsx",
    "src/app/internet-para-jogos/InternetParaJogosClient.tsx",
    "src/app/jogos/JogosClient.tsx",
    "src/app/lag-em-jogos-online/LagEmJogosOnlineClient.tsx"
]

for fpath in files:
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remove import containing PAGE_META
    content = re.sub(r'import\s+\{\s*PAGE_META\s*\}\s+from\s+[\'"].*?pageMetaCatalog[\'"]\s*\n?', '', content)
    # Remove import containing NOT_FOUND_META
    content = re.sub(r'import\s+\{\s*NOT_FOUND_META\s*\}\s+from\s+[\'"].*?pageMetaCatalog[\'"]\s*\n?', '', content)
    
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)

print("Done fixing imports")

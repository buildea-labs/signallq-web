"use client";

import { useState, useEffect } from "react";

export interface NetworkInfo {
  isp: string | null;
  region: string | null;
  loading: boolean;
}

export function useNetworkInfo() {
  const [info, setInfo] = useState<NetworkInfo>({ isp: null, region: null, loading: true });

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setInfo({
          isp: data.org || data.asn || null,
          region: data.city && data.region ? `${data.city}, ${data.region}` : data.country_name || null,
          loading: false,
        });
      })
      .catch(() => {
        // Falha ou indisponibilidade real: `null`, nunca um placeholder de
        // texto — quem consome decide se omite a linha (#71 §3.1/§3.4.8).
        setInfo({ isp: null, region: null, loading: false });
      });
  }, []);

  return info;
}

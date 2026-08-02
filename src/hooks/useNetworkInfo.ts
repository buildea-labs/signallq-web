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
          isp: data.org || data.asn || "Desconhecido",
          region: data.city && data.region ? `${data.city}, ${data.region}` : data.country_name || "Desconhecido",
          loading: false,
        });
      })
      .catch(() => {
        setInfo({ isp: "Desconhecido", region: "Desconhecido", loading: false });
      });
  }, []);

  return info;
}

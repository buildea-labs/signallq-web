"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { ADSENSE_PUBLISHER_ID } from "../lib/config";
import { getAdConsent, getAdConsentServerSnapshot, subscribeToAdConsent } from "../lib/adConsent";

export function AdSenseScript() {
  const consent = useSyncExternalStore(subscribeToAdConsent, getAdConsent, getAdConsentServerSnapshot);

  if (!ADSENSE_PUBLISHER_ID || consent !== "accepted") return null;

  return (
    <Script
      id="adsbygoogle-loader"
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
    />
  );
}

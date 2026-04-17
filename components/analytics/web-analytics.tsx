import Script from "next/script"

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

/**
 * Scripts opcionales (GA4 y/o Plausible). El tracking propio va por `/api/telemetry/event` (no requiere esto).
 */
export function WebAnalytics() {
  if (!gaId && !plausibleDomain) return null

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { send_page_view: false });
`}
          </Script>
        </>
      ) : null}
      {plausibleDomain ? (
        <Script
          defer
          strategy="afterInteractive"
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
        />
      ) : null}
    </>
  )
}

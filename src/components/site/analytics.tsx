import Script from "next/script";
import { getTrackingSettings } from "@/lib/tracking";
import { isValidGaId, isValidFbPixelId } from "@/lib/tracking-validate";

/**
 * Server-rendered tracking scripts. Renders nothing unless SuperAdmin
 * has enabled tracking and at least one valid ID is configured. The
 * inline <script> bodies interpolate ONLY validator-confirmed IDs —
 * no other request-scoped value is allowed inside them.
 */
export async function Analytics() {
  const { enabled, gaId, fbPixelId } = await getTrackingSettings();
  if (!enabled) return null;

  const ga = gaId && isValidGaId(gaId) ? gaId : null;
  const fb = fbPixelId && isValidFbPixelId(fbPixelId) ? fbPixelId : null;
  if (!ga && !fb) return null;

  return (
    <>
      {ga && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga}');`}
          </Script>
        </>
      )}
      {fb && (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${fb}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${fb}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}

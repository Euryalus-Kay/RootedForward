/* ------------------------------------------------------------------ */
/*  The App Store link, in one place.                                  */
/*                                                                     */
/*  THIS IS THE ONLY FILE TO EDIT WHEN THE APP GOES LIVE. Paste the    */
/*  App Store URL into APP_STORE_URL below and every download button   */
/*  on the site turns from "coming soon" into a real link. Nothing     */
/*  else has to change.                                                */
/*                                                                     */
/*    export const APP_STORE_URL: string | null =                      */
/*      "https://apps.apple.com/us/app/rooted-forward/id0000000000";   */
/*                                                                     */
/*  The buttons live in src/components/app/AppStoreButton.tsx and read */
/*  from here, so they stay in the layout, keep their size, and stay   */
/*  accessible in both states.                                         */
/* ------------------------------------------------------------------ */

export const APP_STORE_URL: string | null = null;

/** True once the link above is filled in. */
export const APP_IS_LIVE = Boolean(APP_STORE_URL);

/* App facts used in copy and in structured data. Keep these true. */
export const APP = {
  name: "Rooted Forward",
  subtitle: "Walk Hyde Park audio tour",
  platform: "iPhone",
  requires: "iOS 17 or newer",
  price: "Free",
  bundleId: "org.rootedforward.walk",
  /* Local screenshots of the real app, exported from the build.
     Regenerate with the ScreenshotTests target in ios/. */
  screenshots: [
    { src: "/media/app/1-home.jpg", alt: "The app's home screen, with the Walk Hyde Park tour card" },
    { src: "/media/app/2-map.jpg", alt: "The tour map, drawn over the 1929 government survey of Hyde Park, with the route and every stop" },
    { src: "/media/app/3-stop.jpg", alt: "A tour stop with its audio player, photographs, and text" },
    { src: "/media/app/4-redplate.jpg", alt: "A red plate naming one instrument of housing segregation, above the walking directions to the next stop" },
  ],
} as const;

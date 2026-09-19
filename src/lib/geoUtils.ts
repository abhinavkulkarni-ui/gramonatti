// Utility functions for In-Site GPS navigation and Google Maps Turn-by-Turn integration

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeolocationResult {
  coords: [number, number];
  accuracy?: number;
  isSimulated: boolean;
  message: string;
}

/**
 * Builds the official Google Maps Turn-by-Turn Navigation URL.
 * When clicked on mobile devices, this directly triggers the Google Maps app
 * in active Turn-by-Turn driving navigation mode.
 * On desktop, it opens the Google Maps Route Planner.
 */
export function getGoogleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  destName?: string,
  originLat?: number,
  originLng?: number
): string {
  const destParam = `${destLat},${destLng}`;
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`;
  
  if (originLat !== undefined && originLng !== undefined) {
    url += `&origin=${originLat},${originLng}`;
  }

  // If a destination name or farm gate label is provided, append it for clear display
  if (destName) {
    url += `&destination_name=${encodeURIComponent(destName)}`;
  }

  return url;
}

/**
 * Builds Google Maps search/pin URL for a given coordinate
 */
export function getGoogleMapsPinUrl(lat: number, lng: number, label?: string): string {
  const q = label ? `${lat},${lng} (${encodeURIComponent(label)})` : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * Safely opens an external link in a new tab without being blocked by iframe sandbox restrictions
 */
export function openExternalUrl(url: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Accurate Haversine Distance calculation in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Default fallback agrarian coordinate hubs in Maharashtra
 */
export const DEFAULT_AGRI_HUBS: Record<string, [number, number]> = {
  Nashik: [19.9975, 73.7898],
  Pune: [18.5204, 73.8567],
  Niphad: [20.0811, 74.1086],
  Baramati: [18.1517, 74.5772],
  Ahmednagar: [19.0948, 74.7480],
  Kolhapur: [16.7050, 74.2433]
};

/**
 * Retrieve saved user GPS coordinates or default to Pune / Nashik agro hub
 */
export function getStoredUserGps(): [number, number] {
  try {
    const stored = localStorage.getItem('gramonnati_user_gps');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 2 && !isNaN(parsed[0]) && !isNaN(parsed[1])) {
        return [parsed[0], parsed[1]];
      }
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.lat && u.lng) {
        return [u.lat, u.lng];
      }
      if (u.district && DEFAULT_AGRI_HUBS[u.district]) {
        return DEFAULT_AGRI_HUBS[u.district];
      }
    }
  } catch (e) {
    // Ignore error
  }
  return DEFAULT_AGRI_HUBS.Nashik;
}

/**
 * Request real device GPS with graceful fallbacks
 */
export async function requestDeviceGps(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      const fallback = getStoredUserGps();
      resolve({
        coords: fallback,
        isSimulated: true,
        message: 'Device does not support GPS hardware. Using region base point.'
      });
      return;
    }

    const tryFetch = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          try {
            localStorage.setItem('gramonnati_user_gps', JSON.stringify(coords));
          } catch (e) {}
          resolve({
            coords,
            accuracy: Math.round(pos.coords.accuracy),
            isSimulated: false,
            message: `Live GPS Locked (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`
          });
        },
        (err) => {
          // If high accuracy timed out, retry with standard accuracy
          if (highAccuracy && err.code === 3) {
            tryFetch(false);
            return;
          }

          const fallback = getStoredUserGps();
          let errReason = 'GPS detection unavailable. Using local agro hub coords.';
          if (err.code === 1) {
            errReason = 'Location permission was denied. Using saved agro coordinates.';
          } else if (err.code === 2) {
            errReason = 'GPS signal lost. Using saved agro hub coordinates.';
          } else if (err.code === 3) {
            errReason = 'GPS request timed out. Using local agro hub coordinates.';
          }

          resolve({
            coords: fallback,
            isSimulated: true,
            message: errReason
          });
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 8000 : 12000,
          maximumAge: 30000
        }
      );
    };

    tryFetch(true);
  });
}

/**
 * Generate turn-by-turn agricultural field milestones
 */
export function generateFieldMilestones(
  jobTitle: string,
  destinationName: string,
  distanceKm: number
): Array<{ step: number; instruction: string; detail: string }> {
  const highwayDist = Math.max(1.5, Math.round(distanceKm * 0.4 * 10) / 10);
  const ruralRoadDist = Math.max(0.8, Math.round(distanceKm * 0.45 * 10) / 10);
  const canalDist = Math.max(0.3, Math.round((distanceKm - highwayDist - ruralRoadDist) * 10) / 10);

  return [
    {
      step: 1,
      instruction: `Depart towards Regional Agrarian Bypass / State Highway`,
      detail: `Proceed straight for ${highwayDist} km past the taluka grain mandi checkpost.`
    },
    {
      step: 2,
      instruction: `Turn onto Canal Field Access Way towards ${destinationName}`,
      detail: `Follow paved rural distributary corridor for ${ruralRoadDist} km along the irrigation canal.`
    },
    {
      step: 3,
      instruction: `Take Farm Gate Approach Track`,
      detail: `Continue for ${canalDist} km to the field perimeter landmark.`
    },
    {
      step: 4,
      instruction: `Arrive at Farm Gate Destination: ${destinationName}`,
      detail: `Marked with Gramonnati harvest flag for "${jobTitle}". Contact producer upon arrival.`
    }
  ];
}

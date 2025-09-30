// Utility functions for location-related operations

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param coord1 First coordinate point
 * @param coord2 Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  
  return Math.round(d * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
}

/**
 * Sort locations by distance from user location
 * @param userLocation User's current location
 * @param locations Array of locations with coordinates
 * @returns Sorted array with distance added to each location
 */
export function sortByDistance<T extends Coordinates>(
  userLocation: Coordinates,
  locations: T[]
): (T & { distance: number; distanceFormatted: string })[] {
  return locations
    .map(location => {
      const distance = calculateDistance(userLocation, location);
      return {
        ...location,
        distance,
        distanceFormatted: formatDistance(distance),
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter locations within a certain radius
 * @param userLocation User's current location
 * @param locations Array of locations with coordinates
 * @param radiusKm Radius in kilometers
 * @returns Filtered locations within radius
 */
export function filterByRadius<T extends Coordinates>(
  userLocation: Coordinates,
  locations: T[],
  radiusKm: number
): T[] {
  return locations.filter(location => 
    calculateDistance(userLocation, location) <= radiusKm
  );
}

/**
 * Get user's approximate city name from coordinates using reverse geocoding
 * Note: This would need a geocoding API like Google Maps or MapBox in production
 * @param coordinates User coordinates
 * @returns Promise<string> City name or fallback
 */
export async function getCityFromCoordinates(coordinates: Coordinates): Promise<string> {
  try {
    // For now, return a placeholder. In production, you'd use:
    // const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.longitude},${coordinates.latitude}.json?access_token=${MAPBOX_TOKEN}`);
    // Parse the response and return the city name
    return `Location (${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)})`;
  } catch (error) {
    console.error('Error getting city from coordinates:', error);
    return 'Unknown Location';
  }
}

/**
 * Generate Google Maps direction URL
 * @param from Origin coordinates
 * @param to Destination coordinates
 * @returns Google Maps URL string
 */
export function getDirectionsUrl(from: Coordinates, to: Coordinates): string {
  return `https://www.google.com/maps/dir/${from.latitude},${from.longitude}/${to.latitude},${to.longitude}`;
}

/**
 * Check if coordinates are valid
 * @param coordinates Coordinates to validate
 * @returns boolean
 */
export function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    typeof coordinates.latitude === 'number' &&
    typeof coordinates.longitude === 'number' &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180 &&
    !isNaN(coordinates.latitude) &&
    !isNaN(coordinates.longitude)
  );
} 
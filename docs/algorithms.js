/**
 * AI-Based Heuristic Route Optimization Algorithms
 * 
 * This module implements heuristic-based route optimization approaches
 * for tourist route planning using REAL ROAD-BASED ROUTING.
 * 
 * Uses OSRM (Open Source Routing Machine) for real road network routing.
 * Routes follow actual roads, paths, and streets - NOT straight lines.
 * 
 * Why Heuristics?
 * - Traditional exhaustive algorithms (like exact TSP solutions) have
 *   exponential time complexity O(n!), making them impractical for real-world
 *   applications with multiple locations.
 * - Heuristic approaches provide good solutions in polynomial time O(n²),
 *   making them scalable and suitable for production systems.
 * - Real-world route planning involves dynamic factors (traffic, weather,
 *   road conditions) that make exact solutions less valuable than adaptive
 *   heuristics.
 */

/**
 * OSRM Routing Service Configuration
 * Using public OSRM demo server for routing
 */
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

/**
 * Map travel mode to OSRM profile
 * @param {string} modeKey - Travel mode key (walk, bike, car)
 * @returns {string} OSRM profile name
 */
function getOSRMProfile(modeKey) {
    const profileMap = {
        'walk': 'foot',      // Walking - allows footpaths, shortcuts, parks
        'bike': 'bike',      // Cycling - allows bike paths, excludes highways
        'car': 'driving'     // Car - only motorable roads, excludes footpaths
    };
    return profileMap[modeKey] || 'driving';
}

/**
 * Get real road-based route between two points using OSRM
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @param {string} profile - OSRM profile (driving, walking, cycling)
 * @returns {Promise<Object>} Route data with distance, duration, and geometry
 */
async function getRealRoute(point1, point2, profile = 'driving') {
    try {
        // OSRM expects coordinates as lng,lat
        const coords = `${point1.lng},${point1.lat};${point2.lng},${point2.lat}`;
        const url = `${OSRM_BASE_URL}/${profile}/${coords}?overview=full&geometries=geojson&steps=false`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OSRM API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('No route found');
        }
        
        const route = data.routes[0];
        
        return {
            distance: route.distance / 1000, // Convert meters to kilometers
            duration: route.duration, // Duration in seconds
            geometry: route.geometry, // GeoJSON LineString geometry
            coordinates: route.geometry.coordinates.map(coord => ({
                lng: coord[0],
                lat: coord[1]
            }))
        };
    } catch (error) {
        console.error('Error fetching route from OSRM:', error);
        // Fallback: return null to indicate route fetch failed
        return null;
    }
}

/**
 * Calculate real road distance between two points
 * Uses OSRM routing engine to get actual road distance
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @param {string} profile - OSRM profile
 * @returns {Promise<number>} Distance in kilometers
 */
async function getRealDistance(point1, point2, profile = 'driving') {
    const route = await getRealRoute(point1, point2, profile);
    if (route) {
        return route.distance;
    }
    // Fallback: approximate distance if routing fails
    return haversineDistance(point1, point2);
}

/**
 * Fallback: Haversine distance (only used as fallback when routing fails)
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
function haversineDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Breadth-First Search (BFS) for reachability analysis using real routes
 * 
 * Demonstrates graph traversal to find all reachable locations
 * from a starting point within a maximum distance threshold using REAL ROAD ROUTES.
 * 
 * This is useful for:
 * - Finding all tourist places reachable from a starting location via real roads
 * - Validating route connectivity on actual road network
 * - Identifying isolated locations that might need special handling
 * 
 * @param {Array} places - Array of place objects with coordinates
 * @param {Object} startPoint - Starting location {lat, lng}
 * @param {number} maxDistance - Maximum distance threshold in km
 * @param {string} profile - OSRM profile for routing
 * @returns {Promise<Array>} Array of reachable place indices
 */
async function bfsReachability(places, startPoint, maxDistance = 100, profile = 'driving') {
    const reachable = [];
    const visited = new Set();
    const queue = [0];
    
    // Find starting place index using real route distance
    let startIndex = 0;
    let minDist = Infinity;
    
    for (let idx = 0; idx < places.length; idx++) {
        const route = await getRealRoute(startPoint, places[idx].coordinates, profile);
        const dist = route ? route.distance : haversineDistance(startPoint, places[idx].coordinates);
        if (dist < minDist) {
            minDist = dist;
            startIndex = idx;
        }
    }
    
    queue[0] = startIndex;
    visited.add(startIndex);
    
    while (queue.length > 0) {
        const currentIdx = queue.shift();
        const currentPlace = places[currentIdx];
        
        // Check if current place is within reachable distance from start using real route
        const routeToStart = await getRealRoute(startPoint, currentPlace.coordinates, profile);
        const distFromStart = routeToStart ? routeToStart.distance : haversineDistance(startPoint, currentPlace.coordinates);
        
        if (distFromStart <= maxDistance) {
            reachable.push(currentIdx);
        }
        
        // Explore neighbors using real route distances
        for (let idx = 0; idx < places.length; idx++) {
            if (!visited.has(idx) && idx !== currentIdx) {
                const route = await getRealRoute(
                    currentPlace.coordinates,
                    places[idx].coordinates,
                    profile
                );
                const dist = route ? route.distance : haversineDistance(
                    currentPlace.coordinates,
                    places[idx].coordinates
                );
                
                if (dist <= maxDistance) {
                    visited.add(idx);
                    queue.push(idx);
                }
            }
        }
    }
    
    return reachable;
}

/**
 * Depth-First Search (DFS) for route exploration
 * 
 * Demonstrates deep exploration of possible routes to understand
 * the solution space. This helps in understanding route complexity
 * and finding alternative paths.
 * 
 * Note: This is for exploration/demonstration purposes. For actual
 * route optimization, we use heuristic methods below.
 * 
 * @param {Array} places - Array of place objects
 * @param {number} startIdx - Starting place index
 * @param {Set} visited - Set of visited indices
 * @param {Array} currentPath - Current path being explored
 * @param {number} maxDepth - Maximum depth to explore
 * @returns {Array} Explored paths
 */
function dfsRouteExploration(places, startIdx, visited = new Set(), currentPath = [], maxDepth = 5) {
    if (currentPath.length >= maxDepth || visited.size === places.length) {
        return [currentPath.slice()];
    }
    
    visited.add(startIdx);
    currentPath.push(startIdx);
    
    const paths = [];
    
    // Explore all unvisited places
    places.forEach((place, idx) => {
        if (!visited.has(idx)) {
            const subPaths = dfsRouteExploration(places, idx, visited, currentPath, maxDepth);
            paths.push(...subPaths);
        }
    });
    
    // If no more paths found, return current path
    if (paths.length === 0) {
        paths.push(currentPath.slice());
    }
    
    visited.delete(startIdx);
    currentPath.pop();
    
    return paths;
}

/**
 * Heuristic-Based Nearest Neighbor Route Optimization using REAL ROAD ROUTES
 * 
 * This is a GREEDY HEURISTIC algorithm that:
 * 1. Always selects the nearest unvisited location based on REAL ROAD DISTANCE
 * 2. Minimizes immediate travel distance using actual road routes (greedy choice)
 * 3. Uses OSRM routing engine to get real road distances, not straight lines
 * 4. Provides O(n²) time complexity vs O(n!) for exhaustive search
 * 
 * Why this heuristic works well:
 * - Uses REAL road distances, not straight-line approximations
 * - Routes follow actual roads, paths, and streets
 * - Different travel modes (walk/bike/car) use appropriate road networks
 * - The algorithm is fast and scalable
 * - Works well with geographic clustering (tourist places in same city)
 * 
 * This is NOT an exact solution but provides near-optimal routes
 * efficiently for practical use cases using REAL ROAD NETWORK DATA.
 * 
 * @param {Array} places - Array of selected place objects with coordinates
 * @param {Object} startPoint - Optional starting location {lat, lng}
 * @param {string} profile - OSRM profile (driving, walking, cycling)
 * @returns {Promise<Object>} Optimized route with order, total distance, route segments, and path
 */
async function heuristicNearestNeighbor(places, startPoint = null, profile = 'driving') {
    if (places.length === 0) {
        return { order: [], totalDistance: 0, path: [], routeSegments: [] };
    }
    
    if (places.length === 1) {
        return {
            order: [0],
            totalDistance: 0,
            path: [places[0].coordinates],
            routeSegments: []
        };
    }
    
    // Initialize
    const unvisited = new Set(places.map((_, idx) => idx));
    const order = [];
    const path = [];
    const routeSegments = []; // Store actual route geometries
    let totalDistance = 0;
    let totalDuration = 0;
    let currentIdx;
    
    // Determine starting point using REAL ROUTE DISTANCE
    if (startPoint) {
        // Find nearest place to start point using real routes
        let minDist = Infinity;
        let nearestIdx = 0;
        
        for (let idx = 0; idx < places.length; idx++) {
            const route = await getRealRoute(startPoint, places[idx].coordinates, profile);
            const dist = route ? route.distance : haversineDistance(startPoint, places[idx].coordinates);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = idx;
            }
        }
        currentIdx = nearestIdx;
        path.push(startPoint);
    } else {
        // Start with first place
        currentIdx = 0;
    }
    
    // Heuristic: Always move to nearest unvisited location using REAL ROAD DISTANCES
    while (unvisited.size > 0) {
        order.push(currentIdx);
        path.push(places[currentIdx].coordinates);
        unvisited.delete(currentIdx);
        
        if (unvisited.size === 0) {
            break;
        }
        
        // Find nearest unvisited place using REAL ROUTE DISTANCE (HEURISTIC DECISION)
        let nearestIdx = null;
        let minDist = Infinity;
        let bestRoute = null;
        
        // Check all unvisited places using real routing
        for (const idx of unvisited) {
            const route = await getRealRoute(
                places[currentIdx].coordinates,
                places[idx].coordinates,
                profile
            );
            
            const dist = route ? route.distance : haversineDistance(
                places[currentIdx].coordinates,
                places[idx].coordinates
            );
            
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = idx;
                bestRoute = route;
            }
        }
        
        // Store route segment if available
        if (bestRoute) {
            routeSegments.push({
                from: currentIdx,
                to: nearestIdx,
                distance: bestRoute.distance,
                duration: bestRoute.duration,
                geometry: bestRoute.geometry,
                coordinates: bestRoute.coordinates
            });
            totalDistance += bestRoute.distance;
            totalDuration += bestRoute.duration;
        } else {
            // Fallback if routing fails
            totalDistance += minDist;
        }
        
        currentIdx = nearestIdx;
    }
    
    return {
        order: order,
        totalDistance: totalDistance,
        totalDuration: totalDuration,
        path: path,
        routeSegments: routeSegments
    };
}

/**
 * Enhanced Heuristic with Distance Threshold Filtering using REAL ROAD ROUTES
 * 
 * This extends the nearest neighbor heuristic by:
 * - Using REAL ROAD-BASED routing (not straight lines)
 * - Identifying routes that exceed distance thresholds based on actual road distance
 * - Marking long-distance segments for special handling
 * - Providing visual feedback (red lines) for far-away places
 * - Storing actual route geometries for map display
 * 
 * @param {Array} places - Array of selected place objects
 * @param {Object} startPoint - Optional starting location
 * @param {number} threshold - Distance threshold in km for marking as "far"
 * @param {string} profile - OSRM profile (driving, walking, cycling)
 * @returns {Promise<Object>} Optimized route with distance markers and real route geometries
 */
async function heuristicOptimizedRoute(places, startPoint = null, threshold = 50, profile = 'driving') {
    const baseRoute = await heuristicNearestNeighbor(places, startPoint, profile);
    const farSegments = [];
    
    // Identify segments that exceed threshold using REAL ROUTE DISTANCES
    baseRoute.routeSegments.forEach((segment, idx) => {
        if (segment.distance > threshold) {
            farSegments.push({
                from: segment.from,
                to: segment.to,
                distance: segment.distance,
                duration: segment.duration
            });
        }
    });
    
    return {
        ...baseRoute,
        farSegments: farSegments,
        threshold: threshold,
        profile: profile
    };
}

/**
 * Calculate travel time based on distance and travel mode
 * Note: When using real routing, duration comes from OSRM and is more accurate
 * @param {number} distanceKm - Distance in kilometers
 * @param {Object} travelMode - Travel mode object with speed property
 * @param {number} durationSeconds - Optional: actual duration from routing engine (in seconds)
 * @returns {number} Time in hours
 */
function calculateTravelTime(distanceKm, travelMode, durationSeconds = null) {
    // If we have actual duration from routing engine, use it
    if (durationSeconds !== null && durationSeconds !== undefined) {
        return durationSeconds / 3600; // Convert seconds to hours
    }
    // Fallback: estimate based on speed
    if (travelMode.speed === 0) return 0;
    return distanceKm / travelMode.speed;
}

/**
 * Calculate estimated cost based on distance and travel mode
 * @param {number} distanceKm - Distance in kilometers
 * @param {Object} travelMode - Travel mode object with costPerKm property
 * @returns {number} Cost in currency units
 */
function calculateTravelCost(distanceKm, travelMode) {
    return distanceKm * travelMode.costPerKm;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getOSRMProfile,
        getRealRoute,
        getRealDistance,
        haversineDistance,
        bfsReachability,
        dfsRouteExploration,
        heuristicNearestNeighbor,
        heuristicOptimizedRoute,
        calculateTravelTime,
        calculateTravelCost
    };
}


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
 * Fast Heuristic-Based Nearest Neighbor Route Optimization
 * 
 * OPTIMIZATION STRATEGY:
 * 1. First: Use Haversine distance for FAST heuristic ordering (instant)
 * 2. Then: Fetch real routes in PARALLEL for the optimized order (much faster)
 * 
 * This approach is MUCH FASTER than fetching routes during optimization:
 * - Heuristic ordering: O(n²) with instant distance calculations
 * - Route fetching: Parallel requests for n-1 segments
 * 
 * @param {Array} places - Array of selected place objects with coordinates
 * @param {Object} startPoint - Optional starting location {lat, lng}
 * @returns {Object} Optimized route order (fast, uses Haversine for ordering)
 */
function fastHeuristicOrdering(places, startPoint = null) {
    if (places.length === 0) {
        return { order: [], path: [], startIndex: null };
    }
    
    if (places.length === 1) {
        return {
            order: [0],
            path: [places[0].coordinates],
            startIndex: 0
        };
    }
    
    const unvisited = new Set(places.map((_, idx) => idx));
    const order = [];
    const path = [];
    let currentIdx;
    let startIndex = null;
    
    // Determine starting point using Haversine (fast)
    if (startPoint) {
        let minDist = Infinity;
        let nearestIdx = 0;
        
        places.forEach((place, idx) => {
            const dist = haversineDistance(startPoint, place.coordinates);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = idx;
            }
        });
        currentIdx = nearestIdx;
        startIndex = nearestIdx;
        path.push(startPoint);
    } else {
        currentIdx = 0;
        startIndex = 0;
    }
    
    // Fast heuristic: Always move to nearest unvisited location (using Haversine)
    while (unvisited.size > 0) {
        order.push(currentIdx);
        path.push(places[currentIdx].coordinates);
        unvisited.delete(currentIdx);
        
        if (unvisited.size === 0) {
            break;
        }
        
        // Find nearest unvisited place (FAST - uses Haversine)
        let nearestIdx = null;
        let minDist = Infinity;
        
        unvisited.forEach(idx => {
            const dist = haversineDistance(
                places[currentIdx].coordinates,
                places[idx].coordinates
            );
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = idx;
            }
        });
        
        currentIdx = nearestIdx;
    }
    
    return {
        order: order,
        path: path,
        startIndex: startIndex
    };
}

/**
 * Fetch real routes in parallel for optimized order
 * @param {Array} places - Array of place objects
 * @param {Array} order - Optimized order of place indices
 * @param {Object} startPoint - Optional starting location
 * @param {string} profile - OSRM profile
 * @returns {Promise<Array>} Array of route segments with real road data
 */
async function fetchRealRoutesInParallel(places, order, startPoint, profile) {
    const routePromises = [];
    
    // Fetch route from start point to first place if startPoint exists
    if (startPoint && order.length > 0) {
        const firstPlaceIdx = order[0];
        routePromises.push(
            getRealRoute(startPoint, places[firstPlaceIdx].coordinates, profile)
                .then(route => ({
                    from: 'start',
                    to: firstPlaceIdx,
                    route: route
                }))
        );
    }
    
    // Fetch routes between consecutive places in optimized order
    for (let i = 0; i < order.length - 1; i++) {
        const fromIdx = order[i];
        const toIdx = order[i + 1];
        
        routePromises.push(
            getRealRoute(
                places[fromIdx].coordinates,
                places[toIdx].coordinates,
                profile
            ).then(route => ({
                from: fromIdx,
                to: toIdx,
                route: route
            }))
        );
    }
    
    // Wait for all routes to be fetched in parallel
    const routeResults = await Promise.all(routePromises);
    
    // Process results into route segments
    const routeSegments = [];
    let totalDistance = 0;
    let totalDuration = 0;
    
    routeResults.forEach(result => {
        if (result.route) {
            routeSegments.push({
                from: result.from,
                to: result.to,
                distance: result.route.distance,
                duration: result.route.duration,
                geometry: result.route.geometry,
                coordinates: result.route.coordinates
            });
            totalDistance += result.route.distance;
            totalDuration += result.route.duration;
        } else {
            // Fallback: use Haversine if route fetch failed
            const fromCoords = result.from === 'start' 
                ? startPoint 
                : places[result.from].coordinates;
            const toCoords = places[result.to].coordinates;
            const dist = haversineDistance(fromCoords, toCoords);
            
            routeSegments.push({
                from: result.from,
                to: result.to,
                distance: dist,
                duration: null,
                geometry: null,
                coordinates: [fromCoords, toCoords]
            });
            totalDistance += dist;
        }
    });
    
    return {
        routeSegments: routeSegments,
        totalDistance: totalDistance,
        totalDuration: totalDuration
    };
}

/**
 * Enhanced Heuristic with Distance Threshold Filtering using REAL ROAD ROUTES
 * 
 * OPTIMIZED APPROACH:
 * 1. Fast heuristic ordering using Haversine (instant)
 * 2. Parallel fetching of real routes (much faster than sequential)
 * 3. Uses REAL ROAD-BASED routing (not straight lines)
 * 4. Identifies routes that exceed distance thresholds
 * 5. Stores actual route geometries for map display
 * 
 * @param {Array} places - Array of selected place objects
 * @param {Object} startPoint - Optional starting location
 * @param {number} threshold - Distance threshold in km for marking as "far"
 * @param {string} profile - OSRM profile (driving, walking, cycling)
 * @returns {Promise<Object>} Optimized route with distance markers and real route geometries
 */
async function heuristicOptimizedRoute(places, startPoint = null, threshold = 50, profile = 'driving') {
    // Step 1: Fast heuristic ordering (instant)
    const optimizedOrder = fastHeuristicOrdering(places, startPoint);
    
    // Step 2: Fetch real routes in parallel (much faster)
    const routeData = await fetchRealRoutesInParallel(
        places,
        optimizedOrder.order,
        startPoint,
        profile
    );
    
    // Identify segments that exceed threshold
    const farSegments = [];
    routeData.routeSegments.forEach((segment) => {
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
        order: optimizedOrder.order,
        path: optimizedOrder.path,
        startIndex: optimizedOrder.startIndex,
        routeSegments: routeData.routeSegments,
        totalDistance: routeData.totalDistance,
        totalDuration: routeData.totalDuration,
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
        fastHeuristicOrdering,
        fetchRealRoutesInParallel,
        heuristicOptimizedRoute,
        calculateTravelTime,
        calculateTravelCost
    };
}


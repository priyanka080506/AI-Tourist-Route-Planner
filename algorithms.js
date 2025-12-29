/**
 * AI-Based Heuristic Route Optimization Algorithms
 * 
 * This module implements heuristic-based route optimization approaches
 * for tourist route planning. These are NOT exact algorithms but rather
 * intelligent heuristics that provide near-optimal solutions efficiently.
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
 * Calculate distance between two geographic points using Haversine formula
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
 * Breadth-First Search (BFS) for reachability analysis
 * 
 * Demonstrates graph traversal to find all reachable locations
 * from a starting point within a maximum distance threshold.
 * 
 * This is useful for:
 * - Finding all tourist places reachable from a starting location
 * - Validating route connectivity
 * - Identifying isolated locations that might need special handling
 * 
 * @param {Array} places - Array of place objects with coordinates
 * @param {Object} startPoint - Starting location {lat, lng}
 * @param {number} maxDistance - Maximum distance threshold in km
 * @returns {Array} Array of reachable place indices
 */
function bfsReachability(places, startPoint, maxDistance = 100) {
    const reachable = [];
    const visited = new Set();
    const queue = [0]; // Start with first place as reference
    
    // Find starting place index
    let startIndex = 0;
    let minDist = Infinity;
    places.forEach((place, idx) => {
        const dist = haversineDistance(startPoint, place.coordinates);
        if (dist < minDist) {
            minDist = dist;
            startIndex = idx;
        }
    });
    
    queue[0] = startIndex;
    visited.add(startIndex);
    
    while (queue.length > 0) {
        const currentIdx = queue.shift();
        const currentPlace = places[currentIdx];
        
        // Check if current place is within reachable distance from start
        const distFromStart = haversineDistance(startPoint, currentPlace.coordinates);
        if (distFromStart <= maxDistance) {
            reachable.push(currentIdx);
        }
        
        // Explore neighbors (all other places)
        places.forEach((place, idx) => {
            if (!visited.has(idx) && idx !== currentIdx) {
                const dist = haversineDistance(
                    currentPlace.coordinates,
                    place.coordinates
                );
                
                // If within reasonable distance, consider it reachable
                if (dist <= maxDistance) {
                    visited.add(idx);
                    queue.push(idx);
                }
            }
        });
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
 * Heuristic-Based Nearest Neighbor Route Optimization
 * 
 * This is a GREEDY HEURISTIC algorithm that:
 * 1. Always selects the nearest unvisited location
 * 2. Minimizes immediate travel distance (greedy choice)
 * 3. Provides O(n²) time complexity vs O(n!) for exhaustive search
 * 
 * Why this heuristic works well:
 * - In most real-world scenarios, local optimization (nearest neighbor)
 *   leads to globally good solutions
 * - The algorithm is fast and scalable
 * - It handles dynamic additions/removals of locations easily
 * - Works well with geographic clustering (tourist places in same city)
 * 
 * This is NOT an exact solution but provides near-optimal routes
 * efficiently for practical use cases.
 * 
 * @param {Array} places - Array of selected place objects with coordinates
 * @param {Object} startPoint - Optional starting location {lat, lng}
 * @returns {Object} Optimized route with order, total distance, and path
 */
function heuristicNearestNeighbor(places, startPoint = null) {
    if (places.length === 0) {
        return { order: [], totalDistance: 0, path: [] };
    }
    
    if (places.length === 1) {
        return {
            order: [0],
            totalDistance: 0,
            path: [places[0].coordinates]
        };
    }
    
    // Initialize
    const unvisited = new Set(places.map((_, idx) => idx));
    const order = [];
    const path = [];
    let totalDistance = 0;
    let currentIdx;
    
    // Determine starting point
    if (startPoint) {
        // Find nearest place to start point
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
        path.push(startPoint);
    } else {
        // Start with first place
        currentIdx = 0;
    }
    
    // Heuristic: Always move to nearest unvisited location
    while (unvisited.size > 0) {
        order.push(currentIdx);
        path.push(places[currentIdx].coordinates);
        unvisited.delete(currentIdx);
        
        if (unvisited.size === 0) {
            break;
        }
        
        // Find nearest unvisited place (HEURISTIC DECISION)
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
        
        // Update total distance and move to next location
        totalDistance += minDist;
        currentIdx = nearestIdx;
    }
    
    return {
        order: order,
        totalDistance: totalDistance,
        path: path
    };
}

/**
 * Enhanced Heuristic with Distance Threshold Filtering
 * 
 * This extends the nearest neighbor heuristic by:
 * - Identifying routes that exceed distance thresholds
 * - Marking long-distance segments for special handling
 * - Providing visual feedback (red lines) for far-away places
 * 
 * @param {Array} places - Array of selected place objects
 * @param {Object} startPoint - Optional starting location
 * @param {number} threshold - Distance threshold in km for marking as "far"
 * @returns {Object} Optimized route with distance markers
 */
function heuristicOptimizedRoute(places, startPoint = null, threshold = 50) {
    const baseRoute = heuristicNearestNeighbor(places, startPoint);
    const farSegments = [];
    
    // Identify segments that exceed threshold
    for (let i = 0; i < baseRoute.path.length - 1; i++) {
        const dist = haversineDistance(
            baseRoute.path[i],
            baseRoute.path[i + 1]
        );
        
        if (dist > threshold) {
            farSegments.push({
                from: i,
                to: i + 1,
                distance: dist
            });
        }
    }
    
    return {
        ...baseRoute,
        farSegments: farSegments,
        threshold: threshold
    };
}

/**
 * Calculate travel time based on distance and travel mode
 * @param {number} distanceKm - Distance in kilometers
 * @param {Object} travelMode - Travel mode object with speed property
 * @returns {number} Time in hours
 */
function calculateTravelTime(distanceKm, travelMode) {
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
        haversineDistance,
        bfsReachability,
        dfsRouteExploration,
        heuristicNearestNeighbor,
        heuristicOptimizedRoute,
        calculateTravelTime,
        calculateTravelCost
    };
}


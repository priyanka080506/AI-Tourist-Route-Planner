/**
 * Main Application Logic for AI-Based Heuristic Tourist Route Planner
 * Handles UI interactions, map rendering, and route visualization
 */

// Global state
let map = null;
let markers = [];
let routePolylines = [];
let distanceLabels = [];
let selectedCity = null;
let selectedPlaces = [];
let currentTravelMode = TRAVEL_MODES.car;
let currentTravelModeKey = 'car'; // Store mode key for OSRM profile
let optimizedRoute = null;

/**
 * Initialize the application
 */
function init() {
    setupCitySelector();
    setupTravelModeSelector();
    setupGenerateButton();
    initializeMap();
}

/**
 * Setup city selector dropdown
 */
function setupCitySelector() {
    const citySelect = document.getElementById('citySelect');
    
    // Populate city options
    Object.keys(CITIES).forEach(cityKey => {
        const city = CITIES[cityKey];
        const option = document.createElement('option');
        option.value = cityKey;
        option.textContent = city.name;
        citySelect.appendChild(option);
    });
    
    // Handle city selection change
    citySelect.addEventListener('change', (e) => {
        selectedCity = e.target.value;
        selectedPlaces = [];
        loadPlacesForCity(selectedCity);
        updateMapCenter();
    });
}

/**
 * Load places for selected city
 */
function loadPlacesForCity(cityKey) {
    const placesContainer = document.getElementById('placesContainer');
    placesContainer.innerHTML = '';
    
    if (!cityKey || !CITIES[cityKey]) {
        // Show empty state
        placesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📍</div>
                <h3>Select a city first</h3>
                <p>Choose a city to see available tourist places</p>
            </div>
        `;
        updateGenerateButtonState();
        return;
    }
    
    const city = CITIES[cityKey];
    
    city.places.forEach(place => {
        const placeItem = document.createElement('div');
        placeItem.className = 'place-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = place.id;
        checkbox.value = place.id;
        checkbox.addEventListener('change', handlePlaceSelection);
        
        const label = document.createElement('label');
        label.htmlFor = place.id;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'place-name';
        nameDiv.textContent = place.name;
        
        const descDiv = document.createElement('div');
        descDiv.className = 'place-desc';
        descDiv.textContent = place.description;
        
        label.appendChild(nameDiv);
        label.appendChild(descDiv);
        
        placeItem.appendChild(checkbox);
        placeItem.appendChild(label);
        placesContainer.appendChild(placeItem);
    });
    
    // Update generate button state
    updateGenerateButtonState();
}

/**
 * Handle place selection checkbox changes
 */
function handlePlaceSelection(e) {
    const placeId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
        if (!selectedPlaces.find(p => p.id === placeId)) {
            const city = CITIES[selectedCity];
            const place = city.places.find(p => p.id === placeId);
            if (place) {
                selectedPlaces.push(place);
            }
        }
    } else {
        selectedPlaces = selectedPlaces.filter(p => p.id !== placeId);
    }
    
    updateGenerateButtonState();
}

/**
 * Setup travel mode selector
 */
function setupTravelModeSelector() {
    const travelModesContainer = document.getElementById('travelModes');
    
    Object.keys(TRAVEL_MODES).forEach(modeKey => {
        const mode = TRAVEL_MODES[modeKey];
        const btn = document.createElement('button');
        btn.className = 'travel-mode-btn';
        btn.type = 'button';
        btn.dataset.mode = modeKey;
        
        if (modeKey === 'car') {
            btn.classList.add('active');
        }
        
        btn.innerHTML = `
            <span class="icon">${mode.icon}</span>
            <span>${mode.name}</span>
        `;
        
        btn.addEventListener('click', async () => {
            // Remove active class from all buttons
            document.querySelectorAll('.travel-mode-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update current travel mode
            currentTravelMode = mode;
            currentTravelModeKey = modeKey;
            
            // Re-generate route with new travel mode if one exists
            if (optimizedRoute && selectedPlaces.length >= 2) {
                await generateRoute();
            }
        });
        
        travelModesContainer.appendChild(btn);
    });
}

/**
 * Update generate button state based on selections
 */
function updateGenerateButtonState() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = selectedPlaces.length < 2;
}

/**
 * Setup generate button
 */
function setupGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', generateRoute);
}

/**
 * Initialize Leaflet map
 */
function initializeMap() {
    try {
        // Default center: Karnataka, India
        map = L.map('map', {
            center: [12.9716, 77.5946],
            zoom: 7,
            zoomControl: true,
            attributionControl: true
        });
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            minZoom: 5
        }).addTo(map);
        
        // Ensure map is properly sized
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);
        
    // Show initial message
    showMapMessage('Select a city and tourist places to generate an optimized route using real road routing');
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        alert('Error loading map. Please refresh the page.');
    }
}

/**
 * Update map center to selected city
 */
function updateMapCenter() {
    if (!selectedCity || !map) return;
    
    const city = CITIES[selectedCity];
    if (city) {
        map.setView([city.coordinates.lat, city.coordinates.lng], 11);
    }
}

/**
 * Generate optimized route using heuristic algorithms with REAL ROAD ROUTING
 */
async function generateRoute() {
    if (selectedPlaces.length < 2) {
        alert('Please select at least 2 tourist places to generate a route.');
        return;
    }
    
    if (!map) {
        console.error('Map not initialized');
        alert('Map is not loaded. Please refresh the page.');
        return;
    }
    
    // Show loading state
    showMapMessage('Fetching real road routes and optimizing...');
    
    // Clear existing markers and routes
    clearMap();
    
    // Get starting point (first selected place or city center)
    const startPoint = selectedPlaces[0]?.coordinates || 
                      (selectedCity ? CITIES[selectedCity].coordinates : null);
    
    if (!startPoint) {
        alert('Unable to determine starting point. Please select a city.');
        hideMapMessage();
        return;
    }
    
    try {
        // Get OSRM profile for current travel mode
        const profile = getOSRMProfile(currentTravelModeKey);
        
        // Use heuristic-based optimization algorithm with REAL ROAD ROUTING
        optimizedRoute = await heuristicOptimizedRoute(
            selectedPlaces,
            startPoint,
            DISTANCE_THRESHOLD_KM,
            profile
        );
        
        if (!optimizedRoute || !optimizedRoute.path || optimizedRoute.path.length < 2) {
            alert('Error generating route. Please try again.');
            hideMapMessage();
            return;
        }
        
        console.log('Route optimized with real road routing:', optimizedRoute);
        console.log('OSRM Profile used:', profile);
        
        // Ensure map is properly sized before rendering
        map.invalidateSize();
        
        // Render the optimized route with actual road geometries
        setTimeout(() => {
            renderRoute();
            displayResults();
        }, 100);
        
    } catch (error) {
        console.error('Error generating route:', error);
        alert('Error generating route: ' + error.message + '\nPlease check your internet connection.');
        hideMapMessage();
    }
}

/**
 * Render route on map with REAL ROAD GEOMETRIES and distance markers
 */
function renderRoute() {
    if (!optimizedRoute || !map) {
        console.error('Cannot render route: optimizedRoute or map is null');
        return;
    }
    
    clearMap();
    
    const routeOrder = optimizedRoute.order;
    const routeSegments = optimizedRoute.routeSegments || [];
    
    if (!routeOrder || routeOrder.length < 2) {
        console.error('Invalid route order');
        return;
    }
    
    // Draw REAL ROAD ROUTE segments using actual geometries from OSRM
    routeSegments.forEach((segment, idx) => {
        if (!segment.geometry || !segment.coordinates || segment.coordinates.length === 0) {
            console.warn('Segment missing geometry, skipping');
            return;
        }
        
        // Determine if this is a far segment
        const isFar = segment.distance > DISTANCE_THRESHOLD_KM;
        
        // Convert coordinates to Leaflet format [lat, lng]
        const latLngs = segment.coordinates.map(coord => [coord.lat, coord.lng]);
        
        // Create polyline using ACTUAL ROAD GEOMETRY (not straight line)
        const polyline = L.polyline(latLngs, {
            color: isFar ? '#ef4444' : '#2563eb',
            weight: 6,
            opacity: 0.85,
            dashArray: isFar ? '10, 10' : null,
            smoothFactor: 1
        }).addTo(map);
        
        routePolylines.push(polyline);
        
        // Add distance label at midpoint of route segment
        const midIndex = Math.floor(latLngs.length / 2);
        const midPoint = latLngs[midIndex];
        
        const distanceLabel = L.marker(midPoint, {
            icon: L.divIcon({
                className: 'distance-label',
                html: `<div style="
                    background: ${isFar ? '#ef4444' : '#2563eb'};
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    white-space: nowrap;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    text-align: center;
                ">${segment.distance.toFixed(1)} km</div>`,
                iconSize: [70, 24],
                iconAnchor: [35, 12]
            })
        }).addTo(map);
        
        distanceLabels.push(distanceLabel);
        
        // Calculate travel time for this segment
        const segmentTime = segment.duration ? (segment.duration / 60).toFixed(0) : 'N/A';
        
        // Add popup with detailed info
        polyline.bindPopup(`
            <strong>Route Segment ${idx + 1}</strong><br>
            <strong>Road Distance:</strong> ${segment.distance.toFixed(2)} km<br>
            <strong>Travel Time:</strong> ${segmentTime} min<br>
            ${isFar ? '<span style="color: #ef4444;">⚠️ Long distance segment</span>' : ''}
            <br><small>Route follows actual roads</small>
        `);
    });
    
    // Add markers for each place in optimized order
    routeOrder.forEach((placeIdx, orderNum) => {
        const place = selectedPlaces[placeIdx];
        if (!place) return;
        
        const marker = L.marker([place.coordinates.lat, place.coordinates.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background: #2563eb;
                    color: white;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                ">${orderNum + 1}</div>`,
                iconSize: [35, 35],
                iconAnchor: [17.5, 17.5]
            })
        }).addTo(map);
        
        // Calculate distance from previous place using real route data
        let distanceInfo = '';
        if (orderNum > 0) {
            const prevPlaceIdx = routeOrder[orderNum - 1];
            // Find the route segment connecting previous to current
            const segment = optimizedRoute.routeSegments.find(s => 
                s.from === prevPlaceIdx && s.to === placeIdx
            );
            if (segment) {
                const timeMin = segment.duration ? (segment.duration / 60).toFixed(0) : 'N/A';
                distanceInfo = `<br><strong>Road Distance:</strong> ${segment.distance.toFixed(2)} km<br><strong>Travel Time:</strong> ${timeMin} min`;
            }
        }
        
        marker.bindPopup(`
            <strong>Stop ${orderNum + 1}: ${place.name}</strong><br>
            ${place.description}${distanceInfo}
        `);
        
        markers.push(marker);
    });
    
    // Fit map to show all markers and routes
    if (markers.length > 0) {
        const allFeatures = [...markers];
        // Add route polylines if they exist
        routePolylines.forEach(polyline => {
            if (polyline && map.hasLayer(polyline)) {
                allFeatures.push(polyline);
            }
        });
        
        if (allFeatures.length > 0) {
            const group = new L.featureGroup(allFeatures);
            try {
                map.fitBounds(group.getBounds().pad(0.15));
            } catch (e) {
                console.warn('Error fitting bounds:', e);
                // Fallback: fit to markers only
                if (markers.length > 0) {
                    const markerGroup = new L.featureGroup(markers);
                    map.fitBounds(markerGroup.getBounds().pad(0.1));
                }
            }
        }
    }
    
    // Hide loading message
    hideMapMessage();
    
    console.log('Route rendered successfully with', routePolylines.length, 'real road route segments');
}

/**
 * Display route results and statistics
 */
function displayResults() {
    if (!optimizedRoute) return;
    
    const resultsPanel = document.getElementById('resultsPanel');
    resultsPanel.classList.remove('hidden');
    
    // Calculate statistics using REAL ROUTE DATA
    const totalDistance = optimizedRoute.totalDistance;
    // Use actual duration from routing engine if available
    const totalTime = optimizedRoute.totalDuration 
        ? calculateTravelTime(totalDistance, currentTravelMode, optimizedRoute.totalDuration)
        : calculateTravelTime(totalDistance, currentTravelMode);
    const totalCost = calculateTravelCost(totalDistance, currentTravelMode);
    
    // Update statistics
    document.getElementById('totalDistance').textContent = totalDistance.toFixed(2);
    document.getElementById('totalTime').textContent = formatTime(totalTime);
    document.getElementById('totalCost').textContent = totalCost > 0 ? `₹${totalCost.toFixed(2)}` : 'N/A';
    document.getElementById('placesCount').textContent = selectedPlaces.length;
    
    // Display route order
    const routeList = document.getElementById('routeList');
    routeList.innerHTML = '';
    
    optimizedRoute.order.forEach((placeIdx, orderNum) => {
        const place = selectedPlaces[placeIdx];
        if (!place) return;
        
        // Calculate distance from previous place using REAL ROUTE DATA
        let distanceText = '';
        if (orderNum > 0) {
            const prevPlaceIdx = optimizedRoute.order[orderNum - 1];
            // Find the route segment connecting previous to current
            const segment = optimizedRoute.routeSegments.find(s => 
                s.from === prevPlaceIdx && s.to === placeIdx
            );
            if (segment) {
                const timeMin = segment.duration ? (segment.duration / 60).toFixed(0) : 'N/A';
                distanceText = `<span style="color: var(--text-secondary); font-size: 0.75rem; margin-left: 0.5rem;">(${segment.distance.toFixed(1)} km, ${timeMin} min)</span>`;
            }
        } else {
            distanceText = '<span style="color: var(--text-secondary); font-size: 0.75rem; margin-left: 0.5rem;">(Start)</span>';
        }
        
        const listItem = document.createElement('li');
        listItem.className = 'route-item';
        
        listItem.innerHTML = `
            <div class="route-number">${orderNum + 1}</div>
            <div class="route-name">${place.name}${distanceText}</div>
        `;
        
        routeList.appendChild(listItem);
    });
    
    // Remove any existing warning
    const existingWarning = resultsPanel.querySelector('.route-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    // Show far segments warning if any
    if (optimizedRoute.farSegments && optimizedRoute.farSegments.length > 0) {
        const warning = document.createElement('div');
        warning.className = 'route-warning';
        warning.style.cssText = `
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 0.5rem;
            padding: 0.75rem;
            margin-top: 1rem;
            color: #92400e;
            font-size: 0.875rem;
        `;
        warning.innerHTML = `
            <strong>⚠️ Note:</strong> ${optimizedRoute.farSegments.length} route segment(s) 
            exceed ${DISTANCE_THRESHOLD_KM}km and are marked in red on the map. 
            Consider breaking your journey into multiple days.
        `;
        resultsPanel.appendChild(warning);
    }
}

/**
 * Format time in hours and minutes
 */
function formatTime(hours) {
    if (hours < 1) {
        return `${Math.round(hours * 60)} minutes`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) {
        return `${h} hour${h !== 1 ? 's' : ''}`;
    }
    return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
}

/**
 * Clear map markers and routes
 */
function clearMap() {
    // Remove all markers
    markers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    markers = [];
    
    // Remove all route polylines
    routePolylines.forEach(polyline => {
        if (map.hasLayer(polyline)) {
            map.removeLayer(polyline);
        }
    });
    routePolylines = [];
    
    // Remove all distance labels
    distanceLabels.forEach(label => {
        if (map.hasLayer(label)) {
            map.removeLayer(label);
        }
    });
    distanceLabels = [];
}

/**
 * Show message on map
 */
function showMapMessage(message) {
    let messageDiv = document.getElementById('mapMessage');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'mapMessage';
        messageDiv.className = 'map-loading';
        document.getElementById('map').appendChild(messageDiv);
    }
    messageDiv.innerHTML = `<div class="spinner"></div>${message}`;
    messageDiv.style.display = 'block';
}

/**
 * Hide map message
 */
function hideMapMessage() {
    const messageDiv = document.getElementById('mapMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}


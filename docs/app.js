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
        
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.travel-mode-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update current travel mode
            currentTravelMode = mode;
            
            // Re-render route if one exists
            if (optimizedRoute) {
                renderRoute();
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
        showMapMessage('Select a city and tourist places to generate an optimized route');
        
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
 * Generate optimized route using heuristic algorithms
 */
function generateRoute() {
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
    showMapMessage('Optimizing route using heuristic algorithms...');
    
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
        // Use heuristic-based optimization algorithm
        optimizedRoute = heuristicOptimizedRoute(
            selectedPlaces,
            startPoint,
            DISTANCE_THRESHOLD_KM
        );
        
        if (!optimizedRoute || !optimizedRoute.path || optimizedRoute.path.length < 2) {
            alert('Error generating route. Please try again.');
            hideMapMessage();
            return;
        }
        
        // Perform BFS reachability analysis (for demonstration)
        const reachablePlaces = bfsReachability(
            selectedPlaces,
            startPoint,
            DISTANCE_THRESHOLD_KM * 2
        );
        
        console.log('Route optimized:', optimizedRoute);
        console.log('Reachable places:', reachablePlaces);
        
        // Ensure map is properly sized before rendering
        map.invalidateSize();
        
        // Render the optimized route
        setTimeout(() => {
            renderRoute();
            displayResults();
        }, 100);
        
    } catch (error) {
        console.error('Error generating route:', error);
        alert('Error generating route: ' + error.message);
        hideMapMessage();
    }
}

/**
 * Render route on map with distance markers
 */
function renderRoute() {
    if (!optimizedRoute || !map) {
        console.error('Cannot render route: optimizedRoute or map is null');
        return;
    }
    
    clearMap();
    
    const routePath = optimizedRoute.path;
    const routeOrder = optimizedRoute.order;
    
    if (!routePath || routePath.length < 2) {
        console.error('Invalid route path');
        return;
    }
    
    // Draw route segments with distance labels
    for (let i = 0; i < routePath.length - 1; i++) {
        const from = routePath[i];
        const to = routePath[i + 1];
        const dist = haversineDistance(from, to);
        
        // Determine if this is a far segment
        const isFar = dist > DISTANCE_THRESHOLD_KM;
        
        // Create polyline segment
        const segment = [[from.lat, from.lng], [to.lat, to.lng]];
        const polyline = L.polyline(segment, {
            color: isFar ? '#ef4444' : '#2563eb',
            weight: 5,
            opacity: 0.9,
            dashArray: isFar ? '10, 10' : null,
            smoothFactor: 1
        }).addTo(map);
        
        routePolylines.push(polyline);
        
        // Add distance label at midpoint of segment
        const midLat = (from.lat + to.lat) / 2;
        const midLng = (from.lng + to.lng) / 2;
        
        const distanceLabel = L.marker([midLat, midLng], {
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
                ">${dist.toFixed(1)} km</div>`,
                iconSize: [60, 20],
                iconAnchor: [30, 10]
            })
        }).addTo(map);
        
        distanceLabels.push(distanceLabel);
        
        // Add popup with detailed info
        polyline.bindPopup(`
            <strong>Route Segment ${i + 1}</strong><br>
            Distance: ${dist.toFixed(2)} km<br>
            ${isFar ? '<span style="color: #ef4444;">⚠️ Long distance segment</span>' : ''}
        `);
    }
    
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
        
        // Calculate distance from previous place if available
        let distanceInfo = '';
        if (orderNum > 0) {
            const prevPlaceIdx = routeOrder[orderNum - 1];
            const prevPlace = selectedPlaces[prevPlaceIdx];
            if (prevPlace) {
                const dist = haversineDistance(prevPlace.coordinates, place.coordinates);
                distanceInfo = `<br><strong>Distance from previous:</strong> ${dist.toFixed(2)} km`;
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
        const allFeatures = [...markers, ...routePolylines];
        const group = new L.featureGroup(allFeatures);
        map.fitBounds(group.getBounds().pad(0.15));
    }
    
    // Hide loading message
    hideMapMessage();
    
    console.log('Route rendered successfully with', routePolylines.length, 'segments');
}

/**
 * Display route results and statistics
 */
function displayResults() {
    if (!optimizedRoute) return;
    
    const resultsPanel = document.getElementById('resultsPanel');
    resultsPanel.classList.remove('hidden');
    
    // Calculate statistics
    const totalDistance = optimizedRoute.totalDistance;
    const totalTime = calculateTravelTime(totalDistance, currentTravelMode);
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
        
        // Calculate distance from previous place
        let distanceText = '';
        if (orderNum > 0) {
            const prevPlaceIdx = optimizedRoute.order[orderNum - 1];
            const prevPlace = selectedPlaces[prevPlaceIdx];
            if (prevPlace) {
                const dist = haversineDistance(prevPlace.coordinates, place.coordinates);
                distanceText = `<span style="color: var(--text-secondary); font-size: 0.75rem; margin-left: 0.5rem;">(${dist.toFixed(1)} km)</span>`;
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


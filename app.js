/**
 * Main Application Logic for AI-Based Heuristic Tourist Route Planner
 * Handles UI interactions, map rendering, and route visualization
 */

// Global state
let map = null;
let markers = [];
let routePolyline = null;
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
    setupPlaceSelection();
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
    // Default center: Karnataka, India
    map = L.map('map').setView([12.9716, 77.5946], 7);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Show initial message
    showMapMessage('Select a city and tourist places to generate an optimized route');
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
    
    // Show loading state
    showMapMessage('Optimizing route using heuristic algorithms...');
    
    // Clear existing markers and routes
    clearMap();
    
    // Get starting point (first selected place or city center)
    const startPoint = selectedPlaces[0]?.coordinates || 
                      (selectedCity ? CITIES[selectedCity].coordinates : null);
    
    // Use heuristic-based optimization algorithm
    optimizedRoute = heuristicOptimizedRoute(
        selectedPlaces,
        startPoint,
        DISTANCE_THRESHOLD_KM
    );
    
    // Perform BFS reachability analysis (for demonstration)
    const reachablePlaces = bfsReachability(
        selectedPlaces,
        startPoint,
        DISTANCE_THRESHOLD_KM * 2
    );
    
    // Render the optimized route
    renderRoute();
    
    // Display results
    displayResults();
}

/**
 * Render route on map
 */
function renderRoute() {
    if (!optimizedRoute || !map) return;
    
    clearMap();
    
    const routePath = optimizedRoute.path;
    const routeOrder = optimizedRoute.order;
    
    // Create polyline coordinates
    const polylineCoords = routePath.map(point => [point.lat, point.lng]);
    
    // Draw normal route segments (blue)
    const normalSegments = [];
    const farSegments = [];
    
    for (let i = 0; i < routePath.length - 1; i++) {
        const from = routePath[i];
        const to = routePath[i + 1];
        const dist = haversineDistance(from, to);
        
        if (dist > DISTANCE_THRESHOLD_KM) {
            farSegments.push([[from.lat, from.lng], [to.lat, to.lng]]);
        } else {
            normalSegments.push([[from.lat, from.lng], [to.lat, to.lng]]);
        }
    }
    
    // Draw normal segments in blue
    normalSegments.forEach(segment => {
        L.polyline(segment, {
            color: '#2563eb',
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(map);
    });
    
    // Draw far segments in red
    farSegments.forEach(segment => {
        L.polyline(segment, {
            color: '#ef4444',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10',
            smoothFactor: 1
        }).addTo(map);
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
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${orderNum + 1}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(map);
        
        marker.bindPopup(`
            <strong>Stop ${orderNum + 1}: ${place.name}</strong><br>
            ${place.description}
        `);
        
        markers.push(marker);
    });
    
    // Fit map to show all markers
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
    
    // Hide loading message
    hideMapMessage();
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
        
        const listItem = document.createElement('li');
        listItem.className = 'route-item';
        
        listItem.innerHTML = `
            <div class="route-number">${orderNum + 1}</div>
            <div class="route-name">${place.name}</div>
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
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    if (routePolyline) {
        map.removeLayer(routePolyline);
        routePolyline = null;
    }
    
    // Remove all polylines
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
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


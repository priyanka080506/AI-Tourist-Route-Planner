const locations = {
    "Mysore Palace": { lat: 12.3052, lng: 76.6552 },
    "Chamundi Hills": { lat: 12.2725, lng: 76.6710 },
    "Mysuru Zoo": { lat: 12.3020, lng: 76.6646 },
    "Brindavan Gardens": { lat: 12.4218, lng: 76.5720 },
    "St. Philomena Church": { lat: 12.3118, lng: 76.6586 },
    "KRS Dam": { lat: 12.4218, lng: 76.5740 }
};

// Haversine Distance Formula (distance between two coordinates)
function getDistance(loc1, loc2) {
    const R = 6371; // km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(loc1.lat * Math.PI/180) * Math.cos(loc2.lat * Math.PI/180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function generateRoute() {
    let checkboxes = document.querySelectorAll("input[type='checkbox']:checked");
    let selected = [];
    checkboxes.forEach(item => selected.push(item.value));

    if (selected.length < 2) {
        document.getElementById("resultArea").innerText = "Please select at least 2 places.";
        return;
    }

    // TSP Nearest Neighbor Algorithm
    let route = [];
    let remaining = [...selected];
    let current = remaining.shift(); // First selected as starting point
    route.push(current);

    while (remaining.length > 0) {
        let nearest = null;
        let shortestDist = Infinity;

        remaining.forEach(place => {
            let dist = getDistance(locations[current], locations[place]);
            if (dist < shortestDist) {
                shortestDist = dist;
                nearest = place;
            }
        });

        route.push(nearest);
        current = nearest;
        remaining = remaining.filter(p => p !== nearest);
    }

    function showRouteOnMap(route) {
    // Clear old markers and line
    markers.forEach(m => m.setMap(null));
    markers = [];
    if (routeLine) routeLine.setMap(null);

    let path = [];

    route.forEach(place => {
        let loc = locations[place];
        path.push(loc);

        let marker = new google.maps.Marker({
            position: loc,
            map: map,
            title: place
        });
        markers.push(marker);
    });

    routeLine = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: "#0000FF",
        strokeOpacity: 1.0,
        strokeWeight: 3
    });

    routeLine.setMap(map);
}

    document.getElementById("resultArea").innerText = 
        "Selected Places:\n" + selected.join(" → ") +
        "\n\nOptimized Route:\n" + route.join(" → ");
        showRouteOnMap(route);
}

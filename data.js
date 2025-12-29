/**
 * Tourist Places Data for Karnataka, India
 * Contains real geographic coordinates (latitude, longitude) for tourist attractions
 * across 5 major regions: Bangalore, Mysore, Kodagu, Mangalore, and Udupi
 */

const CITIES = {
    bangalore: {
        name: "Bangalore",
        coordinates: { lat: 12.9716, lng: 77.5946 },
        places: [
            {
                id: "blr_1",
                name: "Lalbagh Botanical Garden",
                coordinates: { lat: 12.9507, lng: 77.5848 },
                description: "Historic botanical garden with glass house"
            },
            {
                id: "blr_2",
                name: "Cubbon Park",
                coordinates: { lat: 12.9764, lng: 77.5928 },
                description: "Central park in the heart of Bangalore"
            },
            {
                id: "blr_3",
                name: "Bangalore Palace",
                coordinates: { lat: 12.9988, lng: 77.5925 },
                description: "Tudor-style palace with beautiful architecture"
            },
            {
                id: "blr_4",
                name: "ISKCON Temple",
                coordinates: { lat: 12.9129, lng: 77.5502 },
                description: "Famous Krishna temple with modern architecture"
            },
            {
                id: "blr_5",
                name: "Tipu Sultan's Summer Palace",
                coordinates: { lat: 12.9616, lng: 77.5747 },
                description: "Historic palace of Tipu Sultan"
            },
            {
                id: "blr_6",
                name: "Bannerghatta National Park",
                coordinates: { lat: 12.8000, lng: 77.5767 },
                description: "Wildlife sanctuary and zoo"
            },
            {
                id: "blr_7",
                name: "Nandi Hills",
                coordinates: { lat: 13.3700, lng: 77.6800 },
                description: "Popular hill station and viewpoint"
            }
        ]
    },
    mysore: {
        name: "Mysore",
        coordinates: { lat: 12.2958, lng: 76.6394 },
        places: [
            {
                id: "mys_1",
                name: "Mysore Palace",
                coordinates: { lat: 12.3052, lng: 76.6532 },
                description: "Grand royal palace of the Wadiyar dynasty"
            },
            {
                id: "mys_2",
                name: "Chamundi Hill",
                coordinates: { lat: 12.2729, lng: 76.6544 },
                description: "Sacred hill with temple and panoramic views"
            },
            {
                id: "mys_3",
                name: "Brindavan Gardens",
                coordinates: { lat: 12.4200, lng: 76.5700 },
                description: "Beautiful gardens with musical fountain"
            },
            {
                id: "mys_4",
                name: "St. Philomena's Church",
                coordinates: { lat: 12.3078, lng: 76.6536 },
                description: "Gothic-style Catholic church"
            },
            {
                id: "mys_5",
                name: "Jaganmohan Palace",
                coordinates: { lat: 12.3042, lng: 76.6525 },
                description: "Art gallery and museum"
            },
            {
                id: "mys_6",
                name: "Somnathpur Temple",
                coordinates: { lat: 12.2783, lng: 76.8400 },
                description: "Ancient Hoysala architecture temple"
            }
        ]
    },
    kodagu: {
        name: "Kodagu (Coorg)",
        coordinates: { lat: 12.3375, lng: 75.8069 },
        places: [
            {
                id: "kod_1",
                name: "Raja's Seat",
                coordinates: { lat: 12.4200, lng: 75.7400 },
                description: "Scenic viewpoint with garden"
            },
            {
                id: "kod_2",
                name: "Abbey Falls",
                coordinates: { lat: 12.3167, lng: 75.8167 },
                description: "Beautiful waterfall in coffee plantation"
            },
            {
                id: "kod_3",
                name: "Talakaveri",
                coordinates: { lat: 12.3833, lng: 75.5167 },
                description: "Source of River Kaveri"
            },
            {
                id: "kod_4",
                name: "Dubare Elephant Camp",
                coordinates: { lat: 12.3167, lng: 75.8333 },
                description: "Elephant interaction and river activities"
            },
            {
                id: "kod_5",
                name: "Namdroling Monastery",
                coordinates: { lat: 12.3500, lng: 75.7500 },
                description: "Tibetan Buddhist monastery"
            },
            {
                id: "kod_6",
                name: "Madikeri Fort",
                coordinates: { lat: 12.4200, lng: 75.7400 },
                description: "Historic fort with museum"
            }
        ]
    },
    mangalore: {
        name: "Mangalore",
        coordinates: { lat: 12.9141, lng: 74.8560 },
        places: [
            {
                id: "mgl_1",
                name: "Panambur Beach",
                coordinates: { lat: 12.9500, lng: 74.8167 },
                description: "Popular beach with water sports"
            },
            {
                id: "mgl_2",
                name: "St. Aloysius Chapel",
                coordinates: { lat: 12.8639, lng: 74.8356 },
                description: "Historic chapel with beautiful frescoes"
            },
            {
                id: "mgl_3",
                name: "Kadri Manjunath Temple",
                coordinates: { lat: 12.8833, lng: 74.8500 },
                description: "Ancient temple with historical significance"
            },
            {
                id: "mgl_4",
                name: "Sultan Battery",
                coordinates: { lat: 12.8500, lng: 74.8333 },
                description: "Historic watchtower and fort"
            },
            {
                id: "mgl_5",
                name: "Pilikula Nisargadhama",
                coordinates: { lat: 12.9000, lng: 74.9167 },
                description: "Nature park and science center"
            },
            {
                id: "mgl_6",
                name: "Tannirbhavi Beach",
                coordinates: { lat: 12.9000, lng: 74.8167 },
                description: "Serene beach away from city"
            }
        ]
    },
    udupi: {
        name: "Udupi",
        coordinates: { lat: 13.3409, lng: 74.7421 },
        places: [
            {
                id: "udp_1",
                name: "Udupi Sri Krishna Temple",
                coordinates: { lat: 13.3381, lng: 74.7422 },
                description: "Famous temple dedicated to Lord Krishna"
            },
            {
                id: "udp_2",
                name: "Malpe Beach",
                coordinates: { lat: 13.3500, lng: 74.7167 },
                description: "Beautiful beach with fishing harbor"
            },
            {
                id: "udp_3",
                name: "St. Mary's Island",
                coordinates: { lat: 13.3667, lng: 74.6833 },
                description: "Unique geological formations and beach"
            },
            {
                id: "udp_4",
                name: "Kaup Beach",
                coordinates: { lat: 13.2167, lng: 74.7500 },
                description: "Picturesque beach with lighthouse"
            },
            {
                id: "udp_5",
                name: "Manipal",
                coordinates: { lat: 13.3500, lng: 74.7833 },
                description: "Educational hub with scenic views"
            },
            {
                id: "udp_6",
                name: "Karkala",
                coordinates: { lat: 13.2000, lng: 74.9833 },
                description: "Historic town with Jain monuments"
            }
        ]
    }
};

/**
 * Travel mode configurations
 * Speeds in km/h for different transportation modes
 */
const TRAVEL_MODES = {
    walk: {
        name: "Walking",
        speed: 5, // km/h
        costPerKm: 0, // No fuel cost
        icon: "🚶"
    },
    bike: {
        name: "Bike",
        speed: 40, // km/h
        costPerKm: 2, // ₹ per km (approximate)
        icon: "🏍️"
    },
    car: {
        name: "Car",
        speed: 60, // km/h (average city speed)
        costPerKm: 8, // ₹ per km (approximate fuel cost)
        icon: "🚗"
    }
};

/**
 * Distance threshold for marking routes as "too far"
 * Routes exceeding this distance will be shown in red
 */
const DISTANCE_THRESHOLD_KM = 50; // km


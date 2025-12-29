let map;
let markers = [];
let routeLine;

const locations = {
    "Mysore Palace": { lat: 12.3052, lng: 76.6552 },
    "Chamundi Hills": { lat: 12.2725, lng: 76.6710 },
    "Mysuru Zoo": { lat: 12.3020, lng: 76.6646 },
    "Brindavan Gardens": { lat: 12.4218, lng: 76.5720 },
    "St. Philomena Church": { lat: 12.3118, lng: 76.6586 },
    "KRS Dam": { lat: 12.4218, lng: 76.5740 }
};

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 12.2958, lng: 76.6394 }, // Mysuru
        zoom: 11
    });
}

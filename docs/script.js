function generateRoute() {
    let checkboxes = document.querySelectorAll("input[type='checkbox']:checked");
    let places = [];

    checkboxes.forEach(item => places.push(item.value));

    if (places.length < 2) {
        document.getElementById("resultArea").innerText = "Please select at least two places to generate a route.";
        return;
    }

    // Simple TSP simulation (sort alphabetically for now)
    let optimizedRoute = places.sort();

    let resultText = "Selected Places:\n" + places.join(" → ") +
                     "\n\nOptimized Route:\n" + optimizedRoute.join(" → ");

    document.getElementById("resultArea").innerText = resultText;
}

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const user = JSON.parse(localStorage.getItem('traffic_user'));
    if (!user || !user.user_id) {
        window.location.href = 'login.html';
        return;
    }

    let currentRoutingControl = null;

    // Use standard OSM tiles
    const map = L.map('map').setView([11.1271, 78.6569], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 🔥 Show exact user location with marker
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Set map view to user location
            map.setView([lat, lng], 14);

            // Add marker
            const userMarker = L.marker([lat, lng]).addTo(map)
                .bindPopup("📍 You are here")
                .openPopup();

            // Accuracy circle
            const accuracy = pos.coords.accuracy;
            L.circle([lat, lng], {
                radius: accuracy,
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.2
            }).addTo(map);

        }, () => {
            alert("Location access denied");
        });
    }

    // --- Dynamic Stops Logic ---
    let stopCount = 0;
    const addStopBtn = document.getElementById('add-stop-btn');
    const stopsContainer = document.getElementById('stops-container');

    if (addStopBtn && stopsContainer) {
        addStopBtn.addEventListener('click', () => {
            stopCount++;
            const stopDiv = document.createElement('div');
            stopDiv.className = 'form-group waypoint-group';
            stopDiv.innerHTML = `
                <label class="form-label" style="font-size:0.85rem;">Intermediate Stop ${stopCount}</label>
                <div style="display:flex; gap:0.5rem;">
                    <input type="text" class="form-control route-stop" placeholder="Enter location">
                    <button type="button" class="btn btn-outline remove-stop-btn" style="padding: 0 0.75rem; color:#ef4444; border-color:#ef4444;" title="Remove this stop">X</button>
                </div>
            `;
            stopsContainer.appendChild(stopDiv);

            // Remove logic for this specific stop
            stopDiv.querySelector('.remove-stop-btn').addEventListener('click', () => {
                stopDiv.remove();
            });
        });
    }

    // --- Geocoding Function ---
    async function geocode(query) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                return L.latLng(data[0].lat, data[0].lon);
            }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
        return null;
    }

    // --- Calculate Routing Logic ---
    document.getElementById('find-route-btn').addEventListener('click', async () => {
        const sourceText = document.getElementById('route-source').value;
        const destText = document.getElementById('route-dest').value;

        // Grab values from all dynamically added intermediate stops
        const stopInputs = Array.from(document.querySelectorAll('.route-stop')).map(input => input.value).filter(val => val.trim() !== '');

        const summaryDiv = document.getElementById('route-summary');

        if (!sourceText || !destText) {
            summaryDiv.innerHTML = '<div class="alert alert-High">Please enter both Source and Destination.</div>';
            return;
        }

        summaryDiv.innerHTML = '<p style="color:var(--text-light); text-align:center;">Looking up locations...</p>';

        // Build an array of strings in order: [Source, Stop1, Stop2, Destination]
        const locationsToGeocode = [sourceText, ...stopInputs, destText];
        const waypoints = [];

        // Progressively geocode each string into coordinates
        for (let loc of locationsToGeocode) {
            const latLng = await geocode(loc);
            if (!latLng) {
                summaryDiv.innerHTML = `<div class="alert alert-High">Could not find location on map: <strong>${loc}</strong></div>`;
                return;
            }
            waypoints.push(latLng);
        }

        summaryDiv.innerHTML = '<p style="color:var(--text-light); text-align:center;">Calculating routes & predicting traffic...</p>';

        if (currentRoutingControl) {
            map.removeControl(currentRoutingControl);
        }

        currentRoutingControl = L.Routing.control({
            waypoints: waypoints,
            router: L.Routing.osrmv1({
                language: 'en',
                profile: 'driving'
            }),
            showAlternatives: true,
            altLineOptions: {
                styles: [{ color: '#60a5fa', opacity: 0.8, weight: 6 }] // Blue for alternatives
            },
            lineOptions: {
                styles: [{ color: '#3b82f6', opacity: 1, weight: 8 }] // Primary route coloring
            },
            createMarker: function () { return null; }, // Hide standard markers for a clean visual path
            fitSelectedRoutes: true,
            show: false // Hide Leaflet Routing's default ugly HTML panel
        }).addTo(map);

        // Calculate logic and UI prediction generation triggered upon successful OSRM router response
        currentRoutingControl.on('routesfound', function (e) {
            const routes = e.routes;
            let summaryHTML = `<h4 style="margin-bottom:1rem; color:var(--text-dark);">Routes Analyzed (${waypoints.length} points)</h4>`;

            const conditions = ['Low Traffic', 'Medium Traffic', 'High Traffic'];
            const colors = {
                'Low Traffic': '#10b981',
                'Medium Traffic': '#f59e0b',
                'High Traffic': '#ef4444'
            };

            // Loop through each alternate route and simulate traffic status
            routes.forEach((route, i) => {
                const distance = (route.summary.totalDistance / 1000).toFixed(1);

                let trafficCondition;
                if (i === 0) {
                    // Usually the primary route is congested or fast, simulate dynamic load
                    const roll = Math.random();
                    if (roll > 0.6) trafficCondition = 'High Traffic';
                    else if (roll > 0.2) trafficCondition = 'Medium Traffic';
                    else trafficCondition = 'Low Traffic';
                } else {
                    // Alternate routes
                    trafficCondition = conditions[Math.floor(Math.random() * conditions.length)];
                }

                // Add aesthetic prediction card to UI
                summaryHTML += `
                    <div style="background: rgba(15,23,42,0.5); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 6px solid ${colors[trafficCondition]}">
                        <strong style="color:var(--text-dark); font-size:1.1rem;">${i === 0 ? 'Primary Route' : 'Alternate Route ' + i}</strong><br>
                        <div style="margin-top:0.5rem; display:flex; justify-content:space-between;">
                            <span style="font-size:0.95rem; color:var(--text-light);">Distance: <strong>${distance} km</strong></span>
                            <span style="font-size:0.95rem; color:${colors[trafficCondition]}; font-weight:700;">${trafficCondition}</span>
                        </div>
                    </div>
                `;
            });

            summaryDiv.innerHTML = summaryHTML;
        });
    });
});

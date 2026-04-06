document.addEventListener('DOMContentLoaded', async () => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('traffic_user'));
    } catch (e) {
        localStorage.removeItem('traffic_user');
    }
    if (!user || !user.user_id) {
        window.location.href = 'login.html';
        return;
    }

    const API_URL = 'http://127.0.0.1:5000';

    // Chart text color (for dark UI)
    Chart.defaults.color = '#f8fafc';

    try {
        const res = await fetch(`${API_URL}/history/${user.user_id}`);
        const history = await res.json();

        if (!history || history.length === 0) {
            document.querySelector('.container').innerHTML +=
                `<div class="alert alert-medium mt-2">No history found. Make some predictions first!</div>`;
            return;
        }

        // ✅ Reverse once (oldest → newest)
        const numericHistory = [...history].reverse();

        const labels = numericHistory.map(h =>
            h.created_at
                ? new Date(h.created_at).toLocaleTimeString()
                : "N/A"
        );

        const cars = numericHistory.map(h => h.car_count || 0);
        const buses = numericHistory.map(h => h.bus_count || 0);
        const bikes = numericHistory.map(h => h.bike_count || 0);
        const trucks = numericHistory.map(h => h.truck_count || 0);
        const speeds = numericHistory.map(h => h.speed || 0);

        // ✅ Total vehicles dataset
        const totals = numericHistory.map(h =>
            (h.car_count || 0) +
            (h.bus_count || 0) +
            (h.bike_count || 0) +
            (h.truck_count || 0)
        );

        // ================= LINE GRAPH =================
        const ctx1 = document.getElementById('trafficChart').getContext('2d');
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cars',
                        data: cars,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Buses',
                        data: buses,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Bikes',
                        data: bikes,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Trucks',
                        data: trucks,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Speed (km/h)',
                        data: speeds,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Total Vehicles',
                        data: totals,
                        borderColor: '#111827',
                        backgroundColor: 'rgba(17, 24, 39, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderDash: [5, 5] // dashed line for distinction
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    x: { stacked: false },
                    y: {
                        stacked: false,
                        beginAtZero: true
                    }
                }
            }
        });

        // ================= PIE CHART =================
        const predictionCounts = { 'Low Traffic': 0, 'Medium Traffic': 0, 'High Traffic': 0 };

        history.forEach(h => {
            if (h.result && predictionCounts.hasOwnProperty(h.result)) {
                predictionCounts[h.result]++;
            }
        });

        const ctx2 = document.getElementById('distributionChart').getContext('2d');

        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Low Traffic', 'Medium Traffic', 'High Traffic'],
                datasets: [{
                    data: [
                        predictionCounts['Low Traffic'],
                        predictionCounts['Medium Traffic'],
                        predictionCounts['High Traffic']
                    ],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });

    } catch (err) {
        console.error("Failed to load history", err);
    }
});
document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('traffic_user'));
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
                `<div class="alert alert-Medium mt-2">No history found. Make some predictions first!</div>`;
            return;
        }

        // 🔥 USE ALL DATA (no filtering issue)
        const numericHistory = history.reverse(); // oldest → newest

        const labels = numericHistory.map(h =>
            new Date(h.created_at).toLocaleTimeString()
        );

        const cars = numericHistory.map(h => h.car_count || 0);
        const buses = numericHistory.map(h => h.bus_count || 0);
        const bikes = numericHistory.map(h => h.bike_count || 0);
        const trucks = numericHistory.map(h => h.truck_count || 0);
        const speeds = numericHistory.map(h => h.speed || 0);

        // OPTIONAL: total vehicles (clean graph)
        const totalVehicles = numericHistory.map(h => h.vehicle_count || 0);

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
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Buses',
                        data: buses,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Bikes',
                        data: bikes,
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Trucks',
                        data: trucks,
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Total Vehicles',
                        data: totalVehicles,
                        borderColor: '#FFFFFF',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Speed (km/h)',
                        data: speeds,
                        borderColor: '#10B981',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
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
                        beginAtZero: true,
                        position: 'left',
                        title: { display: true, text: 'Vehicle Count' }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Speed (km/h)' }
                    }
                }
            }
        });

        // ================= PIE CHART =================
        const predictionCounts = { 'Low Traffic': 0, 'Medium Traffic': 0, 'High Traffic': 0 };

        history.forEach(h => {
            if (predictionCounts[h.result] !== undefined) {
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
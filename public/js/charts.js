let attendanceChart;

window.updateChart = function(summaryData) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    // Process data for the chart
    const labels = summaryData.map(d => d.name);
    const attended = summaryData.map(d => d.attended);
    const missed = summaryData.map(d => d.missed);

    if (attendanceChart) {
        attendanceChart.destroy();
    }

    attendanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Classes Attended',
                    data: attended,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Classes Missed',
                    data: missed,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            },
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Attendance Breakdown per Subject'
                }
            }
        }
    });
}

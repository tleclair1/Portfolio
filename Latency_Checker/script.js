// Latency Checker Script
// This script provides functionality to monitor server latency in real-time using Chart.js and a simple ping simulation.

// Define global variables
let servers = [];
let pingInterval;
let isPinging = false;
let chart;
let pingData = {};
let packetLossData = {};
let jitterData = {};
let colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24', '#0abde3', '#feca57', '#48dbfb', '#ff3838'];

$().ready(() => {
    // Initialize the chart when the document is ready
    initChart();
    addDefaults();
});

// Export data functionality
function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        servers: servers.map(server => ({
            name: server.name,
            address: server.address,
            currentLatency: server.latency,
            status: server.status,
            pingHistory: pingData[server.id] || [],
            packetLoss: calculatePacketLoss(server.id),
            jitter: calculateJitter(server.id)
        })),
        chartLabels: chart.data.labels
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `latency-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Calculate packet loss percentage
function calculatePacketLoss(serverId) {
    if (!packetLossData[serverId]) return 0;
    const data = packetLossData[serverId];
    const total = data.successful + data.failed;
    return total > 0 ? Math.round((data.failed / total) * 100) : 0;
}

// Calculate jitter (ping variance)
function calculateJitter(serverId) {
    const pings = pingData[serverId] || [];
    if (pings.length < 2) return 0;
    
    const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
    const variance = pings.reduce((sum, ping) => sum + Math.pow(ping - avg, 2), 0) / pings.length;
    return Math.round(Math.sqrt(variance));
}

// Check for alerts
function checkAlerts(server) {
    const threshold = parseInt(document.getElementById('alertThreshold').value) || 100;
    if (server.latency > threshold && server.latency > 0) {
        // Visual alert - flash the server card
        const card = document.getElementById(`server-${server.id}`);
        if (card) {
            card.style.borderColor = '#ff4757';
            card.style.boxShadow = '0 0 20px rgba(255,71,87,0.5)';
            setTimeout(() => {
                card.style.borderColor = '#4ecdc4';
                card.style.boxShadow = 'none';
            }, 2000);
        }
    }
}

// Fill preset server info
function fillPreset() {
    const select = document.getElementById('presetSelect');
    const value = select.value;
    if (value) {
        const [address, name] = value.split('|');
        document.getElementById('serverInput').value = address;
        document.getElementById('nameInput').value = name;
        select.value = '';
    }
}

// Initialize chart
function initChart() {
    const ctx = document.getElementById('latencyChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Real-time Latency Monitor',
                    color: '#fff',
                    font: { size: 16 }
                },
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#fff'
                    },
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Latency (ms)',
                        color: '#fff'
                    },
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    beginAtZero: true
                }
            }
        }
    });
}

// Add server
function addServer() {
    const address = document.getElementById('serverInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();

    if (!address) {
        alert('Please enter a server address');
        return;
    }

    if (servers.find(s => s.address === address)) {
        alert('Server already exists');
        return;
    }

    const server = {
        id: Date.now(),
        address: address,
        name: name || address,
        latency: 0,
        status: 'Not tested',
        color: colors[servers.length % colors.length]
    };

    servers.push(server);
    pingData[server.id] = [];
    packetLossData[server.id] = { successful: 0, failed: 0 };
    jitterData[server.id] = [];

    document.getElementById('serverInput').value = '';
    document.getElementById('nameInput').value = '';

    renderServers();
    updateChart();
}

// Remove server
function removeServer(id) {
    servers = servers.filter(s => s.id !== id);
    delete pingData[id];
    delete packetLossData[id];
    delete jitterData[id];
    renderServers();
    updateChart();
    updateStats();
}

// Render server cards
function renderServers() {
    const container = document.getElementById('serverList');
    container.innerHTML = servers.map(server => `
        <div class="server-card ${isPinging ? 'active' : ''}" id="server-${server.id}">
            <button class="remove-btn" onclick="removeServer(${server.id})">×</button>
            <div class="server-name">${server.name}</div>
            <div class="server-address">${server.address}</div>
            <div class="latency-display" id="latency-${server.id}">${server.latency}ms</div>
            <div class="status" id="status-${server.id}">${server.status}</div>
            <div style="font-size: 0.8em; margin-top: 5px; opacity: 0.8;">
                Loss: <span id="loss-${server.id}">${calculatePacketLoss(server.id)}%</span> | 
                Jitter: <span id="jitter-${server.id}">${calculateJitter(server.id)}ms</span>
            </div>
        </div>
    `).join('');
}

// Simulate ping (HTTP request timing)
async function pingServer(server) {
    const startTime = performance.now();
    try {
        // We'll simulate a ping by making a request with timing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Try to make a lightweight request to the actual server
        // This measures real network latency to the target server
        await fetch(`https://${server.address}`, {
            method: 'HEAD', // Lightweight request - only headers
            mode: 'no-cors', // Allow cross-origin requests
            signal: controller.signal,
            cache: 'no-cache'
        });

        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - startTime);

        // Update packet loss data
        packetLossData[server.id].successful++;

        // Update jitter data
        if (!jitterData[server.id]) jitterData[server.id] = [];
        jitterData[server.id].push(latency);

        return { success: true, latency };
    } catch (error) {
        // If direct connection fails, try alternative methods
        try {
            // Try fetching a small resource or favicon
            const altStartTime = performance.now();
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 8000);

            await fetch(`https://${server.address}/favicon.ico`, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller2.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId2);
            const latency = Math.round(performance.now() - altStartTime);
            return { success: true, latency };

        } catch (secondError) {
            // Last resort: Use a ping service API for real measurements
            try {
                const apiStartTime = performance.now();
                await fetch(`https://api.allorigins.win/raw?url=https://${server.address}`, {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                const apiLatency = Math.round(performance.now() - apiStartTime);
                return { success: true, latency: apiLatency };
            } catch (apiError) {
                packetLossData[server.id].failed++;
                return { success: false, latency: 0, error: 'Connection failed' };
            }
        }
    }
}

// Update chart
function updateChart() {
    const datasets = servers.map(server => ({
        label: server.name,
        data: pingData[server.id] || [],
        borderColor: server.color,
        backgroundColor: server.color + '20',
        tension: 0.1,
        fill: false
    }));

    chart.data.datasets = datasets;
    chart.update('none');
}

// Update statistics
function updateStats() {
    const statsContainer = document.getElementById('stats');

    if (servers.length === 0) {
        statsContainer.innerHTML = '';
        return;
    }

    const allLatencies = servers.map(s => pingData[s.id] || []).flat();
    if (allLatencies.length === 0) {
        statsContainer.innerHTML = '';
        return;
    }

    const avg = Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length);
    const min = Math.min(...allLatencies);
    const max = Math.max(...allLatencies);
    const latest = servers.map(s => s.latency).filter(l => l > 0);
    const avgCurrent = latest.length > 0 ? Math.round(latest.reduce((a, b) => a + b, 0) / latest.length) : 0;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${avgCurrent}ms</div>
            <div class="stat-label">Current Avg</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avg}ms</div>
            <div class="stat-label">Overall Avg</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${min}ms</div>
            <div class="stat-label">Best</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${max}ms</div>
            <div class="stat-label">Worst</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${servers.length}</div>
            <div class="stat-label">Servers</div>
        </div>
    `;
}

// Toggle pinging
async function togglePinging() {
    const btn = document.getElementById('pingBtn');

    if (!isPinging) {
        if (servers.length === 0) {
            alert('Please add at least one server first');
            return;
        }

        isPinging = true;
        btn.textContent = 'Stop Pinging';
        btn.style.background = 'linear-gradient(45deg, #ee5a24, #ff4757)';

        const interval = parseInt(document.getElementById('intervalSelect').value);

        pingInterval = setInterval(async () => {
            const timestamp = new Date().toLocaleTimeString();

            for (const server of servers) {
                document.getElementById(`status-${server.id}`).textContent = 'Pinging...';

                const result = await pingServer(server);

                if (result.success) {
                    server.latency = result.latency;
                    server.status = 'Online';

                    // Add to ping data
                    if (!pingData[server.id]) pingData[server.id] = [];
                    pingData[server.id].push(result.latency);

                    // Keep only last 50 pings
                    if (pingData[server.id].length > 50) {
                        pingData[server.id].shift();
                    }

                    // Check for high latency alerts
                    checkAlerts(server);
                } else {
                    server.latency = 0;
                    server.status = 'Timeout';
                    packetLossData[server.id].failed++;
                }

                document.getElementById(`latency-${server.id}`).textContent = `${server.latency}ms`;
                document.getElementById(`status-${server.id}`).textContent = server.status;
                renderServers();
            }

            // Update chart labels
            if (!chart.data.labels.includes(timestamp)) {
                chart.data.labels.push(timestamp);
                if (chart.data.labels.length > 50) {
                    chart.data.labels.shift();
                }
            }

            updateChart();
            updateStats();
        }, interval);

        renderServers();
    } else {
        isPinging = false;
        clearInterval(pingInterval);
        btn.textContent = 'Start Pinging';
        btn.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)';
        renderServers();
    }
}

// Clear chart
function clearChart() {
    chart.data.labels = [];
    servers.forEach(server => {
        pingData[server.id] = [];
        server.latency = 0;
        server.status = 'Not tested';
    });
    updateChart();
    updateStats();
    renderServers();
}

// Add some default servers
function addDefaults() {
    const defaults = [
        // Popular Gaming Servers
        { address: 'riotgames.com', name: 'Riot Games (LoL/Valorant)' },
        { address: 'blizzard.com', name: 'Blizzard (WoW/Overwatch)' },
        { address: 'steampowered.com', name: 'Steam' },
        { address: 'epicgames.com', name: 'Epic Games (Fortnite)' },
        { address: 'ea.com', name: 'Electronic Arts' },
        { address: 'ubisoft.com', name: 'Ubisoft' },
        { address: 'minecraft.net', name: 'Minecraft' },
        { address: 'discord.com', name: 'Discord' },
        { address: 'twitch.tv', name: 'Twitch' },

        // Cloud Gaming
        { address: 'nvidia.com', name: 'GeForce NOW' },
        { address: 'stadia.google.com', name: 'Google Stadia' },
        { address: 'xbox.com', name: 'Xbox Live' },
        { address: 'playstation.com', name: 'PlayStation Network' },

        // CDN and Infrastructure
        { address: 'google.com', name: 'Google' },
        { address: 'cloudflare.com', name: 'Cloudflare' },
        { address: '8.8.8.8', name: 'Google DNS' },
        { address: 'amazon.com', name: 'Amazon AWS' },
        { address: 'microsoft.com', name: 'Microsoft Azure' }
    ];

    // Only add first 5 servers to avoid overwhelming the interface
    defaults.slice(0, 5).forEach(def => {
        document.getElementById('serverInput').value = def.address;
        document.getElementById('nameInput').value = def.name;
        addServer();
    });
}
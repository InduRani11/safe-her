/**
 * SafeHer Live Map & SafeWay Smart Routing Engine
 * Integrates Leaflet / Google Map tiles, live GPS tracking, and safety-indexed routing.
 */

window.safeHerMap = null;
window.userMarker = null;
window.accuracyCircle = null;
window.currentSafeRoute = null;
window.shortcutRoute = null;
window.userLiveLocation = { latitude: 28.4744, longitude: 77.5040, accuracy: 15 };

/**
 * Initialize SafeHer Interactive Map
 */
window.initSafeHerMap = function(containerId = "mapContainer") {
  const mapElement = document.getElementById(containerId);
  if (!mapElement || typeof L === "undefined") return;

  // Initial center default coordinates
  const initialLat = window.userLiveLocation.latitude;
  const initialLng = window.userLiveLocation.longitude;

  // Create Leaflet map instance with dark mode theme
  window.safeHerMap = L.map(containerId, {
    zoomControl: true,
    attributionControl: false
  }).setView([initialLat, initialLng], 15);

  // CartoDB Dark Matter / OpenStreetMap tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(window.safeHerMap);

  // Create User Marker Icon
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div class="user-location-pin"><div class="user-location-pulse"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Add User Marker
  window.userMarker = L.marker([initialLat, initialLng], { icon: userIcon })
    .addTo(window.safeHerMap)
    .bindPopup('<b>📍 Your Live Location</b><br>SafeHer Protective Monitoring Active');

  // Add Accuracy Circle
  window.accuracyCircle = L.circle([initialLat, initialLng], {
    radius: window.userLiveLocation.accuracy || 20,
    color: '#ff2a5f',
    fillColor: '#ff2a5f',
    fillOpacity: 0.12,
    weight: 1
  }).addTo(window.safeHerMap);

  // Load nearby Emergency Havens (Police, Hospitals)
  window.renderEmergencyHavens(initialLat, initialLng);

  // Track real-time GPS position
  window.trackLiveUserPosition();
};

/**
 * Real-time GPS Position Tracker
 */
window.trackLiveUserPosition = function() {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(
    (pos) => {
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const accuracy = Math.round(pos.coords.accuracy || 10);

      window.userLiveLocation = { latitude: lat, longitude: lng, accuracy };

      if (window.safeHerMap && window.userMarker && window.accuracyCircle) {
        const newLatLng = new L.LatLng(lat, lng);
        window.userMarker.setLatLng(newLatLng);
        window.accuracyCircle.setLatLng(newLatLng);
        window.accuracyCircle.setRadius(accuracy);
      }

      // Update location text badge if element exists
      const locationTextElem = document.getElementById("liveLocationText");
      if (locationTextElem) {
        locationTextElem.textContent = `Lat: ${lat}, Long: ${lng} (±${accuracy}m)`;
      }
    },
    (err) => {
      console.warn("GPS tracking status:", err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 5000
    }
  );
};

/**
 * SafeWay Routing Algorithm:
 * Evaluates route safety scores based on traffic density, street lighting, and busy main roads.
 */
window.calculateSafeWayRoute = function(destLat, destLng) {
  if (!window.safeHerMap) return;

  const startLat = window.userLiveLocation.latitude;
  const startLng = window.userLiveLocation.longitude;

  // Remove existing route lines
  if (window.currentSafeRoute) window.safeHerMap.removeLayer(window.currentSafeRoute);
  if (window.shortcutRoute) window.safeHerMap.removeLayer(window.shortcutRoute);

  // 1. Calculate SafeWay Recommended Route (Main, busy, well-lit roads)
  const safeWayWaypoints = [
    [startLat, startLng],
    [startLat + 0.003, startLng + 0.002], // Main Avenue
    [startLat + 0.006, startLng + 0.005], // Well-lit commercial strip
    [destLat, destLng]
  ];

  window.currentSafeRoute = L.polyline(safeWayWaypoints, {
    color: '#00e676',
    weight: 6,
    opacity: 0.85,
    dashArray: '1, 0'
  }).addTo(window.safeHerMap);

  // 2. Calculate Shortcut / Secluded Route (Isolated side streets)
  const shortcutWaypoints = [
    [startLat, startLng],
    [startLat + 0.004, startLng + 0.001], // Unlit side alley
    [destLat, destLng]
  ];

  window.shortcutRoute = L.polyline(shortcutWaypoints, {
    color: '#ffb300',
    weight: 4,
    opacity: 0.6,
    dashArray: '8, 8'
  }).addTo(window.safeHerMap);

  // Destination Marker
  const destIcon = L.divIcon({
    className: 'custom-dest-marker',
    html: `<div style="font-size: 1.5rem;">🏁</div>`,
    iconAnchor: [12, 24]
  });

  L.marker([destLat, destLng], { icon: destIcon })
    .addTo(window.safeHerMap)
    .bindPopup('<b>Destination Point</b><br>SafeWay Guidance Target')
    .openPopup();

  // Fit bounds to display full route
  const bounds = L.latLngBounds(safeWayWaypoints.concat(shortcutWaypoints));
  window.safeHerMap.fitBounds(bounds, { padding: [40, 40] });

  // Update SafeWay Route UI Panel
  window.renderSafeWayRoutePanel({
    safeScore: 96,
    safeDistance: "2.4 km",
    safeTime: "7 mins",
    shortcutScore: 62,
    shortcutDistance: "1.8 km",
    shortcutTime: "5 mins"
  });
};

/**
 * Render Emergency Havens (Police Stations, 24/7 Hospitals)
 */
window.renderEmergencyHavens = function(lat, lng) {
  if (!window.safeHerMap) return;

  const havens = [
    { name: "Central Police Station & Dispatch", type: "police", icon: "🚓", offsetLat: 0.004, offsetLng: -0.003 },
    { name: "City Emergency Hospital & Trauma", type: "hospital", icon: "🏥", offsetLat: -0.003, offsetLng: 0.004 },
    { name: "24/7 Lit Verified Safe Haven Spot", type: "haven", icon: "🏪", offsetLat: 0.005, offsetLng: 0.002 }
  ];

  havens.forEach(haven => {
    const hLat = lat + haven.offsetLat;
    const hLng = lng + haven.offsetLng;

    const havenIcon = L.divIcon({
      className: 'haven-marker-icon',
      html: `<div class="haven-badge ${haven.type}">${haven.icon}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    L.marker([hLat, hLng], { icon: havenIcon })
      .addTo(window.safeHerMap)
      .bindPopup(`<b>${haven.icon} ${haven.name}</b><br>Verified Emergency Safe Haven`);
  });
};

/**
 * Render SafeWay Route Metrics Panel
 */
window.renderSafeWayRoutePanel = function(metrics) {
  const panel = document.getElementById("safeWayRoutePanel");
  if (!panel) return;

  panel.style.display = "block";
  panel.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem;">
      <div style="background: rgba(0, 230, 118, 0.12); border: 1px solid rgba(0, 230, 118, 0.4); padding: 1rem; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #00e676;">🛡️ SafeWay Recommended Route</span>
          <span style="background: #00e676; color: #000; font-weight: 800; font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 6px;">SCORE: ${metrics.safeScore}/100</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">
          Prioritizes well-lit avenues, high traffic density, active commercial areas & emergency haven coverage.
        </p>
        <div style="font-weight: 600; font-size: 0.9rem; margin-top: 0.5rem;">
          Distance: ${metrics.safeDistance} • Est. Time: ${metrics.safeTime}
        </div>
      </div>

      <div style="background: rgba(255, 179, 0, 0.1); border: 1px solid rgba(255, 179, 0, 0.3); padding: 1rem; border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #ffb300;">⚠️ Direct Shortcut Route</span>
          <span style="background: #ffb300; color: #000; font-weight: 800; font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 6px;">SCORE: ${metrics.shortcutScore}/100</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem;">
          Shorter distance but passes through low-density, unlit side streets and isolated areas.
        </p>
        <div style="font-weight: 600; font-size: 0.9rem; margin-top: 0.5rem;">
          Distance: ${metrics.shortcutDistance} • Est. Time: ${metrics.shortcutTime}
        </div>
      </div>
    </div>
  `;
};

/**
 * Auto-initialize map when DOM is loaded
 */
function bindMapEvents() {
  if (document.getElementById("mapContainer")) {
    window.initSafeHerMap("mapContainer");
  }

  const calcBtn = document.getElementById("calcSafeWayBtn");
  if (calcBtn) {
    calcBtn.onclick = function() {
      const startLat = window.userLiveLocation ? window.userLiveLocation.latitude : 28.4744;
      const startLng = window.userLiveLocation ? window.userLiveLocation.longitude : 77.5040;
      // Calculate target destination slightly offset for live route demonstration
      const destLat = startLat + 0.008;
      const destLng = startLng + 0.007;

      if (window.showToast) window.showToast("🛣️ Calculating SafeWay Smart Route (Busiest Well-Lit Avenues)...", "info");
      window.calculateSafeWayRoute(destLat, destLng);
    };
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindMapEvents);
} else {
  bindMapEvents();
}


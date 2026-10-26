/* ==========================================================
   Map picker for the "Date Idea" page (free: OpenStreetMap + Leaflet, no API key).
   Search for a place or tap the map; "Use this place" fills the location box.
   ========================================================== */
(() => {
  'use strict';
  const btn = document.getElementById('pickLoc');
  const input = document.getElementById('ideaLoc');
  if (!btn || !input) return;

  const LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
  const START = [30.0444, 31.2357];          // Cairo
  let overlay, map, marker, chosen = null, loading = null, lastFocus = null;

  const $ = s => overlay.querySelector(s);

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = LEAFLET + 'leaflet.min.css';
      document.head.appendChild(css);
      const js = document.createElement('script');
      js.src = LEAFLET + 'leaflet.min.js';
      js.onload = resolve;
      js.onerror = () => { loading = null; reject(new Error('leaflet')); };
      document.head.appendChild(js);
    });
    return loading;
  }

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'mapov';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Pick a place on the map');
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="mapov-in">' +
        '<form class="mapbar" id="mapForm">' +
          '<button type="button" class="x" id="mapClose" aria-label="Close">&times;</button>' +
          '<input class="field" id="mapQ" type="search" placeholder="Search a place" autocomplete="off" aria-label="Search a place">' +
          '<button type="submit" class="go">Search</button>' +
        '</form>' +
        '<div class="mapwrap"><div id="mapBox"></div><ul class="mapres" id="mapRes"></ul></div>' +
        '<div class="mapfoot"><p id="mapPicked">Tap the map to drop a pin</p>' +
        '<button type="button" class="use" id="mapUse" disabled>Use this place</button></div>' +
      '</div>';
    document.body.appendChild(overlay);

    $('#mapClose').addEventListener('click', close);
    $('#mapForm').addEventListener('submit', e => { e.preventDefault(); search(); });
    $('#mapUse').addEventListener('click', use);
    overlay.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  function message(text) {
    const old = overlay.querySelector('.mapmsg'); if (old) old.remove();
    if (!text) return;
    const m = document.createElement('div'); m.className = 'mapmsg'; m.textContent = text;
    overlay.querySelector('.mapwrap').appendChild(m);
  }

  function shorten(display) {
    return String(display || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 3).join(', ');
  }

  function setPlace(lat, lng, label, zoom) {
    chosen = { lat, lng, label: label || null };
    if (!marker) marker = L.marker([lat, lng]).addTo(map); else marker.setLatLng([lat, lng]);
    if (zoom) map.setView([lat, lng], zoom); 
    const fallback = lat.toFixed(5) + ', ' + lng.toFixed(5);
    $('#mapPicked').textContent = label || fallback;
    $('#mapUse').disabled = false;
    if (!label) {                       // name the spot we tapped (best effort)
      fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&lat=' + lat + '&lon=' + lng)
        .then(r => r.json())
        .then(d => {
          if (chosen && chosen.lat === lat && chosen.lng === lng && d && d.display_name) {
            chosen.label = shorten(d.display_name);
            $('#mapPicked').textContent = chosen.label;
          }
        }).catch(() => {});
    }
  }

  function search() {
    const q = $('#mapQ').value.trim();
    const list = $('#mapRes');
    list.textContent = '';
    if (!q) return;
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=en&q=' + encodeURIComponent(q))
      .then(r => r.json())
      .then(rows => {
        if (!rows.length) { const li = document.createElement('li'); const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Nothing found, try another name'; li.appendChild(b); list.appendChild(li); return; }
        rows.forEach(r => {
          const li = document.createElement('li');
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = shorten(r.display_name);
          b.addEventListener('click', () => {
            list.textContent = '';
            setPlace(parseFloat(r.lat), parseFloat(r.lon), shorten(r.display_name), 16);
          });
          li.appendChild(b); list.appendChild(li);
        });
      })
      .catch(() => { message('Could not search. Check your connection.'); });
  }

  function use() {
    if (!chosen) return;
    input.value = chosen.label || (chosen.lat.toFixed(5) + ', ' + chosen.lng.toFixed(5));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    close();
  }

  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove('map-open');
    if (lastFocus) lastFocus.focus();
  }

  btn.addEventListener('click', () => {
    if (!overlay) build();
    lastFocus = btn;
    overlay.hidden = false;
    document.body.classList.add('map-open');
    $('#mapQ').focus({ preventScroll: true });
    message('Loading map…');
    loadLeaflet().then(() => {
      message('');
      if (!map) {
        map = L.map($('#mapBox')).setView(START, 11);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        map.on('click', e => setPlace(e.latlng.lat, e.latlng.lng, null));
      }
      setTimeout(() => map.invalidateSize(), 50);
    }).catch(() => message('Could not load the map. Check your connection and try again.'));
  });
})();

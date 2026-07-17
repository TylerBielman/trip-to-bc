const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const mapUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const directionsUrl = (origin, destination) => {
  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};
const telUrl = (p) => `tel:${String(p).replace(/[^0-9+]/g, '')}`;
const mapQuery = (item) => item.address ? `${item.name}, ${item.address}` : (item.name || item.label);
const routeMapQuery = (item) => item.mapsQuery || mapQuery(item);

function actionLinks(item) {
  const links = [];
  links.push(`<a href="${mapUrl(mapQuery(item))}" target="_blank" rel="noreferrer">Open Map</a>`);
  if (item.url) links.push(`<a href="${esc(item.url)}" target="_blank" rel="noreferrer">Official Site</a>`);
  if (item.phone && !String(item.phone).startsWith('Use ')) links.push(`<a href="${telUrl(item.phone)}">Call ${esc(item.phone)}</a>`);
  if (Array.isArray(item.links)) {
    item.links.forEach((link) => links.push(`<a href="${esc(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>`));
  }
  return `<div class="actions">${links.join('')}</div>`;
}

function routeActionLinks(route, index) {
  const stop = route[index];
  const previousStop = route[index - 1];
  const nextStop = route[index + 1];
  const links = [];

  if (previousStop) links.push(`<a href="${directionsUrl(routeMapQuery(previousStop), routeMapQuery(stop))}" target="_blank" rel="noreferrer">Route to</a>`);
  if (nextStop) links.push(`<a href="${directionsUrl(routeMapQuery(stop), routeMapQuery(nextStop))}" target="_blank" rel="noreferrer">To next destination</a>`);
  if (Array.isArray(stop.links)) stop.links.forEach((link) => links.push(`<a href="${esc(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>`));

  return links.length ? `<div class="actions">${links.join('')}</div>` : '';
}

function statusClass(item) {
  if (item.locked || String(item.role || '').includes('LOCKED') || String(item.role || '').includes('BOOKED')) return 'locked';
  if (item.warn || String(item.role || '').includes('DEMOTED')) return 'warn';
  return '';
}

function renderConfirmedHotel(hotel) {
  if (!hotel) return '';
  const fields = [
    ['Address', 'address'],
    ['Phone', 'phone'],
    ['Confirmation', 'itinerary'],
    ['Check-in', 'checkIn'],
    ['Check-out', 'checkOut'],
    ['Dog', 'dog'],
    ['Parking', 'parking'],
    ['Important', 'why']
  ];

  return `
    <div class="panel locked reservation-block">
      <p class="eyebrow">Confirmed hotel</p>
      <h3>${esc(hotel.name)}</h3>
      <div class="facts">
        ${fields
          .filter(([, key]) => hotel[key])
          .map(([label, key]) => `<div class="fact"><b>${esc(label)}</b><span>${esc(hotel[key])}</span></div>`)
          .join('')}
      </div>
      ${actionLinks(hotel)}
    </div>
  `;
}

function renderConfirmedDinner(dinner) {
  if (!dinner) return '';
  const fields = [
    ['Reservation', 'reservation'],
    ['Phone', 'phone'],
    ['Dog / patio', 'dog'],
    ['Important', 'why']
  ];

  return `
    <div class="panel locked reservation-block">
      <p class="eyebrow">Confirmed dinner</p>
      <h3>${esc(dinner.name)}</h3>
      <div class="facts">
        ${fields
          .filter(([, key]) => dinner[key])
          .map(([label, key]) => `<div class="fact"><b>${esc(label)}</b><span>${esc(dinner[key])}</span></div>`)
          .join('')}
      </div>
      ${actionLinks(dinner)}
    </div>
  `;
}

function renderRoute(route, hotels, dinners) {
  const hotelByName = new Map(hotels.map((hotel) => [hotel.name, hotel]));
  const dinnerByName = new Map(dinners.map((dinner) => [dinner.name, dinner]));
  document.querySelector('#route-list').innerHTML = route.map((stop, index) => {
    const hotel = stop.hotelName ? hotelByName.get(stop.hotelName) : null;
    const dinner = stop.dinnerName ? dinnerByName.get(stop.dinnerName) : null;
    return `
      <article class="card ${statusClass(stop)}">
        <div class="route-head">
          <div>
            <p class="eyebrow">${index === route.length - 1 ? 'Final leg' : `Leg ${index + 1}`} | ${esc(stop.date)}</p>
            <h3 class="stayline">${esc(stop.headline)}</h3>
            <p class="legline">${index === 0 ? 'Local start' : `${esc(route[index - 1].label)} → ${esc(stop.label)}`}</p>
          </div>
          <span class="pill ${esc(stop.color)}">${stop.color === 'green' ? 'coastal' : stop.color === 'blue' ? 'ferry approach' : stop.color === 'red' ? 'arrival' : 'inland / city'}</span>
        </div>
        <div class="facts">
          <div class="fact"><b>Drive</b><span>${esc(stop.drive)}</span></div>
          <div class="fact"><b>Overnight</b><span>${esc(stop.overnight)}</span></div>
          <div class="fact"><b>Notes</b><span>${esc(stop.note)}</span></div>
        </div>
        ${renderConfirmedHotel(hotel)}
        ${renderConfirmedDinner(dinner)}
        ${routeActionLinks(route, index)}
      </article>
    `;
  }).join('');
}

function renderCards(selector, items, fields) {
  document.querySelector(selector).innerHTML = items.map((item) => `
    <article class="card ${statusClass(item)}">
      <p class="eyebrow">${esc(item.zone)} | ${esc(item.role)}</p>
      <h3>${esc(item.name)}</h3>
      <div class="facts">
        ${fields
          .filter(([, key]) => item[key])
          .map(([label, key]) => `<div class="fact"><b>${esc(label)}</b><span>${esc(item[key])}</span></div>`)
          .join('')}
      </div>
      ${actionLinks(item)}
    </article>
  `).join('');
}

function renderMap(route) {
  const map = L.map('map', { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  const icon = (color) => L.divIcon({ className: '', html: `<span class="marker ${esc(color)}"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] });
  route.forEach((stop) => {
    L.marker(stop.coords, { icon: icon(stop.color) })
      .bindPopup(`<b>${esc(stop.label)}</b><br>${esc(stop.note)}<br><a href="${mapUrl(routeMapQuery(stop))}" target="_blank">Open Map</a>`)
      .addTo(map);
  });
  L.polyline(route.map((stop) => stop.coords), { color: '#1f6f68', weight: 4, opacity: 0.78 }).addTo(map);
  map.fitBounds(L.latLngBounds(route.map((stop) => stop.coords)), { padding: [24, 24] });
}

function fullRouteUrl(route) {
  return `https://www.google.com/maps/dir/${route.map((stop) => encodeURIComponent(routeMapQuery(stop))).join('/')}`;
}

async function main() {
  const data = await fetch('./data.json').then((response) => response.json());

  document.title = data.meta.title;
  document.querySelector('#site-title').textContent = data.meta.title;
  document.querySelector('#site-subtitle').textContent = data.meta.subtitle;
  document.querySelector('#stats').innerHTML = data.stats.map((stat) => `<div class="stat"><b>${esc(stat.label)}</b><span>${esc(stat.value)}</span></div>`).join('');
  document.querySelector('#locked-list').innerHTML = data.locked.map((item) => `<li>${esc(item)}</li>`).join('');
  document.querySelector('#full-route-link').href = fullRouteUrl(data.route);

  const lockedHotels = data.hotels.filter((hotel) => hotel.locked);
  const lockedDinners = data.dinners.filter((dinner) => dinner.locked);
  const dinnerIdeas = data.dinners.filter((dinner) => !dinner.locked);

  renderRoute(data.route, lockedHotels, lockedDinners);
  renderCards('#dinner-list', dinnerIdeas, [['Phone', 'phone'], ['Dog', 'dog'], ['Why', 'why']]);
  renderMap(data.route);

  document.querySelector('#footer').textContent = `Version ${data.meta.version} | ${data.meta.statusNote} Updated ${data.meta.updated}.`;
}

main().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML('afterbegin', '<div class="panel warn">Site data failed to load. Check data.json.</div>');
});

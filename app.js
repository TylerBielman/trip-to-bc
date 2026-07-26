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

function renderScheduledStops(appointments) {
  if (!Array.isArray(appointments) || !appointments.length) return '';
  const fields = [
    ['Time', 'time'],
    ['Address', 'address'],
    ['Details', 'details']
  ];

  return appointments.map((appointment) => `
    <div class="panel locked reservation-block">
      <p class="eyebrow">Scheduled stop</p>
      <h3>${esc(appointment.name)}</h3>
      <div class="facts">
        ${fields
          .filter(([, key]) => appointment[key])
          .map(([label, key]) => `<div class="fact"><b>${esc(label)}</b><span>${esc(appointment[key])}</span></div>`)
          .join('')}
      </div>
      ${actionLinks(appointment)}
    </div>
  `).join('');
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
        ${renderScheduledStops(stop.appointments)}
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

function applyTripOverrides(data) {
  data.meta.version = '4.1';
  data.meta.updated = '2026-07-26';
  data.meta.subtitle = 'Lake Forest to Vancouver, BC via Highway 1, the Northern California redwoods, the Oregon coast, Port Townsend, and Victoria.';
  data.meta.statusNote = 'The coastal heat-avoidance pivot is locked: Eureka on Aug 3, Bandon on Aug 4, then Portland on Aug 5.';

  const statReplacements = new Map([
    ['Locked Redding Hotel', ['Locked Eureka Hotel', 'Home2 Suites by Hilton Eureka']],
    ['Locked Jacksonville Hotel', ['Locked Bandon Stay', 'Lamplighter Inn - 109 Seahorse Reef']]
  ]);
  data.stats = data.stats.map((stat) => {
    const replacement = statReplacements.get(stat.label);
    return replacement ? { label: replacement[0], value: replacement[1] } : stat;
  });

  data.locked = data.locked
    .filter((item) => !item.includes('Thunderbird Lodge') && !item.includes('Wine Country Inn'))
    .map((item) => item === 'Aug 5-9: Residence Inn Portland Airport at Cascade Station'
      ? 'Aug 5-10: Residence Inn Portland Airport at Cascade Station'
      : item);

  const pharmacyLocked = 'Aug 3 at 9:30 AM: KP Pharmacy in Santa Cruz';
  if (!data.locked.includes(pharmacyLocked)) {
    const seawayIndex = data.locked.findIndex((item) => item === 'Aug 2-3: Seaway Inn in Santa Cruz');
    data.locked.splice(seawayIndex >= 0 ? seawayIndex + 1 : data.locked.length, 0, pharmacyLocked);
  }

  const coastalLocked = [
    'Aug 3-4: Home2 Suites by Hilton Eureka',
    'Aug 4-5: Lamplighter Inn - 109 Seahorse Reef in Bandon'
  ];
  coastalLocked.forEach((item, offset) => {
    if (!data.locked.includes(item)) {
      const pharmacyIndex = data.locked.indexOf(pharmacyLocked);
      data.locked.splice(pharmacyIndex >= 0 ? pharmacyIndex + 1 + offset : data.locked.length, 0, item);
    }
  });

  const santaCruz = data.route.find((stop) => stop.label === 'Seaway Inn, Santa Cruz');
  if (santaCruz) {
    santaCruz.note = 'Locked beachfront stay at Seaway Inn. Check out Aug 3, stop at KP Pharmacy at 9:30 AM, then take US-101 north to Eureka.';
    santaCruz.appointments = [{
      name: 'KP Pharmacy — Pick up meds',
      time: 'Monday, Aug 3 at 9:30 AM',
      address: '110 Cooper St, Suite 500, Floor 2, Room 22R03, Santa Cruz, CA 95060',
      details: 'Scheduled pharmacy stop before the coastal drive to Eureka.'
    }];
  }

  const reddingIndex = data.route.findIndex((stop) => stop.label === 'Thunderbird Lodge, Redding');
  if (reddingIndex >= 0) {
    data.route[reddingIndex] = {
      label: 'Home2 Suites by Hilton Eureka',
      mapsQuery: 'Home2 Suites by Hilton Eureka, 2112 Broadway, Eureka, CA 95501',
      date: 'Mon Aug 3-Tue Aug 4',
      drive: 'About 6.0-7.5 hr plus stops',
      overnight: 'Home2 Suites by Hilton Eureka',
      headline: '1 locked night in Eureka',
      coords: [40.7887535, -124.1809190],
      color: 'green',
      note: 'Locked coastal pivot replacing the inland Redding leg. Take US-101 north; check-in is 4:30 PM Aug 3 and checkout is 11:00 AM Aug 4.',
      hotelName: 'Home2 Suites by Hilton Eureka',
      locked: true
    };
  }

  const jacksonvilleIndex = data.route.findIndex((stop) => stop.label === 'Wine Country Inn, Jacksonville');
  if (jacksonvilleIndex >= 0) {
    data.route[jacksonvilleIndex] = {
      label: 'Lamplighter Inn - 109 Seahorse Reef, Bandon',
      mapsQuery: 'Lamplighter Inn - 109 Seahorse Reef, 40 North Ave SE Unit 109, Bandon, OR 97411',
      date: 'Tue Aug 4-Wed Aug 5',
      drive: 'About 4.0-5.0 hr plus stops',
      overnight: 'Lamplighter Inn - 109 Seahorse Reef',
      headline: '1 locked night in Bandon',
      coords: [43.120047, -124.39815],
      color: 'green',
      note: 'Locked coastal overnight on US-101. Check-in is from 4:00 PM Aug 4 and checkout is by 10:00 AM Aug 5. Complete the Guest Portal and rental agreement before arrival; access instructions are sent one day before check-in.',
      hotelName: 'Lamplighter Inn - 109 Seahorse Reef',
      locked: true
    };
  }

  const portland = data.route.find((stop) => stop.label === 'Residence Inn Portland Airport at Cascade Station');
  if (portland) {
    portland.date = 'Wed Aug 5-Mon Aug 10';
    portland.drive = 'About 4.5-5.5 hr plus stops';
    portland.headline = '5 locked nights in Portland';
    portland.note = 'Locked five-night Portland base near Cascade Station and SE 109th. Drive inland from Bandon toward I-5; check in Aug 5 at 4:00 PM and check out Aug 10.';
  }

  const seattle = data.route.find((stop) => stop.label === 'Seattle / Northgate');
  if (seattle) {
    seattle.date = 'Mon Aug 10-Tue Aug 11';
    seattle.overnight = 'One night in Northgate';
    seattle.headline = '1 night in Seattle / Northgate';
    seattle.note = 'One-night Seattle stay in the Northgate area. Hotel not yet locked.';
  }

  data.hotels = data.hotels.filter((hotel) => !['Redding', 'Jacksonville'].includes(hotel.zone));

  const home2 = {
    zone: 'Eureka',
    name: 'Home2 Suites by Hilton Eureka',
    role: 'LOCKED - Aug 3-4 Eureka stay',
    phone: '707-442-2949',
    address: '2112 Broadway, Eureka, CA 95501',
    url: 'https://www.hilton.com/en/hotels/acverht-home2-suites-eureka/',
    itinerary: '82576336',
    checkIn: 'Aug 3, 4:30 PM',
    checkOut: 'Aug 4, 11:00 AM',
    dog: '$75 non-refundable pet fee for a 1-4 night stay; up to 2 dogs or cats, 50 lb maximum each. Confirm the dog is attached to the reservation.',
    parking: 'Complimentary on-site self-parking. Parking is not secured or covered; EV charging is available.',
    why: 'Confirmed 1 King Bed Studio Suite. Bring passports, immigration paperwork, medications, electronics, and other irreplaceable items into the room.',
    locked: true
  };

  const lamplighter = {
    zone: 'Bandon',
    name: 'Lamplighter Inn - 109 Seahorse Reef',
    role: 'LOCKED - Aug 4-5 Bandon stay',
    phone: '503-345-9399',
    address: '40 North Ave SE, Unit 109, Bandon, OR 97411',
    url: 'https://www.booking.com/hotel/us/lamplighter-inn-109-seahorse-reef.html',
    itinerary: '6502249790',
    checkIn: 'Aug 4, from 4:00 PM',
    checkOut: 'Aug 5, by 10:00 AM',
    dog: 'Pets are allowed on request; the Unit 109 listing permits dogs. Confirm the dog approval and any applicable charge in the Guest Portal.',
    parking: 'Free parking for 1 vehicle is listed for Unit 109.',
    why: 'Complete the Guest Portal and required rental agreement before arrival. Access instructions are sent Aug 3. The unit has no air-conditioning; a box fan is provided.',
    locked: true
  };

  if (!data.hotels.some((hotel) => hotel.name === home2.name)) {
    const portlandHotelIndex = data.hotels.findIndex((hotel) => hotel.zone === 'Portland');
    data.hotels.splice(portlandHotelIndex >= 0 ? portlandHotelIndex : data.hotels.length, 0, home2, lamplighter);
  }

  const portlandHotel = data.hotels.find((hotel) => hotel.zone === 'Portland');
  if (portlandHotel) {
    portlandHotel.role = 'LOCKED - Aug 5-10 Portland stay';
    portlandHotel.checkOut = 'Aug 10';
    portlandHotel.why = 'Locked five-night Portland base near Cascade Station and SE 109th.';
  }

  return data;
}

async function main() {
  const data = applyTripOverrides(await fetch('./data.json').then((response) => response.json()));

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

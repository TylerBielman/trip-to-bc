(() => {
  const originalFetch = window.fetch.bind(window);

  const swan = {
    zone: 'Port Townsend',
    name: 'The Swan Hotel',
    role: 'LOCKED - Aug 11-12 Port Townsend stay',
    phone: '360-385-1718',
    address: '222 Monroe St, Port Townsend, WA 98368',
    url: 'https://theswanhotel.com/',
    itinerary: '52526708',
    checkIn: 'Aug 11, 3:00 PM',
    checkOut: 'Aug 12, 11:00 AM',
    dog: 'One dog is included on the reservation. Pet fee: $30 USD.',
    parking: 'Main-building parking is first-come, first-served. A 24-hour free public lot and street parking are within walking distance. Hotel parking is at your own risk.',
    why: 'Ground-floor queen guest room for Tyler and Stephanie. Total and balance due: $295.47 USD. Changes or cancellations must be made by 3:00 PM at least 72 hours before arrival.',
    locked: true,
    links: [
      { label: 'Email Hotel', url: 'mailto:frontdesk@theswanhotel.com' }
    ]
  };

  function patchSwanData(data) {
    if (!data || !Array.isArray(data.route)) return data;

    const portTownsend = data.route.find((stop) => stop.label === 'Port Townsend');
    if (portTownsend) {
      portTownsend.mapsQuery = `${swan.name}, ${swan.address}`;
      portTownsend.drive = 'About 1 hr 5 min from Kingston after unloading; target arrival around 4:00–4:20 PM';
      portTownsend.overnight = swan.name;
      portTownsend.headline = '1 locked night at The Swan Hotel';
      portTownsend.note = 'Confirmed ground-floor queen room for Aug 11–12, with one dog. Check in from 3:00 PM and check out by 11:00 AM, then leave for Port Angeles by 9:45 AM for the confirmed Coho sailing.';
      portTownsend.hotelName = swan.name;
      portTownsend.locked = true;
    }

    if (Array.isArray(data.hotels)) {
      data.hotels = data.hotels.filter((hotel) => hotel.name !== swan.name && hotel.zone !== 'Port Townsend');
      const vancouverIndex = data.hotels.findIndex((hotel) => hotel.zone === 'Vancouver');
      data.hotels.splice(vancouverIndex >= 0 ? vancouverIndex : data.hotels.length, 0, swan);
    }

    if (Array.isArray(data.locked)) {
      const lockedItem = 'Aug 11-12: The Swan Hotel in Port Townsend — confirmation 52526708';
      if (!data.locked.includes(lockedItem)) {
        const ferryIndex = data.locked.findIndex((item) => item.includes('Edmonds–Kingston ferry'));
        data.locked.splice(ferryIndex >= 0 ? ferryIndex + 1 : data.locked.length, 0, lockedItem);
      }
    }

    return data;
  }

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const input = args[0];
    const requestUrl = typeof input === 'string' ? input : input?.url;
    if (!requestUrl || !/data\.json(?:[?#]|$)/i.test(requestUrl)) return response;

    try {
      const data = patchSwanData(await response.clone().json());
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/json; charset=utf-8');
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('Could not apply Swan Hotel update', error);
      return response;
    }
  };

  function addSwanDetails() {
    const cards = [...document.querySelectorAll('#route-list > .card')];
    const card = cards.find((item) => item.textContent.includes('The Swan Hotel'));
    if (!card) return false;

    if (!card.querySelector('[data-swan-confirmation]')) {
      const panel = document.createElement('div');
      panel.className = 'panel locked reservation-block';
      panel.dataset.swanConfirmation = 'true';
      panel.innerHTML = `
        <p class="eyebrow">Confirmed lodging between ferries</p>
        <h3>Tuesday, Aug 11 — The Swan Hotel</h3>
        <div class="facts">
          <div class="fact"><b>Confirmation</b><span>52526708</span></div>
          <div class="fact"><b>Address</b><span>222 Monroe St, Port Townsend, WA 98368</span></div>
          <div class="fact"><b>Room</b><span>A1 — Ground Floor Queen Guest Room.</span></div>
          <div class="fact"><b>Guests</b><span>Tyler Bielman and Stephanie Bogaert; one room for one night.</span></div>
          <div class="fact"><b>Check-in</b><span>Tuesday, Aug 11 at 3:00 PM.</span></div>
          <div class="fact"><b>Check-out</b><span>Wednesday, Aug 12 by 11:00 AM.</span></div>
          <div class="fact"><b>Dog</b><span>One dog is registered. Pet fee: $30 USD.</span></div>
          <div class="fact"><b>Room cost</b><span>$235.00 USD.</span></div>
          <div class="fact"><b>Total / balance due</b><span>$295.47 USD.</span></div>
          <div class="fact"><b>Parking</b><span>Main-building spaces are first-come, first-served. A 24-hour free public lot and street parking are available within walking distance. Hotel parking is at your own risk.</span></div>
          <div class="fact"><b>Cancellation</b><span>Changes or cancellations must be made by 3:00 PM at least 72 hours before the scheduled arrival or change date.</span></div>
          <div class="fact"><b>Morning plan</b><span>Leave Port Townsend by 9:45 AM for an 11:00–11:15 AM arrival at the Port Angeles ferry terminal.</span></div>
        </div>
        <div class="actions">
          <a href="https://theswanhotel.com/" target="_blank" rel="noreferrer">Hotel Website</a>
          <a href="tel:+13603851718">Call 360-385-1718</a>
          <a href="mailto:frontdesk@theswanhotel.com">Email Hotel</a>
        </div>`;

      const actionRow = card.querySelector(':scope > .actions');
      card.insertBefore(panel, actionRow || null);
    }

    const lockedList = document.querySelector('#locked-list');
    if (lockedList) {
      let item = [...lockedList.children].find((entry) => entry.textContent.includes('The Swan Hotel'));
      if (!item) {
        item = document.createElement('li');
        item.textContent = 'Aug 11-12: The Swan Hotel in Port Townsend — confirmation 52526708';
        lockedList.appendChild(item);
      }
      const ferryItem = [...lockedList.children].find((entry) => entry.textContent.includes('Edmonds–Kingston ferry'));
      if (ferryItem && item.previousElementSibling !== ferryItem) ferryItem.insertAdjacentElement('afterend', item);
    }

    const footer = document.querySelector('#footer');
    if (footer) footer.textContent = 'Version 4.5 | All lodging and ferry legs are now confirmed and documented. Updated 2026-07-27.';
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (addSwanDetails() || attempts > 50) clearInterval(timer);
  }, 100);
})();
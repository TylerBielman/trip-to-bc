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
    why: 'A1 ground-floor queen guest room for Tyler and Stephanie. Room: $235.00 USD; total and balance due: $295.47 USD. Changes or cancellations must be made by 3:00 PM at least 72 hours before arrival.',
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
      portTownsend.note = 'Confirmed A1 ground-floor queen room for Aug 11–12, with one dog. Check in from 3:00 PM and check out by 11:00 AM, then leave for Port Angeles by 9:45 AM for the confirmed Coho sailing.';
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

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const footer = document.querySelector('#footer');
    if (footer) {
      footer.textContent = 'Version 4.5 | All lodging and ferry legs are now confirmed and documented. Updated 2026-07-27.';
      clearInterval(timer);
    } else if (attempts > 50) {
      clearInterval(timer);
    }
  }, 100);
})();
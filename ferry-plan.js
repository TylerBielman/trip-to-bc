(() => {
  const originalFetch = window.fetch.bind(window);

  const ferryLinks = {
    schedule: 'https://wsdot.com/ferries/schedule/scheduledetailbyroute.aspx?route=ed-king',
    conditions: 'https://wsdot.com/ferries/vesselwatch/TerminalDetail.aspx?terminalid=8',
    fares: 'https://wsdot.wa.gov/ferries/fares/faresdetail.aspx?arrivingterm=12&departingterm=8'
  };

  function patchTripData(data) {
    if (!data || !Array.isArray(data.route)) return data;

    const seattle = data.route.find((stop) => stop.label === 'Seattle / Northgate');
    if (seattle) {
      const appointments = Array.isArray(seattle.appointments) ? seattle.appointments : [];
      if (!appointments.some((item) => item.name === 'KP Neurology phone appointment')) {
        appointments.push({
          name: 'KP Neurology phone appointment',
          time: 'Tuesday, Aug 11, 11:45 AM–12:45 PM',
          address: 'Take privately at Watertown Hotel or from a quiet parked location',
          details: 'Have the car packed and the dog walked by 11:00 AM. Request a 1:00 PM late checkout; if unavailable, load the car first and take the call from a quiet parked location.'
        });
      }
      seattle.appointments = appointments;
    }

    const ferryStop = {
      label: 'Edmonds–Kingston Ferry',
      mapsQuery: 'Edmonds Ferry Terminal, 199 Sunset Ave S, Edmonds, WA 98020',
      date: 'Tue Aug 11',
      drive: 'Depart Watertown Hotel at 12:55 PM; allow 35–45 min and join the vehicle queue by 1:35–1:45 PM',
      overnight: 'Continue to Port Townsend',
      headline: '2:25 PM Edmonds → Kingston ferry',
      coords: [47.8104, -122.3843],
      color: 'blue',
      note: 'Primary sailing: 2:25 PM, arriving Kingston about 2:55 PM after the roughly 30-minute crossing. Backup sailing: 3:15 PM. This route has no vehicle reservations; loading is first-come, first-served. Expected Port Townsend arrival is 4:00–4:20 PM.',
      locked: true,
      links: [
        { label: 'WSDOT Schedule', url: ferryLinks.schedule },
        { label: 'Live Terminal Conditions', url: ferryLinks.conditions },
        { label: 'Calculate Ferry Fare', url: ferryLinks.fares }
      ]
    };

    const existingFerryIndex = data.route.findIndex((stop) => stop.label === ferryStop.label);
    if (existingFerryIndex >= 0) {
      data.route[existingFerryIndex] = ferryStop;
    } else {
      const seattleIndex = data.route.findIndex((stop) => stop.label === 'Seattle / Northgate');
      const portTownsendIndex = data.route.findIndex((stop) => stop.label === 'Port Townsend');
      const insertAt = seattleIndex >= 0 ? seattleIndex + 1 : (portTownsendIndex >= 0 ? portTownsendIndex : data.route.length);
      data.route.splice(insertAt, 0, ferryStop);
    }

    const portTownsend = data.route.find((stop) => stop.label === 'Port Townsend');
    if (portTownsend) {
      portTownsend.drive = 'About 1 hr 5 min from Kingston after unloading; target a 4:00–4:20 PM arrival';
      portTownsend.note = 'Arrive via the Edmonds–Kingston ferry, then follow SR 104 across the Hood Canal Bridge and WA-19 to Port Townsend. Final US-side buffer night before driving to the Port Angeles–Victoria ferry.';
    }

    if (Array.isArray(data.locked)) {
      const lockedItem = 'Aug 11: 2:25 PM Edmonds–Kingston ferry (3:15 PM backup)';
      if (!data.locked.includes(lockedItem)) {
        const seattleLockedIndex = data.locked.findIndex((item) => item.includes('Watertown Hotel') || item.includes('Seattle'));
        data.locked.splice(seattleLockedIndex >= 0 ? seattleLockedIndex + 1 : data.locked.length, 0, lockedItem);
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
      const data = patchTripData(await response.clone().json());
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/json; charset=utf-8');
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('Could not apply ferry itinerary patch', error);
      return response;
    }
  };

  const escFerry = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function addFerryDetails() {
    const cards = [...document.querySelectorAll('#route-list > .card')];
    const card = cards.find((item) => item.textContent.includes('Edmonds–Kingston Ferry'));
    if (!card) return false;

    if (!card.querySelector('[data-ferry-plan]')) {
      const panel = document.createElement('div');
      panel.className = 'panel locked reservation-block';
      panel.dataset.ferryPlan = 'true';
      panel.innerHTML = `
        <p class="eyebrow">Ferry game plan</p>
        <h3>Tuesday, Aug 11 — Edmonds to Kingston</h3>
        <div class="facts">
          <div class="fact"><b>Leave hotel</b><span>12:55 PM from Watertown Hotel after the 11:45 AM–12:45 PM neurology call.</span></div>
          <div class="fact"><b>Drive to terminal</b><span>Allow 35–45 minutes. Take I-5 North to Exit 177, then SR 104 West to the Edmonds ferry terminal.</span></div>
          <div class="fact"><b>Queue target</b><span>Join the vehicle line by 1:35–1:45 PM, approximately 40–50 minutes before sailing.</span></div>
          <div class="fact"><b>Primary sailing</b><span>2:25 PM Edmonds departure; approximately 30 minutes; arrive Kingston around 2:55 PM.</span></div>
          <div class="fact"><b>Backup sailing</b><span>3:15 PM if traffic or loading prevents boarding the primary sailing. Expected Port Townsend arrival around 5:00 PM.</span></div>
          <div class="fact"><b>Reservations</b><span>No vehicle reservations are offered on Edmonds–Kingston. Vehicles load first-come, first-served; an online ticket does not guarantee a sailing.</span></div>
          <div class="fact"><b>Estimated fare</b><span>$27.00 for a standard vehicle under 22 feet with driver, plus $11.35 for the additional adult: $38.35 total before the 3% card-processing surcharge.</span></div>
          <div class="fact"><b>Dog</b><span>Keep the dog leashed. Pets are allowed in most passenger areas, but not food-service areas or other posted restricted spaces.</span></div>
          <div class="fact"><b>After Kingston</b><span>Follow SR 104 west across the Hood Canal Bridge, then WA-19 toward Port Townsend. Target arrival: 4:00–4:20 PM.</span></div>
        </div>
        <div class="actions">
          <a href="${escFerry(ferryLinks.schedule)}" target="_blank" rel="noreferrer">WSDOT Schedule</a>
          <a href="${escFerry(ferryLinks.conditions)}" target="_blank" rel="noreferrer">Live Terminal Conditions</a>
          <a href="${escFerry(ferryLinks.fares)}" target="_blank" rel="noreferrer">Fare Calculator</a>
        </div>`;

      const actionRow = card.querySelector(':scope > .actions');
      card.insertBefore(panel, actionRow || null);
    }

    const lockedList = document.querySelector('#locked-list');
    if (lockedList) {
      let ferryItem = [...lockedList.children].find((item) => item.textContent.includes('Edmonds–Kingston ferry'));
      if (!ferryItem) {
        ferryItem = document.createElement('li');
        ferryItem.textContent = 'Aug 11: 2:25 PM Edmonds–Kingston ferry (3:15 PM backup)';
        lockedList.appendChild(ferryItem);
      }
      const seattleItem = [...lockedList.children].find((item) => item.textContent.includes('Watertown Hotel') || item.textContent.includes('Seattle'));
      if (seattleItem && ferryItem.previousElementSibling !== seattleItem) seattleItem.insertAdjacentElement('afterend', ferryItem);
    }

    const footer = document.querySelector('#footer');
    if (footer) footer.textContent = 'Version 4.2 | Edmonds–Kingston ferry plan added for Aug 11. Updated 2026-07-27.';
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (addFerryDetails() || attempts > 50) clearInterval(timer);
  }, 100);
})();

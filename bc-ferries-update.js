(() => {
  const originalFetch = window.fetch.bind(window);

  const bcFerriesLinks = {
    conditions: 'https://www.bcferries.com/current-conditions/SWB-TSA',
    account: 'https://www.bcferries.com/my-account',
    travelInfo: 'https://www.bcferries.com/travel-policies/important-travel-information/33V'
  };

  function patchBcFerriesData(data) {
    if (!data || !Array.isArray(data.route)) return data;

    const swartzBay = data.route.find((stop) => stop.label === 'Swartz Bay Ferry Terminal');
    if (swartzBay) {
      swartzBay.drive = 'Plan departure from the family stay to arrive at Swartz Bay between 12:00 and 12:15 PM; reserved-vehicle check-in closes at 12:30 PM';
      swartzBay.overnight = 'Confirmed 1:00 PM BC Ferries sailing to Tsawwassen';
      swartzBay.headline = 'Confirmed Swartz Bay → Tsawwassen ferry';
      swartzBay.note = 'Booking B265429609. Depart Tuesday, Aug 18 at 1:00 PM aboard Spirit of British Columbia and arrive Tsawwassen at 2:35 PM. Prepaid reservation for one under-height passenger vehicle up to 20 ft and two passengers age 12+.';
      swartzBay.locked = true;
      swartzBay.links = [
        { label: 'Current Ferry Conditions', url: bcFerriesLinks.conditions },
        { label: 'Manage BC Ferries Booking', url: bcFerriesLinks.account },
        { label: 'Important Travel Information', url: bcFerriesLinks.travelInfo }
      ];
    }

    const level = data.route.find((stop) => stop.label === 'Level Downtown – Howe');
    if (level) {
      level.drive = 'Arrive Tsawwassen at 2:35 PM; allow about 45–75 min after unloading and target Level around 3:30–4:00 PM, depending on traffic';
      level.note = 'Arrive from the confirmed 1:00 PM Swartz Bay sailing, scheduled into Tsawwassen at 2:35 PM. Target the 4:00 PM check-in at Level Downtown – Howe. Enter from Howe Street or the alley between Drake and Pacific; check in with Guest Services before entering the secure parkade.';
    }

    if (Array.isArray(data.locked)) {
      const lockedItem = 'Aug 18: BC Ferries booking B265429609 — 1:00 PM Swartz Bay–Tsawwassen sailing';
      if (!data.locked.includes(lockedItem)) {
        const victoriaIndex = data.locked.findIndex((item) => item.includes('Stay with family in Victoria'));
        data.locked.splice(victoriaIndex >= 0 ? victoriaIndex + 1 : data.locked.length, 0, lockedItem);
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
      const data = patchBcFerriesData(await response.clone().json());
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/json; charset=utf-8');
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('Could not apply BC Ferries reservation update', error);
      return response;
    }
  };

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function addBcFerriesDetails() {
    const cards = [...document.querySelectorAll('#route-list > .card')];
    const card = cards.find((item) => item.textContent.includes('Swartz Bay Ferry Terminal'));
    if (!card) return false;

    if (!card.querySelector('[data-bc-ferries-reservation]')) {
      const panel = document.createElement('div');
      panel.className = 'panel locked reservation-block';
      panel.dataset.bcFerriesReservation = 'true';
      panel.innerHTML = `
        <p class="eyebrow">Confirmed ferry reservation</p>
        <h3>Tuesday, Aug 18 — Swartz Bay to Tsawwassen</h3>
        <div class="facts">
          <div class="fact"><b>Booking reference</b><span>B265429609</span></div>
          <div class="fact"><b>Booking holder</b><span>S Bogaert</span></div>
          <div class="fact"><b>Fare status</b><span>Prepaid.</span></div>
          <div class="fact"><b>Departure</b><span>1:00 PM from Victoria (Swartz Bay).</span></div>
          <div class="fact"><b>Arrival</b><span>2:35 PM at Vancouver (Tsawwassen).</span></div>
          <div class="fact"><b>Ferry</b><span>Spirit of British Columbia.</span></div>
          <div class="fact"><b>Terminal target</b><span>Arrive between 12:00 and 12:15 PM.</span></div>
          <div class="fact"><b>Check-in window</b><span>Reserved vehicles must check in 30–60 minutes before departure. Check-in opens at 12:00 PM and closes at 12:30 PM.</span></div>
          <div class="fact"><b>Important</b><span>Do not arrive before noon or after 12:30 PM; outside that window the booking may not be honoured and travel becomes first-come, first-served.</span></div>
          <div class="fact"><b>Vehicle</b><span>One under-height passenger vehicle up to 20 ft (6.10 m).</span></div>
          <div class="fact"><b>Passengers</b><span>Two passengers age 12+.</span></div>
          <div class="fact"><b>Redeem booking</b><span>Provide the booking reference or the phone number used to make the reservation.</span></div>
          <div class="fact"><b>Vehicle alarm</b><span>Lock the vehicle without activating its alarm; ship movement and vibration can trigger it.</span></div>
          <div class="fact"><b>Vehicle dimensions</b><span>The reservation only applies to the booked vehicle category and size. A height mismatch or a length difference greater than 5 ft can invalidate it.</span></div>
          <div class="fact"><b>After Tsawwassen</b><span>Allow about 45–75 minutes after unloading. Target Level Downtown – Howe around 3:30–4:00 PM, depending on traffic.</span></div>
        </div>
        <div class="actions">
          <a href="${esc(bcFerriesLinks.conditions)}" target="_blank" rel="noreferrer">Current Ferry Conditions</a>
          <a href="${esc(bcFerriesLinks.account)}" target="_blank" rel="noreferrer">Manage Booking</a>
          <a href="${esc(bcFerriesLinks.travelInfo)}" target="_blank" rel="noreferrer">Travel Information</a>
        </div>`;

      const actionRow = card.querySelector(':scope > .actions');
      card.insertBefore(panel, actionRow || null);
    }

    const lockedList = document.querySelector('#locked-list');
    if (lockedList) {
      let item = [...lockedList.children].find((entry) => entry.textContent.includes('B265429609'));
      if (!item) {
        item = document.createElement('li');
        item.textContent = 'Aug 18: BC Ferries booking B265429609 — 1:00 PM Swartz Bay–Tsawwassen sailing';
        lockedList.appendChild(item);
      }
      const victoriaItem = [...lockedList.children].find((entry) => entry.textContent.includes('Stay with family in Victoria'));
      if (victoriaItem && item.previousElementSibling !== victoriaItem) victoriaItem.insertAdjacentElement('afterend', item);
    }

    const footer = document.querySelector('#footer');
    if (footer) footer.textContent = 'Version 4.4 | All three ferry legs are now documented with confirmed bookings where applicable. Updated 2026-07-27.';
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (addBcFerriesDetails() || attempts > 50) clearInterval(timer);
  }, 100);
})();

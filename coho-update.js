(() => {
  const originalFetch = window.fetch.bind(window);

  const cohoLinks = {
    schedule: 'https://www.cohoferry.com/schedule-fares',
    bookings: 'https://www.cohoferry.com/book-now'
  };

  function patchCohoData(data) {
    if (!data || !Array.isArray(data.route)) return data;

    const portTownsend = data.route.find((stop) => stop.label === 'Port Townsend');
    if (portTownsend) {
      portTownsend.note = 'Arrive via the Edmonds–Kingston ferry, then follow SR 104 across the Hood Canal Bridge and WA-19 to Port Townsend. Final US-side overnight before the confirmed Port Angeles–Victoria sailing.';
    }

    const portAngeles = data.route.find((stop) => stop.label === 'Port Angeles Ferry Terminal');
    if (portAngeles) {
      portAngeles.drive = 'Leave Port Townsend by 9:45 AM; target terminal arrival 11:00–11:15 AM and complete check-in by 11:45 AM';
      portAngeles.overnight = 'Confirmed 12:45 PM Coho ferry to Victoria';
      portAngeles.headline = 'Confirmed Port Angeles → Victoria ferry';
      portAngeles.note = 'Reservation 1568294. Drive-on sailing departs Wednesday, Aug 12 at 12:45 PM. Coho requires arrival 60 minutes before departure and check-in by 11:45 AM; late arrivals may lose the reservation and be moved to standby.';
      portAngeles.locked = true;
      portAngeles.links = [
        { label: 'Coho Schedule + Fares', url: cohoLinks.schedule },
        { label: 'Coho Bookings', url: cohoLinks.bookings }
      ];
    }

    const victoria = data.route.find((stop) => stop.label === 'Victoria, BC — Family Stay');
    if (victoria) {
      victoria.drive = 'Arrive on the confirmed 12:45 PM Coho sailing from Port Angeles';
      victoria.note = 'Arrive in Victoria on Aug 12 via confirmed Coho reservation 1568294 and stay with family through the morning of Aug 18. Use this week to recover, handle B.C. setup tasks, and prepare for the final ferry leg.';
    }

    if (Array.isArray(data.locked)) {
      const lockedItem = 'Aug 12: Coho reservation 1568294 — 12:45 PM Port Angeles–Victoria ferry';
      if (!data.locked.includes(lockedItem)) {
        const edmondsIndex = data.locked.findIndex((item) => item.includes('Edmonds–Kingston ferry'));
        data.locked.splice(edmondsIndex >= 0 ? edmondsIndex + 1 : data.locked.length, 0, lockedItem);
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
      const data = patchCohoData(await response.clone().json());
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/json; charset=utf-8');
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('Could not apply Coho reservation update', error);
      return response;
    }
  };

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function addCohoDetails() {
    const cards = [...document.querySelectorAll('#route-list > .card')];
    const card = cards.find((item) => item.textContent.includes('Port Angeles Ferry Terminal'));
    if (!card) return false;

    if (!card.querySelector('[data-coho-reservation]')) {
      const panel = document.createElement('div');
      panel.className = 'panel locked reservation-block';
      panel.dataset.cohoReservation = 'true';
      panel.innerHTML = `
        <p class="eyebrow">Confirmed ferry reservation</p>
        <h3>Wednesday, Aug 12 — Port Angeles to Victoria</h3>
        <div class="facts">
          <div class="fact"><b>Reservation</b><span>1568294</span></div>
          <div class="fact"><b>Departure</b><span>12:45 PM from Port Angeles aboard the Coho ferry.</span></div>
          <div class="fact"><b>Leave Port Townsend</b><span>9:45 AM.</span></div>
          <div class="fact"><b>Terminal target</b><span>Arrive around 11:00–11:15 AM.</span></div>
          <div class="fact"><b>Required check-in</b><span>Complete drive-on check-in no later than 11:45 AM. Coho requires arrival 60 minutes before departure; late arrivals may lose the reservation and be moved to standby.</span></div>
          <div class="fact"><b>Vehicle</b><span>One drive-on vehicle, 18 feet or under.</span></div>
          <div class="fact"><b>Passengers</b><span>Three adults, including the driver.</span></div>
          <div class="fact"><b>Estimated total</b><span>$150 USD.</span></div>
          <div class="fact"><b>Already paid</b><span>$12 USD.</span></div>
          <div class="fact"><b>Due at terminal</b><span>Approximately $138 USD, payable in U.S. dollars or the Canadian-dollar equivalent.</span></div>
        </div>
        <div class="actions">
          <a href="${esc(cohoLinks.schedule)}" target="_blank" rel="noreferrer">Coho Schedule + Fares</a>
          <a href="${esc(cohoLinks.bookings)}" target="_blank" rel="noreferrer">Manage / Book Ferry</a>
        </div>`;

      const actionRow = card.querySelector(':scope > .actions');
      card.insertBefore(panel, actionRow || null);
    }

    const lockedList = document.querySelector('#locked-list');
    if (lockedList) {
      let item = [...lockedList.children].find((entry) => entry.textContent.includes('Coho reservation 1568294'));
      if (!item) {
        item = document.createElement('li');
        item.textContent = 'Aug 12: Coho reservation 1568294 — 12:45 PM Port Angeles–Victoria ferry';
        lockedList.appendChild(item);
      }
      const edmondsItem = [...lockedList.children].find((entry) => entry.textContent.includes('Edmonds–Kingston ferry'));
      if (edmondsItem && item.previousElementSibling !== edmondsItem) edmondsItem.insertAdjacentElement('afterend', item);
    }

    const footer = document.querySelector('#footer');
    if (footer) footer.textContent = 'Version 4.3 | Both Washington ferry legs confirmed and documented. Updated 2026-07-27.';
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (addCohoDetails() || attempts > 50) clearInterval(timer);
  }, 100);
})();
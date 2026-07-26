(() => {
  const hotel = {
    name: 'Watertown Hotel',
    address: '4242 Roosevelt Way NE, Seattle, WA 98105',
    phone: '(206) 826-4242',
    confirmation: '44393',
    checkIn: 'Aug 10, after 4:00 PM',
    checkOut: 'Aug 11, before noon',
    parking: '$25 per night plus tax for covered, on-site overnight parking.',
    total: '$359.76 USD',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Watertown%20Hotel%2C%204242%20Roosevelt%20Way%20NE%2C%20Seattle%2C%20WA%2098105',
    siteUrl: 'https://www.staypineapple.com/watertown-hotel-seattle-wa'
  };

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function applySeattleUpdate() {
    const routeCards = [...document.querySelectorAll('#route-list > .card')];
    const card = routeCards.find((item) => item.textContent.includes('Seattle / Northgate'));
    if (!card) return false;

    const stayline = card.querySelector('.stayline');
    if (stayline) stayline.textContent = '1 locked night at Watertown Hotel';

    const facts = [...card.querySelectorAll('.fact')];
    const overnight = facts.find((fact) => fact.querySelector('b')?.textContent === 'Overnight');
    if (overnight) overnight.querySelector('span').textContent = 'Watertown Hotel';
    const notes = facts.find((fact) => fact.querySelector('b')?.textContent === 'Notes');
    if (notes) notes.querySelector('span').textContent = 'Locked one-night Seattle stay in the University District. Check in after 4:00 PM Aug 10 and check out before noon Aug 11.';

    card.classList.add('locked');

    if (!card.querySelector('[data-seattle-hotel]')) {
      const panel = document.createElement('div');
      panel.className = 'panel locked reservation-block';
      panel.dataset.seattleHotel = 'true';
      panel.innerHTML = `
        <p class="eyebrow">Confirmed hotel</p>
        <h3>${esc(hotel.name)}</h3>
        <div class="facts">
          <div class="fact"><b>Address</b><span>${esc(hotel.address)}</span></div>
          <div class="fact"><b>Phone</b><span>${esc(hotel.phone)}</span></div>
          <div class="fact"><b>Confirmation</b><span>${esc(hotel.confirmation)}</span></div>
          <div class="fact"><b>Check-in</b><span>${esc(hotel.checkIn)}</span></div>
          <div class="fact"><b>Check-out</b><span>${esc(hotel.checkOut)}</span></div>
          <div class="fact"><b>Parking</b><span>${esc(hotel.parking)}</span></div>
          <div class="fact"><b>Reservation total</b><span>${esc(hotel.total)}</span></div>
          <div class="fact"><b>Important</b><span>Confirm the dog is attached to the reservation before arrival.</span></div>
        </div>
        <div class="actions">
          <a href="${hotel.mapUrl}" target="_blank" rel="noreferrer">Open Map</a>
          <a href="${hotel.siteUrl}" target="_blank" rel="noreferrer">Official Site</a>
          <a href="tel:+12068264242">Call ${esc(hotel.phone)}</a>
        </div>`;

      const actionRow = card.querySelector(':scope > .actions');
      card.insertBefore(panel, actionRow || null);
    }

    const lockedList = document.querySelector('#locked-list');
    if (lockedList && !lockedList.textContent.includes('Watertown Hotel')) {
      const item = document.createElement('li');
      item.textContent = 'Aug 10-11: Watertown Hotel in Seattle';
      const portlandItem = [...lockedList.children].find((li) => li.textContent.includes('Residence Inn Portland'));
      if (portlandItem) portlandItem.insertAdjacentElement('afterend', item);
      else lockedList.appendChild(item);
    }

    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (applySeattleUpdate() || attempts > 40) clearInterval(timer);
  }, 100);
})();

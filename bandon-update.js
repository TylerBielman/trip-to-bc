(() => {
  const stay = {
    name: 'Lamplighter Inn – 109 Seahorse Reef',
    address: '40 North Ave NE, Bandon, OR 97411',
    phone: '(541) 233-2271',
    booking: '6502249790',
    checkIn: 'Aug 4, after 4:00 PM',
    checkOut: 'Aug 5, before 10:00 AM',
    parking: 'Free parking for 1 vehicle.',
    dog: 'Dog-friendly; the listing allows up to 4 dogs. Only registered guests and approved pets are permitted.',
    access: 'Electronic lock. The unique door code and full access instructions are scheduled to arrive 1 day before check-in.',
    amenities: 'Fast Wi-Fi, Roku TV, mini-fridge, microwave, coffee maker, towels and linens. No air-conditioning; a box fan is provided.',
    rules: 'Quiet hours are 10:00 PM–8:00 AM. Noise-monitoring technology measures sound levels only, not conversations.',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Lamplighter%20Inn%2C%2040%20North%20Ave%20NE%2C%20Bandon%2C%20OR%2097411',
    listingUrl: 'https://www.booking.com/hotel/us/lamplighter-inn-109-seahorse-reef.html'
  };

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  function applyBandonUpdate() {
    const routeCards = [...document.querySelectorAll('#route-list > .card')];
    const card = routeCards.find((item) => item.textContent.includes('Wine Country Inn') || item.textContent.includes('Jacksonville'));
    if (!card) return false;

    const title = card.querySelector('h3');
    if (title) title.textContent = 'Lamplighter Inn – Bandon';

    const stayline = card.querySelector('.stayline');
    if (stayline) stayline.textContent = '1 locked night at Lamplighter Inn – 109 Seahorse Reef';

    const facts = [...card.querySelectorAll('.fact')];
    const overnight = facts.find((fact) => fact.querySelector('b')?.textContent === 'Overnight');
    if (overnight) overnight.querySelector('span').textContent = stay.name;
    const notes = facts.find((fact) => fact.querySelector('b')?.textContent === 'Notes');
    if (notes) notes.querySelector('span').textContent = 'Locked one-night Bandon stay. Electronic-lock access instructions and the unique door code will be sent 1 day before check-in.';

    card.classList.add('locked');

    const existingReservation = card.querySelector('.reservation-block');
    if (existingReservation) existingReservation.remove();

    if (!card.querySelector('[data-bandon-stay]')) {
      const panel = document.createElement('div');
      panel.className = 'panel locked reservation-block';
      panel.dataset.bandonStay = 'true';
      panel.innerHTML = `
        <p class="eyebrow">Confirmed Bandon stay</p>
        <h3>${esc(stay.name)}</h3>
        <div class="facts">
          <div class="fact"><b>Address</b><span>${esc(stay.address)}</span></div>
          <div class="fact"><b>Phone</b><span>${esc(stay.phone)}</span></div>
          <div class="fact"><b>Booking</b><span>${esc(stay.booking)}</span></div>
          <div class="fact"><b>Check-in</b><span>${esc(stay.checkIn)}</span></div>
          <div class="fact"><b>Check-out</b><span>${esc(stay.checkOut)}</span></div>
          <div class="fact"><b>Door code</b><span>${esc(stay.access)}</span></div>
          <div class="fact"><b>Parking</b><span>${esc(stay.parking)}</span></div>
          <div class="fact"><b>Dog</b><span>${esc(stay.dog)}</span></div>
          <div class="fact"><b>Room</b><span>${esc(stay.amenities)}</span></div>
          <div class="fact"><b>House rules</b><span>${esc(stay.rules)}</span></div>
        </div>
        <div class="actions">
          <a href="${stay.mapUrl}" target="_blank" rel="noreferrer">Open Map</a>
          <a href="${stay.listingUrl}" target="_blank" rel="noreferrer">Property Listing</a>
          <a href="tel:+15412332271">Call Property</a>
        </div>`;

      const actionRow = card.querySelector(':scope > .actions');
      card.insertBefore(panel, actionRow || null);
    }

    const lockedList = document.querySelector('#locked-list');
    if (lockedList) {
      const oldItem = [...lockedList.children].find((li) => li.textContent.includes('Wine Country Inn') || li.textContent.includes('Jacksonville'));
      if (oldItem) oldItem.textContent = 'Aug 4-5: Lamplighter Inn – 109 Seahorse Reef in Bandon';
      else if (!lockedList.textContent.includes('Lamplighter Inn')) {
        const item = document.createElement('li');
        item.textContent = 'Aug 4-5: Lamplighter Inn – 109 Seahorse Reef in Bandon';
        lockedList.appendChild(item);
      }
    }

    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (applyBandonUpdate() || attempts > 40) clearInterval(timer);
  }, 100);
})();
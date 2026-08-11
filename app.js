// Shared logic for province pages – dynamic cities + show approved addas

function initProvincePage(provinceKey, defaultCities) {
  const searchInput = document.getElementById('citySearch');
  const citiesList = document.getElementById('citiesList');
  const addaSection = document.getElementById('addaSection');
  const form = document.getElementById('addaForm');
  const successMsg = document.getElementById('successMsg');
  const cityInput = document.getElementById('cityInput');
  const cityDatalist = document.getElementById('cityDatalist');

  const storageKey = `truckAda_cities_${provinceKey}`;
  const customCities = JSON.parse(localStorage.getItem(storageKey) || '[]');

  let allCities = [...new Set([...defaultCities, ...customCities])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  function renderCities() {
    citiesList.innerHTML = '';
    cityDatalist.innerHTML = '';

    allCities.forEach(city => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'city-btn';
      btn.textContent = city;
      btn.dataset.city = city;
      btn.addEventListener('click', () => selectCity(city, btn));
      citiesList.appendChild(btn);

      const opt = document.createElement('option');
      opt.value = city;
      cityDatalist.appendChild(opt);
    });
  }

  renderCities();

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    document.querySelectorAll('.city-btn').forEach(btn => {
      const match = btn.dataset.city.toLowerCase().includes(q);
      btn.classList.toggle('hidden', !match);
    });
  });

  function getApprovedAddas(city) {
    const all = JSON.parse(localStorage.getItem('truckAdaSubmissions') || '[]');
    return all.filter(s =>
      s.status === 'approved' &&
      s.province === provinceKey &&
      s.city.toLowerCase() === city.toLowerCase()
    );
  }

  function selectCity(city, btn) {
    document.querySelectorAll('.city-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    cityInput.value = city;

    const approved = getApprovedAddas(city);

    if (approved.length === 0) {
      addaSection.innerHTML = `
        <h3>Truck Addas in ${city}</h3>
        <div class="empty-state">
          <p><strong>No truck addas listed yet</strong> for ${city}.</p>
          <p style="margin-top:0.5rem;">Be the first to submit one using the form below. After admin approval it will appear here.</p>
        </div>
      `;
    } else {
      let html = `<h3>Truck Addas in ${city} (${approved.length})</h3>`;
      approved.forEach(a => {
        const ownerLine = a.owner ? `<div style="margin-top:0.3rem;">👤 Owner: <strong>${escapeHtml(a.owner)}</strong></div>` : '';
        const managerLine = a.manager ? `<div style="margin-top:0.2rem;">👔 Manager: <strong>${escapeHtml(a.manager)}</strong></div>` : '';
        html += `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:1rem; margin-top:0.75rem;">
            <div style="font-weight:700; color:var(--primary); font-size:1.05rem;">${escapeHtml(a.name)}</div>
            ${ownerLine}
            ${managerLine}
            <div style="margin-top:0.35rem; color:var(--text-muted);">${escapeHtml(a.address)}</div>
            <div style="margin-top:0.35rem;">📞 <a href="tel:${escapeHtml(a.phone)}" style="color:var(--primary); text-decoration:none; font-weight:600;">${escapeHtml(a.phone)}</a></div>
          </div>
        `;
      });
      addaSection.innerHTML = html;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const cityName = cityInput.value.trim();
    if (!cityName) {
      alert('Please enter a city name.');
      return;
    }

    const normalizedCity = cityName
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const alreadyExists = allCities.some(
      c => c.toLowerCase() === normalizedCity.toLowerCase()
    );

    if (!alreadyExists) {
      customCities.push(normalizedCity);
      localStorage.setItem(storageKey, JSON.stringify(customCities));
      allCities = [...new Set([...defaultCities, ...customCities])].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
      renderCities();
    }

    const data = {
      province: provinceKey,
      city: normalizedCity,
      name: document.getElementById('addaName').value.trim(),
      owner: document.getElementById('ownerName').value.trim(),
      manager: document.getElementById('managerName').value.trim(),
      address: document.getElementById('addaAddress').value.trim(),
      phone: document.getElementById('addaPhone').value.trim(),
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    const subKey = 'truckAdaSubmissions';
    const existing = JSON.parse(localStorage.getItem(subKey) || '[]');
    existing.push(data);
    localStorage.setItem(subKey, JSON.stringify(existing));

    form.reset();
    cityInput.value = '';
    successMsg.classList.add('show');
    successMsg.innerHTML = alreadyExists
      ? `✅ Thank you! Your truck adda in <strong>${normalizedCity}</strong> has been submitted. It will appear after admin approval.`
      : `✅ Thank you! Your truck adda has been submitted.<br><strong>${normalizedCity}</strong> has been automatically added to the city list. Listing will appear after admin approval.`;

    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => successMsg.classList.remove('show'), 10000);
  });
}

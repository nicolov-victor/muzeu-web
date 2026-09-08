/**
 * GRAND MUSÉE VIRTUEL - CONTROLLER & 3D CAROUSEL ENGINE
 * Conectivitate la baza de date 'muzeu' (Exclusiv Vizualizare & Prezentare)
 */

const state = {
  featuredExhibits: [],
  activeCarouselIndex: 0,
  autoplayInterval: null,
  isAutoplayRunning: true,
  currentCategory: 'all',
  searchQuery: '',
  allExhibits: [],
  audioContext: null,
  isAmbientPlaying: false,
  activeTourAudio: null
};

document.addEventListener('DOMContentLoaded', () => {
  checkDatabaseStatus();
  fetchFeaturedCarousel();
  fetchExhibits();
  setupCarouselInteractions();
  setupCategoryFilters();
  setupSearch();
  setupModalEvents();
  setupAmbientAudio();
});

/* ==========================================================
   1. STARE CONEXIUNE BAZA DE DATE 'muzeu'
   ========================================================== */
async function checkDatabaseStatus() {
  const badge = document.getElementById('dbStatusBadge');
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.database && data.database.isSqlServerConnected) {
      badge.className = 'db-status-badge online';
      badge.innerHTML = `
        <span class="status-indicator"></span>
        <span class="status-label">SQL Server: ${data.database.database} (Conectat)</span>
      `;
      badge.title = `Conectat la Microsoft SQL Server [${data.database.server}:${data.database.port} / ${data.database.database}]. 12 colecții active.`;
    } else {
      badge.className = 'db-status-badge offline';
      badge.innerHTML = `
        <span class="status-indicator"></span>
        <span class="status-label">Mod Vizualizare Schemă</span>
      `;
      badge.title = data.database?.error || 'Conexiunea la SQL Server se reîncearcă automat.';
    }
  } catch (err) {
    badge.className = 'db-status-badge offline';
    badge.innerHTML = `<span class="status-indicator"></span><span class="status-label">API Activ</span>`;
  }
}

/* ==========================================================
   2. CARUSEL 3D CINEMATOGRAFIC (COVERFLOW DEPTH)
   ========================================================== */
async function fetchFeaturedCarousel() {
  const track = document.getElementById('carouselTrack');
  try {
    const res = await fetch('/api/exhibits/featured');
    const json = await res.json();
    if (json.success && json.data.length > 0) {
      state.featuredExhibits = json.data;
      renderCarouselCards();
      setupCarouselIndicators();
      updateCarouselPositions();
      startCarouselAutoplay();
    } else {
      track.innerHTML = `<div class="empty-state">Nu s-au putut încărca exponatele pentru carusel.</div>`;
    }
  } catch (err) {
    console.error('Eroare carusel:', err);
    track.innerHTML = `<div class="empty-state">Eroare de comunicare cu serverul.</div>`;
  }
}

function renderCarouselCards() {
  const track = document.getElementById('carouselTrack');
  track.innerHTML = '';

  state.featuredExhibits.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.index = index;
    card.dataset.id = item.Id;
    card.dataset.category = item.CategoryKey;

    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${item.ImageUrl}" alt="${item.Title}" loading="lazy">
        <span class="card-badge-category">dbo.${item.TableName || item.CategoryNameRo}</span>
        <button class="card-audio-pill" title="Ascultă prezentarea audio" data-audio-btn="true">
          <i class="fa-solid fa-volume-high"></i>
        </button>
      </div>
      <div class="card-body">
        <div>
          <h3 class="card-title">${item.Title}</h3>
          <div class="card-creator-row">
            <span class="card-creator"><i class="fa-solid fa-feather-pointed"></i> ${item.Creator}</span>
            <span class="card-year">${item.Period || 'Patrimoniu'}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="card-spec-snippet" title="${item.Material || item.LocationInMuseum}">
            <i class="fa-solid fa-gem"></i> ${item.Material || item.LocationInMuseum || 'Piesă inventariată'}
          </span>
          <button class="card-inspect-link">
            <span>Fișă Tehnică</span> <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-audio-btn="true"]')) {
        e.stopPropagation();
        triggerAudioGuide(item);
        return;
      }
      if (state.activeCarouselIndex === index) {
        openExhibitModal(card.dataset.category, card.dataset.id);
      } else {
        goToSlide(index);
      }
    });

    track.appendChild(card);
  });
}

function updateCarouselPositions() {
  const cards = document.querySelectorAll('.carousel-card');
  const total = cards.length;
  if (total === 0) return;

  const activeIdx = state.activeCarouselIndex;

  cards.forEach((card, i) => {
    let offset = i - activeIdx;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);
    card.classList.toggle('active', offset === 0);

    if (offset === 0) {
      card.style.transform = `translateX(0) translateZ(120px) rotateY(0deg) scale(1.05)`;
      card.style.zIndex = 25;
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
    } else if (absOffset === 1) {
      const sign = offset > 0 ? 1 : -1;
      const tx = sign * 290;
      const rot = -sign * 32;
      card.style.transform = `translateX(${tx}px) translateZ(-60px) rotateY(${rot}deg) scale(0.88)`;
      card.style.zIndex = 15;
      card.style.opacity = '0.75';
      card.style.pointerEvents = 'auto';
    } else if (absOffset === 2) {
      const sign = offset > 0 ? 1 : -1;
      const tx = sign * 500;
      const rot = -sign * 45;
      card.style.transform = `translateX(${tx}px) translateZ(-200px) rotateY(${rot}deg) scale(0.72)`;
      card.style.zIndex = 5;
      card.style.opacity = '0.4';
      card.style.pointerEvents = 'auto';
    } else {
      const sign = offset > 0 ? 1 : -1;
      card.style.transform = `translateX(${sign * 620}px) translateZ(-350px) rotateY(${-sign * 60}deg) scale(0.5)`;
      card.style.zIndex = 1;
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
    }
  });

  updateIndicators();
  const counter = document.getElementById('slideCounter');
  if (counter) {
    counter.textContent = `${activeIdx + 1} / ${total}`;
  }
}

function setupCarouselIndicators() {
  const container = document.getElementById('carouselIndicators');
  if (!container) return;
  container.innerHTML = '';

  state.featuredExhibits.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `indicator-dot ${i === state.activeCarouselIndex ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(i));
    container.appendChild(dot);
  });
}

function updateIndicators() {
  const dots = document.querySelectorAll('.indicator-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === state.activeCarouselIndex);
  });
}

function goToSlide(index) {
  const total = state.featuredExhibits.length;
  if (total === 0) return;
  state.activeCarouselIndex = (index + total) % total;
  updateCarouselPositions();
}

function nextSlide() {
  goToSlide(state.activeCarouselIndex + 1);
}

function prevSlide() {
  goToSlide(state.activeCarouselIndex - 1);
}

function startCarouselAutoplay() {
  stopCarouselAutoplay();
  state.isAutoplayRunning = true;
  state.autoplayInterval = setInterval(() => {
    nextSlide();
  }, 4800);
  updateAutoplayBtnIcon();
}

function stopCarouselAutoplay() {
  if (state.autoplayInterval) {
    clearInterval(state.autoplayInterval);
    state.autoplayInterval = null;
  }
  state.isAutoplayRunning = false;
  updateAutoplayBtnIcon();
}

function updateAutoplayBtnIcon() {
  const btn = document.getElementById('toggleAutoplayBtn');
  if (btn) {
    btn.innerHTML = state.isAutoplayRunning 
      ? '<i class="fa-solid fa-pause"></i>' 
      : '<i class="fa-solid fa-play"></i>';
  }
}

function setupCarouselInteractions() {
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');
  const toggleBtn = document.getElementById('toggleAutoplayBtn');
  const inspectBtn = document.getElementById('inspectActiveSlideBtn');
  const stage = document.querySelector('.carousel-3d-stage');

  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); stopCarouselAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); stopCarouselAutoplay(); });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (state.isAutoplayRunning) {
        stopCarouselAutoplay();
        showToast('Rotirea automată a fost oprită.');
      } else {
        startCarouselAutoplay();
        showToast('Rotirea automată este activă.');
      }
    });
  }

  if (inspectBtn) {
    inspectBtn.addEventListener('click', () => {
      const current = state.featuredExhibits[state.activeCarouselIndex];
      if (current) {
        openExhibitModal(current.CategoryKey, current.Id);
      }
    });
  }

  if (stage) {
    stage.addEventListener('mouseenter', () => {
      if (state.isAutoplayRunning) stopCarouselAutoplay();
    });
    stage.addEventListener('mouseleave', () => {
      startCarouselAutoplay();
    });

    let touchStartX = 0;
    stage.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) prevSlide();
        else nextSlide();
        stopCarouselAutoplay();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (document.getElementById('detailModal').classList.contains('show')) return;
    if (e.key === 'ArrowRight') { nextSlide(); stopCarouselAutoplay(); }
    else if (e.key === 'ArrowLeft') { prevSlide(); stopCarouselAutoplay(); }
  });
}

/* ==========================================================
   3. CATALOG & TABELE SQL (GRID & FILTRE)
   ========================================================== */
async function fetchExhibits() {
  const grid = document.getElementById('exhibitsGrid');
  const emptyState = document.getElementById('emptyState');

  try {
    let url = `/api/exhibits?category=${state.currentCategory}`;
    if (state.searchQuery.trim()) {
      url += `&search=${encodeURIComponent(state.searchQuery.trim())}`;
    }

    const res = await fetch(url);
    const json = await res.json();

    if (json.success) {
      state.allExhibits = json.data;
      renderExhibitsGrid(json.data);
    }
  } catch (err) {
    console.error('Eroare la preluarea exponatelor:', err);
    grid.innerHTML = '<div class="empty-state">Eroare de comunicare cu serverul.</div>';
  }
}

function renderExhibitsGrid(exhibits) {
  const grid = document.getElementById('exhibitsGrid');
  const emptyState = document.getElementById('emptyState');

  if (!exhibits || exhibits.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  grid.innerHTML = exhibits.map(item => {
    return `
      <article class="grid-card" data-category="${item.CategoryKey}" data-id="${item.Id}">
        <div class="grid-card-media">
          <img src="${item.ImageUrl}" alt="${item.Title}" loading="lazy">
          <span class="grid-table-badge">
            <i class="fa-solid fa-table"></i> dbo.${item.TableName || item.CategoryNameRo}
          </span>
          ${item.Classification ? `<span class="grid-featured-star" title="${item.Classification}"><i class="fa-solid fa-crown"></i></span>` : ''}
        </div>
        <div class="grid-card-content">
          <div class="grid-card-header">
            <h3>${item.Title}</h3>
            <div class="grid-card-creator">${item.Creator}</div>
          </div>
          <p class="grid-card-desc">${item.Description}</p>
          <div class="grid-card-specs">
            <strong>Detalii Tehnice (${item.CategoryNameRo}):</strong>
            <span>${item.Material ? 'Material: ' + item.Material : ''} ${item.Technique ? ' &bull; Tehnică: ' + item.Technique : ''}</span>
          </div>
          <div class="grid-card-actions">
            <span class="grid-location">
              <i class="fa-solid fa-tag"></i> Inv: ${item.InventoryNumber || 'Patrimoniu'}
            </span>
            <button class="btn btn-outline" onclick="openExhibitModal('${item.CategoryKey}', ${item.Id})">
              <i class="fa-solid fa-file-lines"></i> Fișă Tehnică
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function setupCategoryFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentCategory = tab.dataset.category;
      fetchExhibits();
    });
  });

  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.querySelector('.filter-tab[data-category="all"]').click();
      const searchInput = document.getElementById('exhibitSearchInput');
      if (searchInput) searchInput.value = '';
      state.searchQuery = '';
      fetchExhibits();
    });
  }
}

function setupSearch() {
  const input = document.getElementById('exhibitSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  let debounceTimeout = null;

  if (input) {
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      clearBtn.style.display = val.length > 0 ? 'block' : 'none';

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        state.searchQuery = val;
        fetchExhibits();
      }, 300);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      state.searchQuery = '';
      fetchExhibits();
    });
  }
}

/* ==========================================================
   4. MODAL SPOTLIGHT: FIȘĂ COMPLETĂ DIN TABELUL REAL SQL
   ========================================================== */
window.openExhibitModal = async function(categoryKey, id) {
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('detailModalBody');

  body.innerHTML = `
    <div style="padding: 4rem; text-align: center;">
      <div class="spinner" style="margin: 0 auto 1.5rem;"></div>
      <div style="color: var(--gold-light);">Se extrag datele din tabelul dbo.${categoryKey}...</div>
    </div>
  `;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(`/api/exhibits/${categoryKey}/${id}`);
    const json = await res.json();

    if (!json.success || !json.data) {
      body.innerHTML = `<div class="empty-state">Exponatul nu a putut fi încărcat din baza de date.</div>`;
      return;
    }

    const item = json.data;
    const meta = item._meta || { table: categoryKey, labelRo: categoryKey };

    // Extragere atribute specifice din rândul SQL
    const specs = [];
    if (item.NR_INV) specs.push({ label: 'Număr Inventar', val: item.NR_INV });
    if (item.AUTOR || item.ATELIER || item.STAT_EMIT) specs.push({ label: 'Autor / Atelier / Emitent', val: item.AUTOR || item.ATELIER || item.STAT_EMIT });
    if (item.DATAT || item.AN_I || item.SECOL_I) specs.push({ label: 'Datare / An', val: item.DATAT || (item.AN_I ? item.AN_I : `Sec. ${item.SECOL_I}`) });
    if (item.MATERIAL) specs.push({ label: 'Material', val: item.MATERIAL });
    if (item.TEHNICA) specs.push({ label: 'Tehnică', val: item.TEHNICA });
    if (item.LUNGIME || item.LATIME || item.INALTIME) specs.push({ label: 'Dimensiuni', val: `${item.LUNGIME || ''} x ${item.LATIME || ''} ${item.INALTIME ? 'x ' + item.INALTIME : ''}` });
    if (item.LOC_PASTR) specs.push({ label: 'Loc Păstrare / Sală', val: item.LOC_PASTR });
    if (item.TEZAUR || item.CLASAT || item.FOND) specs.push({ label: 'Statut Patrimoniu', val: item.TEZAUR || item.CLASAT || item.FOND });

    // Câmpuri specifice pentru Cărți, Monede, Ceramica etc.
    if (item.EDITURA) specs.push({ label: 'Editură / Tipografie', val: item.EDITURA });
    if (item.LOC_APAR) specs.push({ label: 'Loc Apariție', val: item.LOC_APAR });
    if (item.NR_PAG) specs.push({ label: 'Pagini / File', val: item.NR_PAG });
    if (item.DIAMETRU) specs.push({ label: 'Diametru', val: item.DIAMETRU });
    if (item.GREUTATE) specs.push({ label: 'Greutate', val: item.GREUTATE });
    if (item.AVERS) specs.push({ label: 'Descriere Avers', val: item.AVERS });
    if (item.REVERS) specs.push({ label: 'Descriere Revers', val: item.REVERS });
    if (item.SCOALA) specs.push({ label: 'Școală Pictură', val: item.SCOALA });
    if (item.CALIBRU) specs.push({ label: 'Calibru Armă', val: item.CALIBRU });

    const specsHtml = specs.map(s => `
      <div class="sql-spec-item">
        <span class="sql-spec-label">${s.label}</span>
        <span class="sql-spec-val">${s.val}</span>
      </div>
    `).join('');

    const titleText = item.TITLU || item.DENUMIRE || `${meta.labelRo} - Piesă de Patrimoniu`;
    const creatorText = item.AUTOR || item.ATELIER || item.STAT_EMIT || 'Autor Anonim';

    body.innerHTML = `
      <div class="modal-split-layout">
        <div class="modal-media-col">
          <img src="${item.ImageUrl}" alt="${titleText}" id="modalZoomImg" title="Apasă pentru mărire / zoom">
          <span class="zoom-hint"><i class="fa-solid fa-magnifying-glass"></i> Click pe imagine pentru zoom</span>
        </div>
        <div class="modal-info-col">
          <div>
            <span class="modal-sql-badge">
              <i class="fa-solid fa-database"></i> Tabel SQL: dbo.${meta.table} &bull; ID: ${id}
            </span>
            <h2 class="modal-title">${titleText}</h2>
            <div class="modal-creator-tag">
              <i class="fa-solid fa-feather-pointed"></i> ${creatorText}
            </div>
          </div>

          <p class="modal-desc">${item.DESCRIERE || 'Piesă catalogată în colecția muzeală.'}</p>

          <div>
            <div style="font-size: 0.72rem; color: var(--gold-primary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 0.5rem;">
              <i class="fa-solid fa-table-columns"></i> Câmpuri Relaționale din Tabelul [dbo.${meta.table}]
            </div>
            <div class="modal-sql-specs-grid">
              ${specsHtml}
            </div>
          </div>

          <div class="modal-audio-action">
            <button class="btn btn-gold" id="modalPlayAudioBtn">
              <i class="fa-solid fa-headphones"></i> Pornire Ghid Audio
            </button>
            <span style="font-size: 0.8rem; color: var(--text-muted);">
              <i class="fa-solid fa-map-pin"></i> ${item.LOC_PASTR || 'Secția Principală'}
            </span>
          </div>
        </div>
      </div>
    `;

    const zoomImg = document.getElementById('modalZoomImg');
    if (zoomImg) {
      zoomImg.addEventListener('click', () => {
        zoomImg.classList.toggle('zoomed');
      });
    }

    const playAudioBtn = document.getElementById('modalPlayAudioBtn');
    if (playAudioBtn) {
      playAudioBtn.addEventListener('click', () => {
        triggerAudioGuide({ Title: titleText, Description: item.DESCRIERE, Creator: creatorText });
      });
    }

  } catch (err) {
    console.error('Eroare modal:', err);
    body.innerHTML = `<div class="empty-state">Eroare la extragerea datelor din SQL Server.</div>`;
  }
};

function setupModalEvents() {
  const detailModal = document.getElementById('detailModal');
  const closeDetailBtn = document.getElementById('closeDetailModalBtn');

  const closeModal = (m) => {
    m.classList.remove('show');
    document.body.style.overflow = '';
  };

  if (closeDetailBtn) closeDetailBtn.addEventListener('click', () => closeModal(detailModal));

  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeModal(detailModal);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailModal) closeModal(detailModal);
  });
}

/* ==========================================================
   5. GHID AUDIO & AMBIENȚĂ MUZEALĂ
   ========================================================= */
function setupAmbientAudio() {
  const btn = document.getElementById('ambientAudioBtn');
  if (btn) btn.addEventListener('click', () => toggleAmbientAudio());

  const tourPlayPauseBtn = document.getElementById('tourPlayPauseBtn');
  const tourCloseBtn = document.getElementById('tourCloseBtn');

  if (tourPlayPauseBtn) tourPlayPauseBtn.addEventListener('click', () => toggleTourAudioPlayback());
  if (tourCloseBtn) tourCloseBtn.addEventListener('click', () => closeAudioTourBar());
}

function toggleAmbientAudio() {
  const icon = document.getElementById('audioIcon');

  if (!state.audioContext) {
    try {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }

  if (state.audioContext && state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }

  if (state.isAmbientPlaying) {
    stopAmbientSynth();
    state.isAmbientPlaying = false;
    icon.className = 'fa-solid fa-volume-xmark';
    showToast('Muzica de galerie a fost oprită.');
  } else {
    startAmbientSynth();
    state.isAmbientPlaying = true;
    icon.className = 'fa-solid fa-volume-high';
    showToast('Muzică ambientală activată.');
  }
}

let ambientOscillators = [];
let ambientGain = null;

function startAmbientSynth() {
  if (!state.audioContext) return;
  stopAmbientSynth();

  ambientGain = state.audioContext.createGain();
  ambientGain.gain.setValueAtTime(0.04, state.audioContext.currentTime);
  ambientGain.connect(state.audioContext.destination);

  const frequencies = [146.83, 220.00, 261.63, 329.63, 440.00];
  ambientOscillators = frequencies.map(freq => {
    const osc = state.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, state.audioContext.currentTime);
    osc.connect(ambientGain);
    osc.start();
    return osc;
  });
}

function stopAmbientSynth() {
  if (ambientOscillators.length > 0) {
    ambientOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    ambientOscillators = [];
  }
  if (ambientGain) {
    try { ambientGain.disconnect(); } catch (e) {}
    ambientGain = null;
  }
}

function triggerAudioGuide(exhibit) {
  const bar = document.getElementById('audioTourBar');
  const title = document.getElementById('tourExhibitTitle');
  const playBtn = document.getElementById('tourPlayPauseBtn');

  title.textContent = exhibit.Title;
  bar.style.display = 'flex';

  state.activeTourAudio = { exhibit, isPlaying: true };
  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  showToast(`Ghid audio pornit pentru "${exhibit.Title}".`);

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const textToRead = `${exhibit.Title}. Piesă de patrimoniu realizată de ${exhibit.Creator || 'un maestru necunoscut'}. ${exhibit.Description || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ro-RO';
    utterance.rate = 0.92;
    utterance.onend = () => {
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      if (state.activeTourAudio) state.activeTourAudio.isPlaying = false;
    };
    window.speechSynthesis.speak(utterance);
  }
}

function toggleTourAudioPlayback() {
  const playBtn = document.getElementById('tourPlayPauseBtn');
  if ('speechSynthesis' in window) {
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      } else {
        window.speechSynthesis.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    }
  }
}

function closeAudioTourBar() {
  const bar = document.getElementById('audioTourBar');
  bar.style.display = 'none';
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  state.activeTourAudio = null;
}

function showToast(message, isError = false) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `
    <i class="${isError ? 'fa-solid fa-circle-exclamation text-rose' : 'fa-solid fa-circle-check text-gold'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}


  const API = 'https://api.freeapi.app/api/v1/public/randomjokes?limit=100&page=1';

  let allJokes = [];
  let favorites = JSON.parse(localStorage.getItem('ha_favs') || '[]');
  let currentPage = 1;
  console.log(allJokes);
console.log(allJokes[0]);
  const container  = document.getElementById('jokes-container');
  const pagination = document.getElementById('pagination');
  const badge      = document.getElementById('count-badge');
  const typeFilter = document.getElementById('type-filter');
  const perPageSel = document.getElementById('per-page');
  const refreshBtn = document.getElementById('refresh-btn');
  const dateline   = document.getElementById('dateline');
  const favPanel   = document.getElementById('fav-panel');
  const favContainer = document.getElementById('fav-container');
  const toast      = document.getElementById('toast');

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function filtered() {
    const t = typeFilter.value;
    if (t === 'single')  return allJokes.filter(j => j.type === 'single');
    if (t === 'twopart') return allJokes.filter(j => j.type === 'twopart');
    return allJokes;
  }

  function render() {
    const jokes = filtered();
    const perPage = parseInt(perPageSel.value);
    const total   = Math.ceil(jokes.length / perPage);
    if (currentPage > total) currentPage = 1;
    const start = (currentPage - 1) * perPage;
    const page  = jokes.slice(start, start + perPage);

    badge.innerHTML = `<strong>${jokes.length}</strong> jokes`;

    if (!page.length) {
      container.innerHTML = '<div class="loading"><div class="loading-text">No jokes found</div></div>';
      pagination.innerHTML = '';
      return;
    }

    container.innerHTML = `<div class="jokes-grid">${page.map(renderCard).join('')}</div>`;
    renderPagination(total);
    attachCardListeners();
    renderFavs();
  }

  function renderCard(joke) {

  const isFav = favorites.includes(joke.id);
  const heart = isFav ? '❤️' : '🤍';

  return `
    <div class="joke-card" data-id="${joke.id}">

      <span class="joke-type single">
        Joke · ${joke.categories?.join(', ') || 'General'}
      </span>

      <p class="joke-setup">
        ${escHtml(joke.content)}
      </p>

      <div class="joke-footer">

        <span class="joke-id">
          #${joke.id}
        </span>

        <button
          class="like-btn ${isFav ? 'liked' : ''}"
          data-id="${joke.id}"
          title="Favourite"
        >
          ${heart}
        </button>

      </div>
    </div>
  `;
}

  function attachCardListeners() {
    document.querySelectorAll('.reveal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const delivery = btn.dataset.delivery;
        const punchline = document.createElement('p');
        punchline.className = 'joke-punchline';
        punchline.textContent = delivery;
        btn.replaceWith(punchline);
      });
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        if (favorites.includes(id)) {
          favorites = favorites.filter(f => f !== id);
          btn.textContent = '🤍';
          btn.classList.remove('liked');
          showToast('Removed from favourites');
        } else {
          favorites.push(id);
          btn.textContent = '❤️';
          btn.classList.add('liked');
          showToast('Added to favourites!');
        }
        localStorage.setItem('ha_favs', JSON.stringify(favorites));
        renderFavs();
      });
    });
  }

  function renderPagination(total) {
    if (total <= 1) { pagination.innerHTML = ''; return; }
    let html = `<button class="btn secondary" id="prev-btn" ${currentPage === 1 ? 'disabled style="opacity:.4;cursor:default"' : ''}>← Prev</button>`;
    html += `<span class="page-info">Page ${currentPage} of ${total}</span>`;
    html += `<button class="btn secondary" id="next-btn" ${currentPage === total ? 'disabled style="opacity:.4;cursor:default"' : ''}>Next →</button>`;
    pagination.innerHTML = html;

    document.getElementById('prev-btn')?.addEventListener('click', () => { currentPage--; render(); window.scrollTo({top:0,behavior:'smooth'}); });
    document.getElementById('next-btn')?.addEventListener('click', () => { currentPage++; render(); window.scrollTo({top:0,behavior:'smooth'}); });
  }

  function renderFavs() {
    if (!favorites.length) {
      favPanel.style.display = 'none';
      return;
    }
    favPanel.style.display = 'block';
    const favJokes = allJokes.filter(j => favorites.includes(j.id));
    if (!favJokes.length) { favPanel.style.display = 'none'; return; }
    favContainer.innerHTML = `<div class="jokes-grid">${favJokes.map(renderCard).join('')}</div>`;
    favContainer.querySelectorAll('.reveal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = document.createElement('p');
        p.className = 'joke-punchline';
        p.textContent = btn.dataset.delivery;
        btn.replaceWith(p);
      });
    });
    favContainer.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        favorites = favorites.filter(f => f !== id);
        localStorage.setItem('ha_favs', JSON.stringify(favorites));
        renderFavs();
        render();
        showToast('Removed from favourites');
      });
    });
  }

  async function fetchJokes() {
    container.innerHTML = `<div class="loading"><div class="loading-text">Fetching the Funnies…</div><div class="loading-sub">Please stand by for comedy</div></div>`;
    pagination.innerHTML = '';
    try {
      const res  = await fetch(API);
      const json = await res.json();
      console.log(res)
      allJokes   = json.data?.data || [];
      if (!allJokes.length) throw new Error('No jokes returned');
      const now = new Date();
      dateline.textContent = `Vol. ${allJokes.length} · ${now.toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · All the news that's fit to laugh at`;
      currentPage = 1;
      render();
    } catch (e) {
      container.innerHTML = `<div class="error-box"><p>⚠ Could not load jokes — ${e.message}</p><button class="btn" onclick="fetchJokes()">Try Again</button></div>`;
    }
  }

  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escAttr(s) { return String(s).replace(/"/g,'&quot;'); }

  typeFilter.addEventListener('change', () => { currentPage = 1; render(); });
  perPageSel.addEventListener('change', () => { currentPage = 1; render(); });
  refreshBtn.addEventListener('click', fetchJokes);

  //fetchJokes();

  document.addEventListener('DOMContentLoaded', () => {
  fetchJokes();
});

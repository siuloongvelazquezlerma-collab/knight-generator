
// Prevenir gestos táctiles no deseados
document.addEventListener('touchmove', function (event) {
  if (event.touches.length > 1) {
      event.preventDefault();
  }
}, { passive: false });

window.addEventListener('load', function () {
const overlay = document.querySelector('.overlay-loader-page');
const loader = document.getElementById('loader');

// Se mantiene el loader visible por 1 segundo
setTimeout(() => {
loader.style.opacity = '0'; // Corrige esto: '2' no tiene efecto visual
setTimeout(() => {
loader.style.display = 'none';
overlay.classList.add('hidden');
}, 300);
}, 1000);
});

// 🛡️ Respaldo por si 'load' nunca se dispara
setTimeout(() => {
const overlay = document.querySelector('.overlay-loader-page');
const loader = document.getElementById('loader');

if (loader && overlay && !overlay.classList.contains('hidden')) {
loader.style.display = 'none';
overlay.classList.add('hidden');
console.warn("Loader forzado a ocultarse después de 8 segundos.");
}
}, 8000);


const video = videojs('video'); // Video.js instance
const videoElement = video.el().getElementsByTagName('video')[0];
const controls = document.getElementById('controls');
const overlay = document.getElementById('overlay');
const player = document.getElementById('player');
const progress = document.getElementById('progress');
const duration = document.getElementById('duration');
const playPauseBtn = document.getElementById('playPauseBtn').querySelector('.material-icons');
const cover = document.getElementById('cover');
let hideControlsTimeout;

video.on('progress', updateBuffer);
video.on('loadedmetadata', updateBuffer);
video.on('timeupdate', updateBuffer);


// ✅ 👇 Aquí mismo agrega este
video.on('timeupdate', () => {
const currentTime = video.currentTime();
const videoUrl = video.currentSrc();

if (!videoUrl || !window.seriesId) return;

const key = `progress-${seriesId}`;
const episodios = JSON.parse(localStorage.getItem(key) || '{}');
episodios[videoUrl] = {
  progress: currentTime,
  updated_at: Date.now()
};  
localStorage.setItem(key, JSON.stringify(episodios));

const resumeItem = JSON.parse(localStorage.getItem(`continue_${seriesId}`) || '{}');
if (resumeItem?.videoUrl === videoUrl) {
  resumeItem.progress = currentTime;
  localStorage.setItem(`continue_${seriesId}`, JSON.stringify(resumeItem));
}

throttledSyncData(seriesId);
});



function togglePlay() {
if (video.paused()) {
video.play();
playPauseBtn.textContent = 'pause';
overlay.classList.remove('visible');
} else {
video.pause();
playPauseBtn.textContent = 'play_arrow';
overlay.classList.add('visible');
}
}


function skip(seconds) {
video.currentTime(video.currentTime() + seconds);
}


function goBack() {
if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
exitFullscreen(); // sale del modo pantalla completa si está activado
}

player.style.display = 'none';
cover.style.display = 'flex';
video.pause();
playPauseBtn.textContent = 'play_arrow';
}

function restartVideo() {
video.currentTime(0);
video.play();
playPauseBtn.textContent = 'pause';
}



function updateProgress() {
if (video.duration()) {
  const remaining = video.duration() - video.currentTime();
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60).toString().padStart(2, '0');
  duration.textContent = `- ${mins}:${secs}`;

  const percent = (video.currentTime() / video.duration()) * 100;

  // mover el thumb y actualizar el fondo
  progress.value = percent;
  progress.style.background = `linear-gradient(to right, white ${percent}%, #666 ${percent}%)`;
}
}

// 🔵 Actualiza la barra de buffer
function updateBuffer() {
const buffered = video.buffered();
const duration = video.duration();
const bufferBar = document.getElementById('bufferBar');

if (!buffered || !buffered.length || !duration) return;

// obtiene el último rango cargado
const bufferedEnd = buffered.end(buffered.length - 1);
const percent = Math.min((bufferedEnd / duration) * 100, 100);

bufferBar.style.width = `${percent}%`;
}

function smoothProgressUpdate() {
if (!video.paused() && !video.ended() && video.duration()) {
  updateProgress();
  updateBuffer();
  requestAnimationFrame(smoothProgressUpdate);
}
}


// cuando el usuario arrastra el thumb
progress.addEventListener('input', () => {
const newTime = (progress.value / 100) * video.duration();
video.currentTime(newTime);

// esto hace que el thumb se mueva mientras arrastras
updateProgress();
});




const overlayTop = document.getElementById('overlayTop');
const overlayBottom = document.getElementById('overlayBottom');

let controlsVisible = false;


function showControls() {
controls.classList.add('visible');
overlay.classList.add('visible');
overlayTop.classList.add('visible');
overlayBottom.classList.add('visible');
controlsVisible = true;

clearTimeout(hideControlsTimeout);
hideControlsTimeout = setTimeout(() => {
  hideControls();
}, 5000);
}

function hideControls() {
controls.classList.remove('visible');
overlay.classList.remove('visible');
overlayTop.classList.remove('visible');
overlayBottom.classList.remove('visible');
controlsVisible = false;
}





function showPlayer() {
cover.style.display = 'none';
player.style.display = 'flex';
video.play();
playPauseBtn.textContent = 'pause';
showControls();
enterFullscreen();
}

video.on('timeupdate', updateProgress);
video.on('loadedmetadata', updateProgress);
player.addEventListener('mousemove', showControls);
player.addEventListener('click', showControls);
player.addEventListener('touchstart', showControls);

function enterFullscreen() {
if (player.requestFullscreen) {
player.requestFullscreen();
} else if (player.webkitRequestFullscreen) {
player.webkitRequestFullscreen();
} else if (player.msRequestFullscreen) {
player.msRequestFullscreen();
}
}

function exitFullscreen() {
if (document.exitFullscreen) {
document.exitFullscreen();
} else if (document.webkitExitFullscreen) {
document.webkitExitFullscreen();
} else if (document.msExitFullscreen) {
document.msExitFullscreen();
}
}

document.addEventListener('fullscreenchange', () => {
const isFullscreen = document.fullscreenElement;
if (!isFullscreen) {
if (!video.paused()) {
video.pause();
}

playPauseBtn.textContent = 'play_arrow';
player.style.display = 'none';
cover.style.display = 'flex';

// 💡 GUARDAR PROGRESO ACTUAL
const videoUrl = video.currentSrc();
const currentTime = video.currentTime();

saveProgress(videoUrl, currentTime); // Esto ya actualiza localStorage y llama a updateResumeButton()

// 💥 OPCIONAL: Si también tenés miniaturas con barras de progreso
if (typeof updateThumbnailsProgress === 'function') {
updateThumbnailsProgress(); // Esta sería una función que recorres tus thumbnails y actualizás barras
}
}
});


function updateMediaSession(episode) {
  if (!('mediaSession' in navigator)) return;

  // 📺 Nombre de la serie (FUENTE ÚNICA)
  const seriesName =
    document.querySelector('#favoritoData #nombre')?.textContent?.trim()
    || 'Serie';

  navigator.mediaSession.metadata = new MediaMetadata({
    // 🎬 Episodio
    title: episode.title || episode.episodeCode || 'Episodio',

    // 📺 SERIE (esto es lo que querías)
    artist: seriesName,

    // 📦 Temporada
    album: episode.seasonName || 'Temporada',

    artwork: [
      { src: episode.thumbnail, sizes: '96x96', type: 'image/jpeg' },
      { src: episode.thumbnail, sizes: '128x128', type: 'image/jpeg' },
      { src: episode.thumbnail, sizes: '192x192', type: 'image/jpeg' },
      { src: episode.thumbnail, sizes: '256x256', type: 'image/jpeg' },
      { src: episode.thumbnail, sizes: '384x384', type: 'image/jpeg' },
      { src: episode.thumbnail, sizes: '512x512', type: 'image/jpeg' }
    ]
  });
}







// --- PESTAÑAS ---
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  event.target.classList.add('active');
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  seriesId = params.get('id');
  if (!seriesId) return;

  await loadMostRecentProgress(seriesId);


  populateSeasons();

  renderEpisodes();

  // ▶️ Cargar episodio pendiente
  const resumeData = JSON.parse(localStorage.getItem(`continue_${seriesId}`));
  if (resumeData && resumeData.videoUrl) {
    playEpisode(resumeData.videoUrl);
  }

  // Cuando el usuario cambie de temporada, actualizamos los episodios
  document.getElementById("seasonSelect").addEventListener('change', () => {
    // Guardar la selección
    localStorage.setItem(`selected-season-${seriesId}`, document.getElementById("seasonSelect").value);
    renderEpisodes();
  });
}

// Llamar init cuando cargue la página
window.addEventListener('DOMContentLoaded', init);

// 🧩 --- Reanudar progreso desde Supabase ---
async function resumeSeriesProgress() {
const { data: { user } } = await supabase.auth.getUser();
if (!user) return;

const { data, error } = await supabase
  .from('progresos')
  .select('tiempo, duration, video_url')
  .eq('id', user.id)
  .eq('series_id', seriesId)
  .order('updated_at', { ascending: false })
  .limit(1)
  .single();

if (data && !error && data.tiempo && data.video_url) {
  video.src({ src: data.video_url });
  video.currentTime(data.tiempo);
  console.log(`🎬 Reanudando serie desde ${data.tiempo.toFixed(1)}s`);
}
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', resumeSeriesProgress);

// --- TEMPORADAS ---
function populateSeasons() {
  const seasonSelect = document.getElementById("seasonSelect");
  seasonSelect.innerHTML = "";

  const savedIndex = parseInt(localStorage.getItem(`selected-season-${seriesId}`)) || 0;

  playlist.forEach((seasonObj, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = seasonObj.season;
    if (index === savedIndex) {
      option.selected = true;
    }
    seasonSelect.appendChild(option);
  });
}





async function renderEpisodes() {
  const seasonIndex = document.getElementById("seasonSelect").value;
  const episodesContainer = document.getElementById("episodeList");
  const season = playlist[seasonIndex];

  episodesContainer.innerHTML = "";

  const progressKey = `progress-${seriesId}`;
  const progressData = JSON.parse(localStorage.getItem(progressKey)) || {};

  const episodeHTMLs = season.episodes.map(ep => {
    const progress = progressData[ep.videoUrl];
    const isComplete = progress === -1;

    // ✅ Extrae duración desde ep.meta dentro del map
    const durationMinutes = parseFloat(ep.meta?.match(/(\d+)m/)?.[1]) || 47;
    const durationSeconds = durationMinutes * 60;
    const safeProgress = isComplete ? durationSeconds : (progress || 0);
    const percent = Math.min((safeProgress / durationSeconds) * 100, 100);

    const showProgress = progress !== undefined;

    // 🆕 NUEVO: Mostrar etiqueta si el episodio tiene "isNew": true
    const newBadge = ep.isNew
      ? `<div class="new-badge">NUEVO</div>`
      : '';

    return `
  <div class="episode" data-url="${ep.videoUrl}" onclick="playEpisode('${ep.videoUrl}')" tabindex="0">
    <div class="thumbnail-container">
      <img src="${ep.thumbnail}" alt="${ep.title}"
           oncontextmenu="return false"
           ondragstart="return false"
           onmousedown="return false"
           ontouchstart="event.preventDefault()">
      ${newBadge}
      ${showProgress ? `
        <div class="progress-track">
          <div class="progress-bar" style="width: ${percent}%;"></div>
        </div>
      ` : ''}
    </div>
    <div class="episode-details">
      <div class="episode-title">${ep.title}</div>
      <div class="episode-meta">${ep.meta}</div>
    </div>
    <div class="episode-actions">
      <div class="material-icons download-icon" onclick="event.stopPropagation(); window.open('${ep.downloadUrl}', '_blank')" tabindex="0">arrow_downward</div>
      <div class="download-line"></div>
    </div>
  </div>
`;
  });

  episodesContainer.innerHTML = episodeHTMLs.join('');
  updateResumeButton();
}



// --- MENÚ DESLIZANTE DE TEMPORADAS ---
function fillSeasonMenu() {
  const seasonOptionsContainer = document.getElementById("seasonOptions");
  seasonOptionsContainer.innerHTML = "";
  const currentSeason = parseInt(document.getElementById("seasonSelect").value);
  playlist.forEach((season, index) => {
    const option = document.createElement("div");
    option.classList.add("season-option");
    if (index === currentSeason) option.classList.add("selected");
    option.textContent = season.season;
    option.onclick = () => {
  document.getElementById("seasonSelect").value = index;
  localStorage.setItem(`selected-season-${seriesId}`, index); // ✅ Guardar selección
  renderEpisodes();
  closeSeasonMenu();
};
    seasonOptionsContainer.appendChild(option);
  });
}



// --- BLOQUEAR/DESBLOQUEAR SCROLL ---
let scrollPosition = 0;

function disableBodyScroll() {
scrollPosition = window.scrollY; // guarda la posición actual
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollPosition}px`;
document.body.style.width = '100%';
}

function enableBodyScroll() {
document.body.style.position = '';
document.body.style.top = '';
document.body.style.width = '';
window.scrollTo(0, scrollPosition); // vuelve a la posición original
}



// --- ABRIR Y CERRAR MENÚ CON CONTROL DE SCROLL ---
function openSeasonMenu() {
  document.getElementById("menuOverlay").classList.remove("hidden");
  document.getElementById("seasonMenu").classList.remove("hidden");
  requestAnimationFrame(() => {
    document.getElementById("seasonMenu").classList.add("show");
  });
  disableBodyScroll();
}

function closeSeasonMenu() {
  document.getElementById("menuOverlay").classList.add("hidden");
  const menu = document.getElementById("seasonMenu");
  menu.classList.remove("show");
  setTimeout(() => {
    menu.classList.add("hidden");
    enableBodyScroll();
  }, 300);
}

const seasonOverlay  = document.getElementById("menuOverlay");
const seasonMenu     = document.getElementById("seasonMenu");
const dragIndicator  = document.querySelector(".menu-drag-indicator");

// --- CERRAR AL HACER CLICK EN OVERLAY ---
seasonOverlay.addEventListener("click", closeSeasonMenu);

// --- GESTO DE ARRASTRE SOLO DESDE EL INDICADOR ---
let startY = 0;
let isDragging = false;

function onStart(e) {
  isDragging = true;
  startY = e.touches ? e.touches[0].clientY : e.clientY;

  // Escuchar en todo el documento mientras dure el drag
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);
  document.addEventListener("touchmove", onMove);
  document.addEventListener("touchend", onEnd);
}

function onMove(e) {
  if (!isDragging) return;
  const currentY = e.touches ? e.touches[0].clientY : e.clientY;
  const deltaY = currentY - startY;

  // Solo cerrar si arrastra bastante hacia abajo
  if (deltaY > 30) {
    closeSeasonMenu();
    onEnd(); // limpiar listeners
  }
}

function onEnd() {
  isDragging = false;
  document.removeEventListener("mousemove", onMove);
  document.removeEventListener("mouseup", onEnd);
  document.removeEventListener("touchmove", onMove);
  document.removeEventListener("touchend", onEnd);
}

// Eventos SOLO en el drag-indicator
dragIndicator.addEventListener("mousedown", onStart);
dragIndicator.addEventListener("touchstart", onStart);



// --- DESACTIVAR MENÚ NATIVO Y USAR MENÚ PERSONALIZADO ---
document.getElementById("seasonSelect").addEventListener("mousedown", e => e.preventDefault());
document.getElementById("seasonSelect").addEventListener("click", () => {
  fillSeasonMenu();
  openSeasonMenu();
});

// Inicializar
populateSeasons();
renderEpisodes();

async function loadMostRecentProgress(seriesId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return {};

    const { data, error } = await supabase
      .from('progresos')
      .select('ultimo_visto, episodios')
      .eq('id', session.user.id)
      .eq('series_id', seriesId)
      .single();

    if (error) {
      console.error('❌ Error cargando progresos desde Supabase:', error);
      return {};
    }

    return data || {};
  } catch (err) {
    console.error('❌ Error obteniendo sesión o progresos:', err);
    return {};
  }
}


// Guardar y cargar progreso
async function saveProgress(videoUrl, currentTime) {
  const key = `progress-${seriesId}`;
  const data = JSON.parse(localStorage.getItem(key)) || {};
  data[videoUrl] = currentTime;
  localStorage.setItem(key, JSON.stringify(data));

  const duration = video.duration() || 1;
  const progressKey = `progress_${seriesId}_${videoUrl}`;
  const durationKey = `duration_${seriesId}_${videoUrl}`;
  const episodeData = findEpisodeData(videoUrl);
  if (!episodeData) return;

  const { episodeCode, thumbnail } = episodeData;
  const seriesTitle = document.getElementById('page-title')?.textContent || 'Serie';
  const seriesLink = document.getElementById('favoritoEnlace')?.href || window.location.href;

  localStorage.setItem(progressKey, currentTime || 0);
  localStorage.setItem(durationKey, duration);

  const indexes = findEpisodeIndexes(videoUrl);

  localStorage.setItem(`continue_${seriesId}`, JSON.stringify({
    seriesId,
    seriesTitle,
    episodeTitle: episodeCode,
    poster: thumbnail,
    link: seriesLink,
    progress: currentTime || 0,
    duration,
    videoUrl,
    season_index: indexes?.seasonIndex ?? 0,
    episode_index: indexes?.episodeIndex ?? 0
  }));

  // 🔹 Obtener sesión solo una vez
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  // 📌 Registrar vista en user_views
  try {
    if (duration > 0 && currentTime / duration >= 0.8) {
      await onPlayEpisode(session.user.id, seriesId, episodeCode, Math.floor(currentTime));
      console.log('✅ Vista registrada en user_views para episodio:', episodeCode);
    }
  } catch (err) {
    console.error('❌ Error registrando vista en user_views:', err);
  }

  // ✅ Sincronizar con tabla progresos
  try {
    await supabase
      .from('progresos')
      .upsert({
        id: session.user.id,
        series_id: seriesId,
        ultimo_visto: {
          seriesId,
          videoUrl,
          progress: currentTime || 0,
          duration,
          episodeTitle: episodeCode,
          poster: thumbnail,
          link: seriesLink,
          season_index: indexes?.seasonIndex ?? 0,
          episode_index: indexes?.episodeIndex ?? 0
        }
      }, { onConflict: ['id', 'series_id'] });
    console.log('✅ Progreso actualizado en Supabase (upsert)');

    // Actualizar episodios
    await supabase
      .from('progresos')
      .update({
        episodios: {
          [videoUrl]: {
            progress: currentTime || 0,
            duration,
            episodeTitle: episodeCode,
            poster: thumbnail,
            season_index: indexes?.seasonIndex ?? 0,
            episode_index: indexes?.episodeIndex ?? 0,
            updatedAt: new Date().toISOString()
          }
        }
      })
      .eq('id', session.user.id)
      .eq('series_id', seriesId);
  } catch (error) {
    console.error('❌ Error sincronizando con Supabase:', error);
  }

  localStorage.setItem('justReturnedFromSeries', 'true');
  updateResumeButton();
}





// Helper para buscar datos del episodio
function findEpisodeData(videoUrl) {
  for (let season of playlist) {
    const episode = season.episodes.find(ep => ep.videoUrl === videoUrl);
    if (episode) {
      return { episodeCode: episode.episodeCode, thumbnail: episode.thumbnail };
    }
  }
  return null;
}


// Helper para encontrar los índices de temporada y episodio
function findEpisodeIndexes(videoUrl) {
  for (let seasonIndex = 0; seasonIndex < playlist.length; seasonIndex++) {
    const season = playlist[seasonIndex];
    for (let episodeIndex = 0; episodeIndex < season.episodes.length; episodeIndex++) {
      if (season.episodes[episodeIndex].videoUrl === videoUrl) {
        return { seasonIndex, episodeIndex };
      }
    }
  }
  return null;
}



function loadProgress(videoUrl) {
  const key = `progress-${seriesId}`;
  const data = JSON.parse(localStorage.getItem(key)) || {};
  const value = data[videoUrl];
  if (value === -1) return 0; // Si está marcado como terminado, empieza de nuevo
  return value || 0;
}


// Buscar siguiente episodio
function findNextEpisode(currentUrl) {
  for (let seasonIndex = 0; seasonIndex < playlist.length; seasonIndex++) {
    const season = playlist[seasonIndex];
    for (let i = 0; i < season.episodes.length; i++) {
      if (season.episodes[i].videoUrl === currentUrl) {
        // Si hay un siguiente episodio en la misma temporada
        if (season.episodes[i + 1]) {
          return season.episodes[i + 1].videoUrl;
        }
        // Si no, buscar el primer episodio de la siguiente temporada
        if (playlist[seasonIndex + 1] && playlist[seasonIndex + 1].episodes.length > 0) {
          return playlist[seasonIndex + 1].episodes[0].videoUrl;
        }
      }
    }
  }
   return null; // Si no hay más episodios ni temporadas
}

// Función para bloquear la orientación en landscape
function lockOrientationLandscape() {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch((err) => {
      console.warn('No se pudo bloquear la orientación:', err);
    });
  }
}





// Modifica playEpisode para guardar progreso
function playEpisode(videoUrl) {
  const source = document.getElementById('videoSource');
  const playPauseBtn = document.getElementById('playPauseBtn').querySelector('.material-icons');
  const cover = document.getElementById('cover');
  const player = document.getElementById('player');
  const preferredLang = localStorage.getItem('preferredLang') || 'latino';

  let episode = null;
  let foundSeasonIndex = 0;

  

  // 🔍 Buscar episodio en playlist
  for (let seasonIndex = 0; seasonIndex < playlist.length; seasonIndex++) {
    const season = playlist[seasonIndex];
    const ep = season.episodes.find(e =>
      e.videoUrl === videoUrl ||
      e.videos?.latino === videoUrl ||
      e.videos?.sub === videoUrl
    );
    if (ep) {
      episode = ep;
      foundSeasonIndex = seasonIndex;
      break;
    }
  }

  if (!episode) {
    console.warn('❌ Episodio no encontrado en playlist');
    return;
  }



  // 🧠 Seleccionar idioma según preferencia guardada
  let selectedUrl = episode.videos?.[preferredLang] || episode.videoUrl;
  if (!selectedUrl) selectedUrl = Object.values(episode.videos || {})[0];

  // 💾 Guardar último episodio visto
  localStorage.setItem(`last-episode-${seriesId}`, selectedUrl);

  // 🎬 Actualizar fuente y reproducir
  const video = videojs('video');
  video.src({ type: 'video/mp4', src: selectedUrl });

  // ✅ Media Session SOLO cuando ya está reproduciendo
  const updateOnce = () => {
    updateMediaSession({
      ...episode,
      seasonName: playlist[foundSeasonIndex].season
    });
    video.off('playing', updateOnce);
  };
  
  video.on('playing', updateOnce);
  

  const progress = loadProgress(selectedUrl);

  function setTimeOnce() {
    video.off("loadedmetadata", setTimeOnce);
    const isFinished = progress >= video.duration() - 5;
    video.currentTime(isFinished ? 0 : progress);
    updateResumeButton();
    updateEpisodeUI(selectedUrl);
  }

  video.on("loadedmetadata", setTimeOnce);

  showPlayer();
  playPauseBtn.textContent = 'pause';

  // 🔒 Bloquear orientación horizontal + pantalla completa
  video.on('play', () => {
    lockOrientationLandscape();
    const playerContainer = document.getElementById('player');
    if (playerContainer?.requestFullscreen) {
      playerContainer.requestFullscreen().catch(console.warn);
    }
  });

  // 🔄 Actualizar ícono del idioma actual
  const langIcon = document.getElementById('langIcon');
  if (langIcon) {
    langIcon.textContent = (preferredLang === 'latino') ? 'chat' : 'subtitles';
  }

  // 📢 Emitir evento global para que el menú de idioma sepa qué episodio está activo
  window.dispatchEvent(new CustomEvent('playEpisode', { detail: episode }));

  console.log(`🎬 Reproduciendo: ${episode.title} (${preferredLang.toUpperCase()})`);
}



function updateEpisodeUI(videoUrl) {
  let found = false;

  for (let seasonIndex = 0; seasonIndex < playlist.length; seasonIndex++) {
    const season = playlist[seasonIndex];
    const episode = season.episodes.find(ep => ep.videoUrl === videoUrl);

    if (episode) {
      // 🟢 Actualizar subtítulo
      document.getElementById("episodeSubtitle").textContent = episode.episodeCode;

      // 🟢 Forzar selección de temporada y renderizado de episodios
      document.getElementById("seasonSelect").value = seasonIndex;
      localStorage.setItem(`selected-season-${seriesId}`, seasonIndex);

      // 🟢 Renderizar episodios y actualizar menú
      renderEpisodes();
      fillSeasonMenu();

      // 🟢 Resaltar el episodio actual en la UI
      setTimeout(() => {
        const currentEpEl = document.querySelector(`.episode[data-url="${videoUrl}"]`);
        if (currentEpEl) {
          currentEpEl.classList.add("active");
        }
      }, 100);

      // 🟢 Configurar intro
      if (episode.intro) {
        skipIntroStart = episode.intro.start;
        skipIntroEnd = episode.intro.end;
        document.getElementById('skipIntroBtn').classList.remove('hidden');
      } else {
        skipIntroStart = skipIntroEnd = null;
        document.getElementById('skipIntroBtn').classList.add('hidden');
      }

      updateResumeButton();
      updateNextEpisodeLabel?.();

      found = true;
      break;
    }
  }

  if (!found) {
    console.warn("No se encontró el episodio en el playlist.");
  }
}


// Mostrar/ocultar el botón durante el tiempo del intro
// Variables de control
let skipIntroTimeoutId = null;
let lastIntroState = false;

// Evento para mostrar/ocultar el botón durante el intro
video.on('timeupdate', () => {
  const btn = document.getElementById('skipIntroBtn');

  // Validación estricta para evitar parpadeos o mostrar cuando no debe
  if (
    typeof skipIntroStart !== 'number' ||
    typeof skipIntroEnd !== 'number' ||
    skipIntroStart <= 0 ||
    skipIntroEnd <= 0 ||
    skipIntroEnd <= skipIntroStart ||
    video.readyState < 1 // El video no ha cargado contenido aún
  ) {
    btn.classList.add('hidden');
    clearTimeout(skipIntroTimeoutId);
    lastIntroState = false;
    return;
  }

  const inIntroWindow = video.currentTime() >= skipIntroStart && video.currentTime() < skipIntroEnd;

  if (inIntroWindow) {
    if (!lastIntroState) {
      btn.classList.remove('hidden');

      clearTimeout(skipIntroTimeoutId);
      skipIntroTimeoutId = setTimeout(() => {
        btn.classList.add('hidden');
      }, 20000); // Ocultar tras 20 segundos si no se presiona
    }

    lastIntroState = true;
  } else {
    btn.classList.add('hidden');
    clearTimeout(skipIntroTimeoutId);
    lastIntroState = false;
  }
});

// Ocultar botón al comenzar a cargar nuevo video (evita parpadeos)
video.on('loadstart', () => {
  const btn = document.getElementById('skipIntroBtn');
  btn.classList.add('hidden');
  clearTimeout(skipIntroTimeoutId);
  lastIntroState = false;
});

// Acción del botón para saltar intro
function skipIntro() {
  if (typeof skipIntroEnd === 'number' && skipIntroEnd > 0) {
    video.currentTime(skipIntroEnd);
    document.getElementById('skipIntroBtn').classList.add('hidden');
  }
}


// Al terminar el video, guarda el progreso y pasa al siguiente episodio
video.on('ended', () => {
  const currentSrc = video.currentSrc();
  const progressKey = `progress-${seriesId}`;
  const data = JSON.parse(localStorage.getItem(progressKey)) || {};
  data[currentSrc] = -1;
  localStorage.setItem(progressKey, JSON.stringify(data));

  const nextUrl = findNextEpisode(currentSrc);

  if (nextUrl) {
    // 🟢 Cargar el siguiente episodio
    playEpisode(nextUrl);

    // ⚠️ Esperar a que cargue para guardar el progreso correctamente
    video.one('loadedmetadata', async () => {
      const episodeData = findEpisodeData(nextUrl);
      if (!episodeData) return;

      const duration = video.duration() || 1;
      const seriesTitle = document.getElementById('page-title')?.textContent || 'Serie';
      const seriesLink = document.getElementById('favoritoEnlace')?.href || window.location.href;

      const indexes = findEpisodeIndexes(nextUrl); // ✅ para Supabase

      const continueData = {
        seriesId,
        seriesTitle,
        episodeTitle: episodeData.episodeCode,
        poster: episodeData.thumbnail,
        link: seriesLink,
        progress: 0,
        duration,
        videoUrl: nextUrl,
        season_index: indexes?.seasonIndex ?? 0,
        episode_index: indexes?.episodeIndex ?? 0
      };

      // Guardar local
      localStorage.setItem(`continue_${seriesId}`, JSON.stringify(continueData));
      localStorage.setItem('justReturnedFromSeries', 'true');
      updateResumeButton?.();

      // 🔄 Sincronizar Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase
            .from('progresos')
            .upsert({
              id: session.user.id,
              series_id: seriesId,
              ultimo_visto: continueData
            }, { onConflict: ['id', 'series_id'] });

          await supabase
            .from('progresos')
            .update({
              episodios: {
                [nextUrl]: {
                  progress: 0,
                  duration,
                  episodeTitle: episodeData.episodeCode,
                  poster: episodeData.thumbnail,
                  season_index: indexes?.seasonIndex ?? 0,
                  episode_index: indexes?.episodeIndex ?? 0,
                  updatedAt: new Date().toISOString()
                }
              }
            })
            .eq('id', session.user.id)
            .eq('series_id', seriesId);

          console.log('✅ Progreso sincronizado correctamente');
        }
      } catch (err) {
        console.error('❌ Error sincronizando con Supabase:', err);
      }
    });

  } else {
    // 🧹 No hay más episodios
    localStorage.removeItem(`continue_${seriesId}`);
    goBack();
  }
});


// 🛰️ Sincroniza con Supabase (cada 5s máximo)
let lastSync = 0;

async function throttledSyncData(seriesId) {
const now = Date.now();
if (now - lastSync < 5000) return; // limita a 1 sync cada 5s
lastSync = now;

const { data: { user } } = await supabase.auth.getUser();
if (!user) return;

const videoUrl = video.currentSrc();
const currentTime = video.currentTime();
const totalDuration = video.duration() || 1;
const percent = currentTime / totalDuration;

await supabase.from('progresos').upsert({
  id: user.id,
  series_id: seriesId,
  video_url: videoUrl,
  tiempo: currentTime,
  progress: percent,
  duration: totalDuration,
  title: document.querySelector('.title')?.textContent?.trim() || 'Sin título',
  subtitle: document.querySelector('.episode-title')?.textContent?.trim() || '',
  poster: document.querySelector('.serie-poster img')?.src || '',
  link: window.location.href,
  updated_at: new Date().toISOString(),
});
}



// Guarda el progreso periódicamente
video.on('timeupdate', () => {
  const currentTime = video.currentTime();
  const duration = video.duration() || 1;
  const percent = Math.min((currentTime / duration) * 100, 100);

  saveProgress(video.currentSrc(), currentTime);
  updateResumeButton();

  const episodeElement = document.querySelector(`.episode[data-url="${video.currentSrc()}"]`);
  if (!episodeElement) return;

  let bar = episodeElement.querySelector('.progress-bar');
  if (!bar) {
    const track = document.createElement('div');
    track.className = 'progress-track';
    bar = document.createElement('div');
    bar.className = 'progress-bar';
    track.appendChild(bar);
    episodeElement.querySelector('.thumbnail-container').appendChild(track);
  }

  bar.style.width = `${percent}%`;
});





function playLastWatchedEpisode() {
  const lastKey = `last-episode-${seriesId}`;
  const progressKey = `progress-${seriesId}`;
  const lastUrl = localStorage.getItem(lastKey);
  const progressData = JSON.parse(localStorage.getItem(progressKey)) || {};

  if (lastUrl) {
    const lastTime = progressData[lastUrl] || 0;
    const safeTime = lastTime < 5 ? 0 : lastTime;

    video.src({ type: 'video/mp4', src: lastUrl });

    video.ready(function () {
      video.currentTime(safeTime);

      // ✅ Pantalla completa
      const playerContainer = document.getElementById('player');
      if (playerContainer?.requestFullscreen) {
        playerContainer.requestFullscreen().catch(console.warn);
      }

      // 🔒 Orientación horizontal
      lockOrientationLandscape();
    });

    showPlayer();

    // 🔔 Forzar MediaSession desde el botón "Reanudar"
const updateOnce = () => {
  for (let season of playlist) {
    const ep = season.episodes.find(e =>
      e.videoUrl === lastUrl ||
      e.videos?.latino === lastUrl ||
      e.videos?.sub === lastUrl
    );

    if (ep) {
      updateMediaSession({
        ...ep,
        seasonName: season.season
      });
      break;
    }
  }

  video.off('playing', updateOnce);
};

video.on('playing', updateOnce);


    for (let seasonIndex = 0; seasonIndex < playlist.length; seasonIndex++) {
      const season = playlist[seasonIndex];
      const episode = season.episodes.find(ep => ep.videoUrl === lastUrl);
      if (episode) {
        document.getElementById("seasonSelect").value = seasonIndex;
        document.getElementById("episodeSubtitle").textContent = episode.episodeCode;

        if (episode.intro) {
          skipIntroStart = episode.intro.start;
          skipIntroEnd = episode.intro.end;
          document.getElementById('skipIntroBtn').classList.remove('hidden');
        } else {
          skipIntroStart = skipIntroEnd = null;
          document.getElementById('skipIntroBtn').classList.add('hidden');
        }

        break;
      }
    }

    return;
  }

  // No hay último guardado: reproducir el primero
  const firstUrl = playlist[0].episodes[0].videoUrl;
  video.src({ type: 'video/mp4', src: firstUrl });
  // 🔔 MediaSession para el primer episodio (T1E1)
const firstEpisode = playlist[0].episodes[0];

const updateOnce = () => {
  updateMediaSession({
    ...firstEpisode,
    seasonName: playlist[0].season
  });
  video.off('playing', updateOnce);
};

video.on('playing', updateOnce);

  localStorage.setItem(`last-episode-${seriesId}`, firstUrl);

  video.ready(function () {
    video.currentTime(0);

    // ✅ Pantalla completa
    const playerContainer = document.getElementById('player');
    if (playerContainer?.requestFullscreen) {
      playerContainer.requestFullscreen().catch(console.warn);
    }

    // 🔒 Orientación horizontal
    lockOrientationLandscape();
  });

  showPlayer();

  document.getElementById("seasonSelect").value = 0;
  document.getElementById("episodeSubtitle").textContent = playlist[0].episodes[0].episodeCode;

  const episode = playlist[0].episodes[0];
  if (episode.intro) {
    skipIntroStart = episode.intro.start;
    skipIntroEnd = episode.intro.end;
    document.getElementById('skipIntroBtn').classList.remove('hidden');
  } else {
    skipIntroStart = skipIntroEnd = null;
    document.getElementById('skipIntroBtn').classList.add('hidden');
  }

  updateResumeButton();
}



function updateResumeButton() {
  const button = document.getElementById('resumeButton');
  if (!button) return;

  const key = `last-episode-${seriesId}`;
  const progressKey = `progress-${seriesId}`;
  const lastUrl = localStorage.getItem(key);
  const progressData = JSON.parse(localStorage.getItem(progressKey)) || {};

  if (lastUrl) {
    const lastTime = progressData[lastUrl] || 0;

    for (const season of playlist) {
      for (const ep of season.episodes) {
        if (ep.videoUrl === lastUrl) {
          const isComplete = lastTime === -1;
          const label = isComplete ? 'Mira' : 'Continuar';
          const durationMinutes = parseFloat(ep.meta?.match(/(\d+)m/)?.[1]) || 47;
const durationSeconds = durationMinutes * 60;
const percent = Math.min((lastTime / durationSeconds) * 100, 100);


          button.innerHTML = `
            <div class="resume-text-wrapper">
              <span class="material-icons">play_arrow</span>
              <div class="text-with-bar">
                <div class="resume-label">${label} ${ep.hiddenCode}</div>
                ${percent > 0 ? `
                <div class="resume-progress-track">
                  <div class="resume-progress-bar" style="width: ${percent}%;"></div>
                </div>` : ''}
              </div>
            </div>
          `;
          return;
        }
      }
    }
  }

  // Si no hay último episodio, mostrar el primero como predeterminado (sin barra)
  const first = playlist[0].episodes[0];
  button.innerHTML = `
    <div class="resume-text-wrapper">
      <span class="material-icons">play_arrow</span>
      <div class="text-with-bar">
        <div class="resume-label">Mira ${first.hiddenCode}</div>
      </div>
    </div>
  `;
}

updateResumeButton();





let nextEpisodeTimeout = null;
let circleAnimationInterval = null;
let circleProgress = 0;

function playNextEpisode() {
  // Marcar el episodio actual como completado
  const progressKey = `progress-${seriesId}`;
  const data = JSON.parse(localStorage.getItem(progressKey)) || {};
  const currentUrl = video.currentSrc();
data[currentUrl] = -1;
  localStorage.setItem(progressKey, JSON.stringify(data));

  // Cambiar al siguiente episodio
  const nextUrl = findNextEpisode(currentUrl);
  if (nextUrl) playEpisode(nextUrl);
}


function updateNextEpisodeLabel() {
  const nextUrl = findNextEpisode(video.currentSrc());

  if (!nextUrl) return;
  for (const season of playlist) {
    for (const ep of season.episodes) {
      if (ep.videoUrl === nextUrl) {
        document.getElementById('nextEpisodeLabel').textContent = `Siguiente episodio ${ep.hiddenCode}`;
        return;
      }
    }
  }
}

// Mostrar botón 20s antes del final
video.on('timeupdate', () => {
  const remaining = video.duration() - video.currentTime();
  const nextBtn = document.getElementById('nextEpisodeBtn');
  const nextUrl = findNextEpisode(video.currentSrc());

  if (remaining <= 20 && nextUrl) {
    if (nextBtn.classList.contains('hidden')) {
      nextBtn.classList.remove('hidden');
      updateNextEpisodeLabel();
      startCircleAnimation();
    }
  } else {
    nextBtn.classList.add('hidden');
    stopCircleAnimation();
  }
});


// Círculo de cuenta regresiva de 10s en bucle
function startCircleAnimation() {
  circleProgress = 0;
  const circle = document.getElementById('circleProgress');
  clearInterval(circleAnimationInterval);

  circleAnimationInterval = setInterval(() => {
    circleProgress += 1;
    if (circleProgress > 100) circleProgress = 0;
    circle.setAttribute('stroke-dasharray', `${circleProgress}, 100`);
  }, 100); // 100ms × 100 = 10s
}

function stopCircleAnimation() {
  clearInterval(circleAnimationInterval);
  document.getElementById('circleProgress').setAttribute('stroke-dasharray', '0, 100');
}

document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById('header');
    const pageTitle = document.getElementById('page-title');

    if (!header || !pageTitle) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const maxScroll = 300;

        const opacity = Math.min(scrollY / maxScroll, 1); // Gradiente del header
        const titleOpacity = scrollY > 150 ? Math.min(scrollY / maxScroll, 1) : 0; // El título aparece después de 150px

        header.style.backgroundColor = `rgba(1, 1, 29, ${opacity})`;
        pageTitle.style.opacity = titleOpacity;
    });
});

// Gestión de imágenes de perfil
const footerProfileIcon = document.getElementById("footerIconImg");
const headerProfileIcon = document.getElementById("headerProfileIcon"); // NUEVO
const profileImage = document.getElementById("profileImage");
const profilePageImage = document.getElementById("profilePageImage");

const defaultProfileIcon = document.getElementById("defaultProfileIcon");
const defaultProfileIconAlt = document.getElementById("defaultProfileIconAlt");

// Función para cambiar todas las imágenes de perfil
function updateProfileImage(src) {
  if (profileImage) profileImage.src = src;
  if (profilePageImage) profilePageImage.src = src;
  if (footerProfileIcon) footerProfileIcon.src = src;
  if (headerProfileIcon) headerProfileIcon.src = src;

  if (defaultProfileIcon) defaultProfileIcon.style.display = 'none';
  if (defaultProfileIconAlt) defaultProfileIconAlt.style.display = 'none';

  localStorage.setItem('profileImage', src);
}

// Restaurar la imagen de perfil guardada al cargar la página
window.addEventListener('load', function () {
  const storedProfileImage = localStorage.getItem('profileImage');
  if (storedProfileImage) {
    if (footerProfileIcon) footerProfileIcon.src = storedProfileImage;
    if (headerProfileIcon) headerProfileIcon.src = storedProfileImage;
    if (profileImage) profileImage.src = storedProfileImage;
    if (profilePageImage) profilePageImage.src = storedProfileImage;

    if (defaultProfileIcon) defaultProfileIcon.style.display = 'none';
    if (defaultProfileIconAlt) defaultProfileIconAlt.style.display = 'none';
  }
});
  
  // Ocultar footer al hacer scroll hacia abajo
  var lastScrollTop = 0;
  var footer = document.querySelector(".footer");
  
  window.addEventListener("scroll", function () {
      var currentScroll = window.scrollY;
  
      if (currentScroll > lastScrollTop) {
          footer.classList.add("hidden");
      } else {
          footer.classList.remove("hidden");
      }
  
      lastScrollTop = currentScroll;
  });

  document.addEventListener("DOMContentLoaded", () => {
    const favoritoBtn = document.getElementById('favoritoBtn');
    const favoritoIcon = document.getElementById('favoritoIcon');
  
    // si no hay botón, salimos silenciosamente
    if (!favoritoBtn || !favoritoIcon) return;
  
    const identificador = favoritoBtn.getAttribute('data-identificador');
  
    async function toggleFavorito() {
      const favoritoEnlace = document.getElementById('favoritoEnlace');
      const imagen = document.getElementById('favoritoImagen');
      const nombre = document.getElementById('nombre')?.textContent?.trim() || "";
      const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  
      const encontrado = favoritos.some(favorito => favorito.identificador === identificador);
  
      // 🧑 Obtener sesión actual
      let userId = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      } catch (e) {
        console.warn("⚠️ Supabase no disponible:", e);
      }
  
      if (encontrado) {
        // ❌ Eliminar de localStorage
        const nuevosFavoritos = favoritos.filter(fav => fav.identificador !== identificador);
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
        favoritoIcon.innerText = 'add';
        mostrarNotificacion('Se eliminó de favoritos');
  
        // ❌ Eliminar de Supabase si hay sesión
        if (userId) {
          try {
            await supabase.from('favoritos')
              .delete()
              .eq('id', userId)
              .eq('identificador', identificador);
          } catch (err) {
            console.error('❌ Error eliminando favorito en Supabase:', err);
          }
        }
      } else {
        // ✅ Agregar a localStorage
        const nuevoFav = {
          identificador,
          imagen: imagen?.outerHTML || "",
          enlace: favoritoEnlace?.href || "",
          nombre
        };
        favoritos.push(nuevoFav);
        localStorage.setItem('favoritos', JSON.stringify(favoritos));
        favoritoIcon.innerText = 'check';
        mostrarNotificacion('Se añadió a favoritos');
  
        // ✅ Agregar a Supabase si hay sesión
        if (userId) {
          try {
            await supabase.from('favoritos').upsert({
              id: userId,
              identificador,
              nombre,
              imagen: imagen?.outerHTML || "",
              enlace: favoritoEnlace?.href || ""
            });
          } catch (err) {
            console.error('❌ Error guardando favorito en Supabase:', err);
          }
        }
      }
  
      // 🔄 Lanzar evento personalizado por si estás en la página de favoritos
      window.dispatchEvent(new Event("favoritosActualizados"));
    }
  
    function cargarEstadoFavorito() {
      const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
      const encontrado = favoritos.some(favorito => favorito.identificador === identificador);
      favoritoIcon.innerText = encontrado ? 'check' : 'add';
    }
  
    function mostrarNotificacion(mensaje) {
      const notificacion = document.getElementById('notificacion');
      const notificacionTexto = document.getElementById('notificacionTexto');
      if (!notificacion || !notificacionTexto) return;
  
      notificacionTexto.innerText = mensaje;
      notificacion.style.bottom = "80px";
      setTimeout(() => {
        notificacion.style.bottom = "-200px";
      }, 3000);
    }
  
    // Cargar estado inicial del icono
    cargarEstadoFavorito();
  
    // Exponer función globalmente para el botón HTML
    window.toggleFavorito = toggleFavorito;
  });
  
const aspectModes = ['cover', 'fill', 'contain', 'fit-height', 'fit-width', 'scale-down'];
let currentAspectIndex = 0;

function toggleAspectRatio() {
  currentAspectIndex = (currentAspectIndex + 1) % aspectModes.length;
  const mode = aspectModes[currentAspectIndex];

  // Asegura que usamos el elemento de video real
  const videoElement = video.el().getElementsByTagName('video')[0];

  // Aplica el modo
  videoElement.style.objectFit = mode.includes('fit-') ? 'contain' : mode;

  switch (mode) {
    case 'fit-height':
      videoElement.style.width = 'auto';
      videoElement.style.height = '100%';
      break;
    case 'fit-width':
      videoElement.style.width = '100%';
      videoElement.style.height = 'auto';
      break;
    default:
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      break;
  }

  const label = document.getElementById('aspectLabel');
  label.textContent = mode;
  label.style.display = 'block';

  clearTimeout(label._hideTimeout);
  label._hideTimeout = setTimeout(() => {
    label.style.display = 'none';
  }, 1500);
}


function castCurrentVideo() {
  const currentSrc = video.currentSrc(); // usa método

  let videoUrl = null;

  // Buscar el episodio actual en el playlist
  outerLoop:
  for (const season of playlist) {
    for (const episode of season.episodes) {
      if (episode.videoUrl === currentSrc) {
        videoUrl = episode.videoUrl;
        break outerLoop;
      }
    }
  }

  if (videoUrl) {
    const appLink = "wvc-x-callback://open?url=" + encodeURIComponent(videoUrl);
    const storeLink = "https://play.google.com/store/apps/details?id=com.instantbits.cast.webvideo";

    // Crear enlace temporal invisible
    const transmitLink = document.createElement('a');
    transmitLink.href = appLink;
    transmitLink.style.display = 'none';
    document.body.appendChild(transmitLink);

    let appOpened = false;
    transmitLink.click();

    // Si la app no se abre, redirige a la Play Store
    setTimeout(() => {
      if (!appOpened) {
        window.location.href = storeLink;
      }
      document.body.removeChild(transmitLink);
    }, 1000);

    // Si se pierde el foco, asumimos que se abrió la app
    window.addEventListener("blur", () => {
      appOpened = true;
    }, { once: true });

  } else {
    alert("No se pudo obtener el enlace del episodio actual.");
  }
}


const loader = document.getElementById('videoLoader');

// Mostrar loader mientras se carga o busca
video.on('waiting', () => {
  loader.classList.remove('hidden');
});

// Ocultar loader cuando comience a reproducirse
video.on('playing', () => {
  loader.classList.add('hidden');
});

// También al cambiar manualmente de episodio o al adelantar
video.on('seeking', () => {
  loader.classList.remove('hidden');
});

video.on('seeked', () => {
  loader.classList.add('hidden');
});

// Bloquear teclas comunes de desarrollo
document.addEventListener('keydown', function(e) {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
    (e.ctrlKey && e.key === 'U')
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
});


const coverImageOverlay = document.querySelector('.cover-image-overlay');
const landscapeImageOverlay = document.querySelector('.cover-landscape-image-overlay');

let lastScroll = window.scrollY;

function updateOverlayOpacity() {
  const currentScroll = window.scrollY;
  const scrollingUp = currentScroll < lastScroll;

  const rect = cover.getBoundingClientRect();
  const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom));
  const totalHeight = cover.offsetHeight;
  const hiddenRatio = 1 - (visibleHeight / totalHeight);
  const opacity = Math.min(hiddenRatio * 1.5, 1.0); // puedes ajustar el 1.5 y 0.5

  if (scrollingUp) {
    if (coverImageOverlay) coverImageOverlay.style.background = `rgba(0, 0, 0, ${opacity})`;
    if (landscapeImageOverlay) landscapeImageOverlay.style.background = `rgba(0, 0, 0, ${opacity})`;
  } else {
    // Al bajar, se limpia
    if (coverImageOverlay) coverImageOverlay.style.background = 'rgba(0, 0, 0, 0)';
    if (landscapeImageOverlay) landscapeImageOverlay.style.background = 'rgba(0, 0, 0, 0)';
  }

  lastScroll = currentScroll;
}

window.addEventListener('scroll', updateOverlayOpacity);

// Detectar teclas y mover el foco
document.addEventListener('keydown', function(e) {
const focusable = Array.from(document.querySelectorAll('[tabindex]:not([disabled])'));
const current = document.activeElement;
const currentIndex = focusable.indexOf(current);

switch(e.key) {
  case 'ArrowLeft':
  case 'ArrowUp':
    if (currentIndex > 0) {
      focusable[currentIndex - 1].focus();
    }
    e.preventDefault();
    break;
  case 'ArrowRight':
  case 'ArrowDown':
    if (currentIndex < focusable.length - 1) {
      focusable[currentIndex + 1].focus();
    }
    e.preventDefault();
    break;
  case 'Enter':
  case 'OK':
    if (document.activeElement) {
      document.activeElement.click();
    }
    e.preventDefault();
    break;

  // Barra espaciadora -> play/pausa del video
  case ' ':
  case 'Spacebar': // por compatibilidad vieja
    const video = document.querySelector('video'); // el <video> de video.js
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      e.preventDefault();
    }
    break;
}
});

// Botón Backspace / Back
window.addEventListener('keydown', function(e) {
if(e.key === 'Backspace' || e.key === 'BrowserBack') {
  history.back();
  e.preventDefault();
}
});


const tabs = document.querySelector('.tabs-secondary');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY === 0) {
      // En el top, hacer transparente
      tabs.classList.remove('scrolled-up');
    } else if (currentScrollY < lastScrollY) {
      // Deslizando hacia arriba: oscurecer
      tabs.classList.add('scrolled-up');
    } else if (currentScrollY > lastScrollY) {
      // Deslizando hacia abajo: transparente
      tabs.classList.remove('scrolled-up');
    }

    lastScrollY = currentScrollY;
  });

  window.playEpisode = playEpisode;




// === MENÚ DE IDIOMAS: versión robusta que fuerza carga, fallback y loggea errores ===
(function () {
  const getPlayer = () => (typeof videojs !== 'undefined' && videojs.getPlayer) ? videojs.getPlayer('video') : (window._videoInstance || null);
  const langBtnWrapper = document.getElementById("langBtnWrapper");
  const langMenu = document.getElementById("langMenu");
  const langOptions = document.querySelectorAll(".lang-option");
  const langIcon = document.getElementById("langIcon");
  const langConfirmBtn = document.getElementById("langConfirmBtn");
  const overlayBg = document.getElementById("overlay");

  let currentLang = localStorage.getItem('preferredLang') || "latino";
  let selectedLang = currentLang;
  let currentEpisode = null;
  let menuOpen = false;

  function findEpisodeByUrl(url) {
    if (!url || !window.playlist) return null;
  
    for (const season of window.playlist) {
      for (const ep of season.episodes) {
        // ✅ Buscar en ambos formatos (videoUrl y videos.latino/sub)
        if (
          ep.videoUrl === url ||
          ep.videos?.latino === url ||
          ep.videos?.sub === url ||
          url.includes(ep.videoUrl?.split('/').pop()) ||
          url.includes(ep.videos?.latino?.split('/').pop()) ||
          url.includes(ep.videos?.sub?.split('/').pop())
        ) {
          return ep;
        }
      }
    }
  
    return null;
  }
  
  

  function openMenu() {
    selectedLang = currentLang;
    langOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.lang === selectedLang));
    if (langMenu) langMenu.style.display = 'flex';
    if (overlayBg) overlayBg.style.display = 'block';
    const p = getPlayer();
    if (p && typeof p.pause === 'function') p.pause();
    menuOpen = true;
  }

  function closeMenu(hacerPlay = true) {
    if (langMenu) langMenu.style.display = 'none';
    if (overlayBg) overlayBg.style.display = 'none';
    const p = getPlayer();
    if (hacerPlay && p && typeof p.play === 'function') p.play().catch(()=>{});
    menuOpen = false;
  }

  function selectLanguage(lang) {
    selectedLang = lang;
    langOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.lang === selectedLang));
  }

 // ---------- REEMPLAZA confirmAndPlay con esta versión ----------
function confirmAndPlay() {
  const p = getPlayer();

  // 1️⃣ Detectar episodio actual
  if (!currentEpisode) {
    const cur = p && typeof p.currentSrc === 'function'
      ? p.currentSrc()
      : (document.getElementById('videoSource')?.src || null);
    currentEpisode = findEpisodeByUrl(cur);
  }

  if (!currentEpisode) {
    console.warn('[lang] No se detectó episodio actual.');
    closeMenu(true);
    return;
  }

  // 2️⃣ Guardar tiempo actual antes del cambio
  const oldTime = (p && typeof p.currentTime === 'function')
    ? p.currentTime()
    : (document.querySelector('#video')?.currentTime || 0);

  // 3️⃣ Actualizar idioma seleccionado
  currentLang = selectedLang;
  localStorage.setItem('preferredLang', currentLang);
  if (langIcon) langIcon.textContent = (currentLang === 'latino') ? 'chat' : 'subtitles';

  // 4️⃣ Obtener URL correspondiente al idioma
  const newUrl = currentEpisode.videos?.[currentLang];
  if (!newUrl) {
    console.warn('[lang] No existe URL para el idioma seleccionado.', currentEpisode.videos);
    closeMenu(true);
    return;
  }

  console.log('[lang] Cambiando idioma a:', currentLang, 'URL:', newUrl, 'desde:', oldTime);

  // 5️⃣ Cambiar fuente en el reproductor o DOM
  if (p && typeof p.src === 'function') {
    try { p.off && p.off('loadedmetadata'); } catch(e){}

    p.pause && p.pause();
    p.src({ type: 'video/mp4', src: newUrl });

    let handled = false;
    const onMeta = () => {
      if (handled) return;
      handled = true;
      try { p.currentTime(oldTime); } catch(e) {
        const dom = document.getElementById('video');
        if (dom) dom.currentTime = oldTime;
      }
      p.play().catch(err => console.warn('[lang] play() fallo:', err));
    };

    if (typeof p.one === 'function') {
      p.one('loadedmetadata', onMeta);
    } else if (typeof p.on === 'function') {
      const wrap = () => { onMeta(); p.off && p.off('loadedmetadata', wrap); };
      p.on('loadedmetadata', wrap);
    } else {
      const dom = document.getElementById('video');
      if (dom) dom.addEventListener('loadedmetadata', onMeta, { once: true });
    }

    setTimeout(() => {
      if (!handled) {
        console.warn('[lang] loadedmetadata no llegó a tiempo, forzando seek/play.');
        try { p.currentTime(oldTime); } catch(e) {
          const dom = document.getElementById('video');
          if (dom) dom.currentTime = oldTime;
        }
        p.play().catch(()=>{});
        handled = true;
      }
    }, 3500);
  } else {
    const dom = document.getElementById('video');
    const sourceEl = document.getElementById('videoSource');
    if (!dom || !sourceEl) {
      console.error('[lang] No hay player ni elemento video DOM.');
      closeMenu(true);
      return;
    }
    try {
      dom.pause();
      sourceEl.src = newUrl;
      dom.load();
    } catch (e) { console.error('[lang] error al setear src DOM:', e); }

    dom.addEventListener('loadedmetadata', function onMetaDOM() {
      dom.currentTime = oldTime;
      dom.play().catch(()=>{});
      dom.removeEventListener('loadedmetadata', onMetaDOM);
    }, { once: true });

    setTimeout(() => {
      if (!dom.paused) return;
      try { dom.currentTime = oldTime; dom.play().catch(()=>{}); } catch(e) {}
    }, 3500);
  }

  // 6️⃣ Guardar progreso actualizado
  try {
    const key = `progress-${seriesId}`;
    const episodios = JSON.parse(localStorage.getItem(key) || '{}');
    episodios[newUrl] = { progress: oldTime, updated_at: Date.now() };
    localStorage.setItem(key, JSON.stringify(episodios));
    localStorage.setItem(`last-episode-${seriesId}`, newUrl);
  } catch (e) {
    console.warn('[lang] no se pudo guardar progreso:', e);
  }

  // 7️⃣ 🔁 Actualizar el botón "Continuar viendo" en vivo
  try {
    const button = document.getElementById('resumeButton');
    if (button && currentEpisode) {
      const label = 'Continuar ' + (currentEpisode.hiddenCode || '');
      button.innerHTML = `
        <div class="resume-text-wrapper">
          <span class="material-icons">play_arrow</span>
          <div class="text-with-bar">
            <div class="resume-label">${label}</div>
            <div class="resume-progress-track">
              <div class="resume-progress-bar" style="width: 0%;"></div>
            </div>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.warn('[lang] No se pudo actualizar el botón resume en vivo:', err);
  }

  if (typeof updateResumeButton === 'function') updateResumeButton();

  closeMenu(true);
}
// ---------- FIN confirmAndPlay ----------


  // UI events
  langBtnWrapper?.addEventListener('click', (e) => { e.stopPropagation(); openMenu(); });
  langOptions.forEach(option => option.addEventListener('click', (e) => { e.stopPropagation(); selectLanguage(option.dataset.lang); }));
  langConfirmBtn?.addEventListener('click', (e) => { e.stopPropagation(); confirmAndPlay(); });

  function handleOutsideClose(e) {
    if (!menuOpen) return;
    if (!langMenu.contains(e.target) && !langBtnWrapper.contains(e.target)) confirmAndPlay();
  }
  document.addEventListener('click', handleOutsideClose, true);
  document.addEventListener('touchstart', handleOutsideClose, true);

  // listen playEpisode events to keep currentEpisode updated
  window.addEventListener('playEpisode', (e) => {
    currentEpisode = e?.detail || null;
    if (!currentEpisode) {
      const p = getPlayer();
      const cur = p && typeof p.currentSrc === 'function' ? p.currentSrc() : (document.getElementById('videoSource')?.src || null);
      currentEpisode = findEpisodeByUrl(cur);
    }
    // update lang icon with preferred
    const pref = localStorage.getItem('preferredLang') || currentLang;
    if (langIcon) langIcon.textContent = (pref === 'latino') ? 'chat' : 'subtitles';
  });

  // update currentEpisode when metadata loads (covers direct loads)
  const p0 = getPlayer();
  if (p0 && typeof p0.on === 'function') {
    p0.on('loadedmetadata', function() {
      const cur = p0 && typeof p0.currentSrc === 'function' ? p0.currentSrc() : (document.getElementById('videoSource')?.src || null);
      currentEpisode = findEpisodeByUrl(cur);
    });
  } else {
    const dom = document.getElementById('video');
    dom && dom.addEventListener('loadedmetadata', function() {
      currentEpisode = findEpisodeByUrl(dom.currentSrc || document.getElementById('videoSource')?.src);
    });
  }

})();



 const API_KEY = '4b77886f6f12c73066c0d0509038df60';

   const GENRES = {
28:"Acción",
12:"Aventura",
16:"Animación",
35:"Comedia",
80:"Crimen",
99:"Documental",
18:"Drama",
10751:"Familiar",
14:"Fantasía",
36:"Historia",
27:"Terror",
10402:"Música",
9648:"Misterio",
10749:"Romance",
878:"Ciencia ficción",
10770:"TV Movie",
53:"Suspenso",
10752:"Guerra",
37:"Western"
};

function escapeHTML(str) {
  return str ? str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m])) : '';
}

function generarSlug(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");
}

function rellenarPlantilla(plantilla, datos) {
  return plantilla.replace(/\{\{(.*?)\}\}/g, (_, clave) => datos[clave.trim()] || '');
}

function limitarTexto(texto, maxCaracteres) {
  if (!texto) return '';
  return texto.length > maxCaracteres
    ? texto.slice(0, maxCaracteres).trim() + '...'
    : texto;
}

async function buscar() {
  const query = document.getElementById('searchInput').value.trim();
  const resultados = document.getElementById('resultados');
  resultados.innerHTML = '';

  if (!query) return alert("Escribe algo para buscar.");

  const tipoSeleccionado = document.getElementById('tipo').value;

  const res = await fetch(`https://api.themoviedb.org/3/search/${tipoSeleccionado}?query=${encodeURIComponent(query)}&api_key=${API_KEY}&language=es-MX`);
  const data = await res.json();

  if (!data.results || !data.results.length) {
    resultados.innerHTML = '<p>No se encontraron resultados.</p>';
    return;
  }

  data.results.forEach(item => {
    const poster = item.poster_path
      ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
      : 'https://via.placeholder.com/154x231?text=Sin+Imagen';
    const nombre = item.title || item.name;

    const div = document.createElement('div');
    div.className =
'poster-card cursor-pointer text-center bg-slate-900 rounded-xl p-2 border border-slate-700 hover:border-blue-500';
    div.innerHTML = `
      <img src="${poster}" alt="${nombre}" class="rounded w-full mb-1">
      <p class="text-xs font-semibold">${nombre}</p>
    `;
    div.onclick = () => seleccionar(item, tipoSeleccionado);
    resultados.appendChild(div);
  });

  document.getElementById('seleccion').classList.add('hidden');
  document.getElementById('salida').value = '';
}

async function seleccionar(item, tipo) {
  document.getElementById('resultados').innerHTML = '';

  const seleccionDiv = document.getElementById('seleccion');
  seleccionDiv.classList.remove('hidden');

  const imgSrc = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : 'https://via.placeholder.com/500x750?text=Sin+Imagen';
  const imagenSeleccion = document.getElementById('imagenSeleccion');
  imagenSeleccion.src = imgSrc;
  imagenSeleccion.alt = item.title || item.name;

  document.getElementById('movieId').value = item.id;
  document.getElementById('tipoSeleccion').value = tipo === 'movie' ? 'Película' : 'Serie';

  document.getElementById('temporadaBox').classList.add('hidden');
}

async function generar() {
  const id = document.getElementById('movieId').value.trim();
  const tipoTexto = document.getElementById('tipoSeleccion').value.toLowerCase() === 'serie' ? 'tv' : 'movie';

  if (!id) return alert("Selecciona una opción antes de generar.");

  if (tipoTexto === 'tv') {
  const dataSerie = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=es-MX`).then(r => r.json());
  const numeroTemporadas = dataSerie.number_of_seasons || 1;
  const playlist = [];

  for (let t = 1; t <= numeroTemporadas; t++) {
    const temporadaData = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${t}?api_key=${API_KEY}&language=es-MX`).then(r => r.json());

    const episodios = (temporadaData.episodes || []).map(ep => {
      const title = `E${ep.episode_number}: ${ep.name || 'Sin título'}`;
      const episodeCode = `T${t} E${ep.episode_number}: ${ep.name || 'Sin título'}`;
      const hiddenCode = `T${t} E${ep.episode_number}`;

      // 📌 Edad automática desde "content_ratings"
      let edad = "NR";
      if (dataSerie.content_ratings?.results) {
        const mx = dataSerie.content_ratings.results.find(r => r.iso_3166_1 === "MX");
        const us = dataSerie.content_ratings.results.find(r => r.iso_3166_1 === "US");
        const certRaw = mx?.rating || us?.rating || "";
        if (/^\d+$/.test(certRaw)) edad = `${certRaw}+`;
        else if (/PG-?13/i.test(certRaw)) edad = "13+";
        else if (/R|18/i.test(certRaw)) edad = "18+";
        else if (/PG/i.test(certRaw)) edad = "10+";
        else if (certRaw) edad = certRaw;
      }

      const duracion = ep.runtime
        ? `${ep.runtime}m`
        : (temporadaData.episodes[0]?.runtime ? `${temporadaData.episodes[0].runtime}m` : '??m');

      const anio = dataSerie.first_air_date ? dataSerie.first_air_date.slice(0, 4) : '¿?';
      const thumbnail = ep.still_path
        ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
        : '';

      return {
        title,
        meta: `${edad} · ${duracion} · ${anio}`,
        thumbnail,
        videoUrl: "",
        downloadUrl: "",
        episodeCode,
        hiddenCode,
        intro: { start: 0, end: 0 }
      };
    });

    playlist.push({
      season: `Temporada ${t}`,
      episodes: episodios
    });
  }

  const playlistJSON = JSON.stringify(playlist, null, 2);

  const imagenes = await fetch(`https://api.themoviedb.org/3/tv/${id}/images?api_key=${API_KEY}`).then(r => r.json());
  const poster = imagenes.posters[0]?.file_path ? `https://image.tmdb.org/t/p/w500${imagenes.posters[0].file_path}` : '';
  const backdrop = imagenes.backdrops[0]?.file_path ? `https://image.tmdb.org/t/p/original${imagenes.backdrops[0].file_path}` : '';
  const logo = imagenes.logos.find(l => l.iso_639_1 === 'es' || l.iso_639_1 === null)?.file_path;
  const logoUrl = logo ? `https://image.tmdb.org/t/p/original${logo}` : '';

  const title = dataSerie.name || 'Sin título';
  const overview = dataSerie.overview || 'Sin descripción';
  const descripcionCorta = limitarTexto(overview, 200);

  // 📌 Función de normalización de clasificaciones
function normalizarClasificacion(certRaw) {
  if (!certRaw) return "NR";

  if (/^AA$/i.test(certRaw)) return "7+";          // Infantil
  if (/^A$/i.test(certRaw)) return "7+";
  if (/^B$/i.test(certRaw)) return "13+";
  if (/^B15$/i.test(certRaw)) return "15+";
  if (/^C$/i.test(certRaw)) return "18+";
  if (/^D$/i.test(certRaw)) return "18+ (Explícito)";
  if (/^\d+$/.test(certRaw)) return `${certRaw}+`; // Solo número
  if (/PG-?13/i.test(certRaw)) return "13+";
  if (/R|18/i.test(certRaw)) return "18+";
  if (/PG/i.test(certRaw)) return "10+";
  if (/G/i.test(certRaw)) return "Todas las edades"; // USA G

  return certRaw || "NR";
}

// 📌 Edad automática desde arriba
let edad = "NR";
if (dataSerie.content_ratings?.results) {
  const mx = dataSerie.content_ratings.results.find(r => r.iso_3166_1 === "MX");
  const us = dataSerie.content_ratings.results.find(r => r.iso_3166_1 === "US");
  const certRaw = mx?.rating || us?.rating || "";
  edad = normalizarClasificacion(certRaw);
}

const anio = dataSerie.first_air_date ? dataSerie.first_air_date.slice(0, 4) : "¿?";
const temporadas = numeroTemporadas === 1 ? "1 temporada" : `${numeroTemporadas} temporadas`;

// 📌 Meta final
const meta = `${edad}   ${temporadas}   ${anio}   Dob Lat`;

const logoFinal = logoUrl || "logo.png";
const coverContent = `
  <div class="cover-content">
    <img src="${logoFinal}" alt="${title} Logo" class="logo" tabindex="2" oncontextmenu="return false" draggable="false">
    <div class="meta">${meta}</div>
  </div>`;

const slug = generarSlug(title);



    const recomendaciones = await fetch(`https://api.themoviedb.org/3/tv/${id}/recommendations?api_key=${API_KEY}&language=es-MX`).then(r => r.json());
    const sugerenciasHTML = (recomendaciones.results || []).slice(0, 4).map(rec => {
      const titulo = escapeHTML(rec.title || rec.name || 'Sin título');
      const img = rec.poster_path
        ? `https://image.tmdb.org/t/p/w300${rec.poster_path}`
        : 'https://via.placeholder.com/300x450?text=Sin+Imagen';
      const slugRec = generarSlug(titulo);
      const archivo = `${slugRec}.html`;

      return `
      <div class="suggested-item">
        <a href="${archivo}">
          <img src="${img}" alt="${titulo}" oncontextmenu="return false" draggable="false">
        </a>
        <div class="suggested-info">
          <div class="title">${titulo}</div>
          <div class="meta-row">
            <span class="meta">Dob | Lat</span>
          </div>
        </div>
      </div>`;
    }).join('\n');

    const datos = {
      titulo: title,
      titulo_completo: title,
      descripcion_corta: descripcionCorta,
      fondo: poster,
      fondo_landscape: backdrop,
      archivo: `${slug}.html`,
      descarga: poster,
      meta: meta,
      logo: logoUrl,
      sugerencias: sugerenciasHTML,
      playlist: playlistJSON,
      seriesId: `${slug}-${id}` // 👈 Aquí lo agregas
    };

    const plantilla = await fetch("series.html").then(r => r.text());

const playlistJSONSafe = JSON.stringify(playlist, null, 2)
  .replace(/\\/g, "\\\\")
  .replace(/`/g, "\\`")
  .replace(/\$\{/g, "\\${")
  .replace(/<\/script>/gi, "<\\/script>");

const plantillaConPlaylist = plantilla.replace('{{playlist}}', playlistJSONSafe);

const htmlFinal = plantillaConPlaylist.replace(
  /<div class="suggested-grid">([\s\S]*?)<\/div>/,
  `<div class="suggested-grid">\n${sugerenciasHTML}\n</div>`
);

const salidaFinal = rellenarPlantilla(htmlFinal, datos);
document.getElementById('salida').value = salidaFinal;


  } else {
    // 📌 Películas
const dataPeli = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=es-MX`).then(r => r.json());
const imagenes = await fetch(`https://api.themoviedb.org/3/movie/${id}/images?api_key=${API_KEY}`).then(r => r.json());

// 📌 Clasificación por edad (TMDB → normalizada)
const releaseData = await fetch(`https://api.themoviedb.org/3/movie/${id}/release_dates?api_key=${API_KEY}`).then(r => r.json());
let edad = '';

if (releaseData.results) {
  const mx = releaseData.results.find(r => r.iso_3166_1 === "MX");
  const us = releaseData.results.find(r => r.iso_3166_1 === "US");

  const certRaw =
    mx?.release_dates?.[0]?.certification ||
    us?.release_dates?.[0]?.certification ||
    "";

  // Normalización México y USA
  if (/^AA$/i.test(certRaw)) {
    edad = "7+"; // AA → Público infantil
  } else if (/^A$/i.test(certRaw)) {
    edad = "7+"; // A → Público general
  } else if (/^B$/i.test(certRaw)) {
    edad = "13+";
  } else if (/^B15$/i.test(certRaw)) {
    edad = "15+";
  } else if (/^C$/i.test(certRaw)) {
    edad = "18+";
  } else if (/^D$/i.test(certRaw)) {
    edad = "18+ (Explícito)";
  } else if (/^\d+$/.test(certRaw)) {
    edad = `${certRaw}+`; // Solo número
  } else if (/PG-?13/i.test(certRaw)) {
    edad = "13+";
  } else if (/R|18/i.test(certRaw)) {
    edad = "18+";
  } else if (/PG/i.test(certRaw)) {
    edad = "10+";
  } else if (/G/i.test(certRaw)) {
    edad = "Todas las edades"; // G (USA) → General
  } else {
    edad = certRaw !== "" ? certRaw : "NR";
  }
}


// 📌 Duración (runtime viene en minutos)
let duracion = '';
if (dataPeli.runtime) {
  const horas = Math.floor(dataPeli.runtime / 60);
  const minutos = dataPeli.runtime % 60;
  duracion = `${horas}h ${minutos}min`;
}

const poster = imagenes.posters[0]?.file_path ? `https://image.tmdb.org/t/p/w500${imagenes.posters[0].file_path}` : '';
const backdrop = imagenes.backdrops[0]?.file_path ? `https://image.tmdb.org/t/p/original${imagenes.backdrops[0].file_path}` : '';
const logo = imagenes.logos.find(l => l.iso_639_1 === 'es' || l.iso_639_1 === null)?.file_path;
const logoUrl = logo ? `https://image.tmdb.org/t/p/original${logo}` : '';

const title = dataPeli.title || 'Sin título';
const overview = dataPeli.overview || 'Sin descripción';
const descripcionCorta = limitarTexto(overview, 200);
const anio = dataPeli.release_date ? dataPeli.release_date.slice(0, 4) : '¿?';

// 📌 Meta ya automático 🎉
const meta = `${edad}   ${duracion}   ${anio}   Dob Lat`;

const slug = generarSlug(title);

// 📌 Recomendaciones
// 📌 Recomendaciones
const recomendaciones = await fetch(`https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${API_KEY}&language=es-MX`).then(r => r.json());
const sugerenciasHTML = (recomendaciones.results || []).slice(0, 4).map(rec => {
  const titulo = escapeHTML(rec.title || rec.name || 'Sin título');
  const img = rec.poster_path
    ? `https://image.tmdb.org/t/p/w300${rec.poster_path}`
    : 'https://via.placeholder.com/300x450?text=Sin+Imagen';
  const slugRec = generarSlug(titulo);
  const archivo = `${slugRec}.html`;

  return `
      
        <a href="${archivo}" class="sugerencia-item">
    <img src="${img}" alt="${titulo}">
    <p class="sugerencia-titulo">${titulo}</p>
    <p class="sugerencia-sub">Dob | Lat</p>
  </a>`;
  }).join('\n');




    const datos = {
      titulo: title,
      titulo_completo: title,
      descripcion_corta: descripcionCorta,
      fondo: poster,
      fondo_landscape: backdrop,
      archivo: `${slug}.html`,
      descarga: poster,
      meta: meta,
      logo: logoUrl,
      sugerencias: sugerenciasHTML,
      playlist: "[]",
      movieId: `${slug}-${id}`, // 👈 ID único para películas
    };

    const plantilla = await fetch("peliculas.html").then(r => r.text());
    const htmlFinal = plantilla.replace(
      /<div class="suggested-grid">([\s\S]*?)<\/div>/,
      `<div class="suggested-grid">\n${sugerenciasHTML}\n</div>`
    );
    const salidaFinal = rellenarPlantilla(htmlFinal, datos);

    document.getElementById('salida').value = salidaFinal;
  }
}

// ======================================================
// CARRUSEL - ELEMENTOS ACUMULADOS DEL PREVIEW
// ======================================================

let previewItems = [];


// ======================================================
// AGREGAR RESULTADOS SELECCIONADOS AL PREVIEW
// ======================================================


function agregarAlPreview() {

    const seleccionados =
        document.querySelectorAll(
            "#carouselResultados .carouselCheck:checked"
        );

    if (seleccionados.length === 0) {

        alert("Selecciona al menos un elemento.");

        return;
    }


    // =========================================
    // CONFIGURACIÓN ACTUAL
    // =========================================

    const formato =
        document.getElementById("carouselFormato").value;

    const tituloCarrusel =
        document.getElementById("carouselTitulo").value ||
        "Nuevo Carrusel";

    const carpeta =
        document.getElementById("carouselCarpeta").value;


    // =========================================
    // CONTENEDOR DEL PREVIEW
    // =========================================

    const preview =
        document.getElementById("carouselPreview");


    // =========================================
    // ASEGURAR QUE EXISTE LA LISTA
    // =========================================

    if (!window.carouselPreviewItems) {

        window.carouselPreviewItems = [];

    }


    let agregados = 0;
    let repetidos = 0;


    // =========================================
    // RECORRER SELECCIONADOS
    // =========================================

    seleccionados.forEach(check => {

        const item =
            check.closest(".flex.items-center");


        if (!item) return;


        const slug =
            item.dataset.slug;

        const imagen =
            item.dataset.imagen;

        const tmdbId =
            item.dataset.tmdbid;


        if (!slug || !imagen) return;


        // =====================================
        // ID ÚNICO
        // =====================================

        const identificador =
            tmdbId ||
            slug;


        // =====================================
        // EVITAR DUPLICADOS
        // =====================================

        const existe =
            window.carouselPreviewItems.some(
                elemento =>
                    elemento.id === identificador
            );


        if (existe) {

            repetidos++;

            return;

        }


        // =====================================
        // GUARDAR ELEMENTO
        // =====================================

        window.carouselPreviewItems.push({

            id: identificador,

            slug: slug,

            imagen: imagen,

            carpeta: carpeta

        });


        agregados++;

    });


    // =========================================
    // ACTUALIZAR PREVIEW
    // =========================================

    renderizarPreview();


    // =========================================
    // MENSAJE
    // =========================================

    if (agregados > 0) {

        if (repetidos > 0) {

            alert(
                `${agregados} agregado(s). ` +
                `${repetidos} ya estaban en el preview.`
            );

        } else {

            alert(
                `${agregados} elemento(s) agregado(s) al preview.`
            );

        }

    } else {

        alert(
            "Los elementos seleccionados ya están en el preview."
        );

    }

}




// ======================================================
// MOSTRAR PREVIEW
// ======================================================


function renderizarPreview() {

    const preview =
        document.getElementById("carouselPreview");

    const contador =
        document.getElementById("previewContador");


    if (!preview) return;


    const formato =
        document.getElementById("carouselFormato").value;


    // =========================================
    // LIMPIAR
    // =========================================

    preview.innerHTML = "";


    // =========================================
    // CLASE DEL CARRUSEL
    // =========================================

    if (formato === "poster") {

        preview.className =
            "scroll-container";

    } else {

        preview.className =
            "horizontal-scroll-container";

    }


    // =========================================
    // MOSTRAR ELEMENTOS
    // =========================================

    window.carouselPreviewItems.forEach(
        (item, index) => {

            const a =
                document.createElement("a");


            a.href =
                `${item.carpeta}${item.slug}.html`;


            // =====================================
            // IMAGEN
            // =====================================

            const img =
                document.createElement("img");


            img.src =
                item.imagen;

            img.alt =
                item.slug;


            img.className =
                "lazy-img";


            // =====================================
            // BOTÓN ELIMINAR
            // =====================================

            const boton =
                document.createElement("button");


            boton.className =
                "preview-remove";


            boton.type =
                "button";


            boton.innerHTML =
                "×";


            boton.onclick =
                function(event) {

                    event.preventDefault();

                    event.stopPropagation();


                    window.carouselPreviewItems
                        .splice(index, 1);


                    renderizarPreview();

                };


            // =====================================
            // ARMAR TARJETA
            // =====================================

            a.appendChild(img);

            a.appendChild(boton);

            preview.appendChild(a);

        }
    );


    // =========================================
    // CONTADOR
    // =========================================

    if (contador) {

        const cantidad =
            window.carouselPreviewItems.length;


        contador.textContent =
            `${cantidad} elemento${cantidad === 1 ? "" : "s"}`;

    }

}




// ======================================================
// VACIAR PREVIEW
// ======================================================

function vaciarPreview() {

    if (previewItems.length === 0) {

        return;

    }


    previewItems = [];


    renderizarPreview();

}


// ======================================================
// SELECCIONAR TODO
// ======================================================

function seleccionarTodo() {

    document
        .querySelectorAll("#carouselResultados .carouselCheck")
        .forEach(check => {

            check.checked = true;

        });

}


// ======================================================
// DESELECCIONAR TODO
// ======================================================

function deseleccionarTodo() {

    document
        .querySelectorAll("#carouselResultados .carouselCheck")
        .forEach(check => {

            check.checked = false;

        });

}

async function generarCarrusel() {

    const tipo =
        document.getElementById("carouselTipo").value;


    const modo =
        document.getElementById("carouselModo").value;


    const busqueda =
        document.getElementById("carouselBusqueda").value.trim();


    let genero =
        document.getElementById("carouselGenero").value;


    const formato =
        document.getElementById("carouselFormato").value;


    const cantidad =
        parseInt(
            document.getElementById("carouselCantidad").value
        ) || 20;


    const carpeta =
        document.getElementById("carouselCarpeta").value;


    const contenedor =
        document.getElementById("carouselResultados");


    contenedor.innerHTML = `
        <div class="text-center p-6 text-slate-300">
            Buscando contenido...
        </div>
    `;


    // ==========================================
    // VALIDAR BÚSQUEDA
    // ==========================================

    if (modo === "search" && !busqueda) {

        contenedor.innerHTML = "";

        alert(
            "Escribe el nombre de una película o serie."
        );

        return;

    }


    // ==========================================
    // GÉNEROS SERIES
    // ==========================================

    if (tipo === "tv") {

        const generosTV = {

            "28": "10759",
            "12": "10759",
            "16": "16",
            "35": "35",
            "80": "80",
            "18": "18",
            "27": "9648",
            "878": "10765"

        };


        genero =
            generosTV[genero] || genero;

    }


    let resultados = [];


    // ==========================================
    // 🔎 BUSCAR POR NOMBRE
    // ==========================================

    if (modo === "search") {

        const url =
            `https://api.themoviedb.org/3/search/${tipo}` +
            `?api_key=${API_KEY}` +
            `&language=es-MX` +
            `&query=${encodeURIComponent(busqueda)}` +
            `&include_adult=false` +
            `&page=1`;


        try {

            const res =
                await fetch(url);


            if (!res.ok) {

                throw new Error(
                    "Error al consultar TMDB."
                );

            }


            const data =
                await res.json();


            resultados =
                data.results || [];


        } catch (error) {

            console.error(error);


            contenedor.innerHTML = `
                <div class="text-center p-6 text-red-400">
                    Error al buscar en TMDB.
                </div>
            `;

            return;

        }

    }


    // ==========================================
    // 🔀 MODO ALEATORIO
    // ==========================================

    else {

        let filtroColeccion = "";


        // ======================================
        // PELÍCULAS
        // ======================================

        if (tipo === "movie") {

            if (carpeta === "Marvel/") {

                filtroColeccion =
                    "&with_keywords=180547";

            }


            if (carpeta === "DC/") {

                filtroColeccion =
                    "&with_companies=9993";

            }


            if (carpeta === "Disney/") {

                filtroColeccion =
                    "&with_companies=2";

            }


            if (carpeta === "Harry-Potter/") {

                filtroColeccion =
                    "&with_keywords=818";

            }


            if (carpeta === "Star-Wars/") {

                filtroColeccion =
                    "&with_companies=1";

            }


            if (carpeta === "Anime/") {

                filtroColeccion =
                    "&with_original_language=ja";

            }


            if (carpeta === "Peliculas/") {

                filtroColeccion =
                    "&without_keywords=180547|849";

            }

        }


        // ======================================
        // SERIES
        // ======================================

        if (tipo === "tv") {

            if (carpeta === "Marvel/") {

                filtroColeccion =
                    "&with_companies=420";

            }


            if (carpeta === "DC/") {

                filtroColeccion =
                    "&with_networks=71|3186";

            }


            if (carpeta === "Disney/") {

                filtroColeccion =
                    "&with_networks=2739";

            }


            if (carpeta === "Star-Wars/") {

                filtroColeccion =
                    "&with_networks=2739";

            }


            if (carpeta === "Anime/") {

                filtroColeccion =
                    "&with_original_language=ja";

            }


            if (carpeta === "Doramas/") {

                filtroColeccion =
                    "&with_original_language=ko";

            }

        }


        // ======================================
        // PÁGINA ALEATORIA
        // ======================================

        const paginaAleatoria =
            Math.floor(Math.random() * 10) + 1;


        const url =
            `https://api.themoviedb.org/3/discover/${tipo}` +
            `?api_key=${API_KEY}` +
            `&language=es-MX` +
            `&sort_by=popularity.desc` +
            `&with_genres=${genero}` +
            `${filtroColeccion}` +
            `&page=${paginaAleatoria}`;


        try {

            const res =
                await fetch(url);


            if (!res.ok) {

                throw new Error(
                    "Error al consultar TMDB."
                );

            }


            const data =
                await res.json();


            resultados =
                data.results || [];


            // Mezclar
            resultados.sort(
                () => Math.random() - 0.5
            );


        } catch (error) {

            console.error(error);


            contenedor.innerHTML = `
                <div class="text-center p-6 text-red-400">
                    Error al obtener contenido de TMDB.
                </div>
            `;

            return;

        }

    }


    // ==========================================
    // FILTRAR IMÁGENES
    // ==========================================

    resultados =
        resultados.filter(item => {

            if (formato === "poster") {

                return !!item.poster_path;

            }


            return !!item.backdrop_path;

        });


    // ==========================================
    // CANTIDAD
    // ==========================================

    resultados =
        resultados.slice(0, cantidad);


    contenedor.innerHTML = "";


    // ==========================================
    // MOSTRAR RESULTADOS
    // ==========================================

    for (const item of resultados) {

    const titulo =
        item.title ||
        item.name ||
        "Sin título";

    const slug =
        generarSlug(titulo);

    let imagen = "";

    // =========================================
    // 🖼️ POSTER
    // =========================================

    if (formato === "poster") {

        if (!item.poster_path) continue;

        imagen =
            `https://image.tmdb.org/t/p/w500${item.poster_path}`;

    }

    // =========================================
    // 🎬 LANDSCAPE
    // Buscar backdrop con idioma
    // =========================================

    else {

        try {

            const imagesUrl =
                `https://api.themoviedb.org/3/${tipo}/${item.id}/images` +
                `?api_key=${API_KEY}`;

            const imagesRes =
                await fetch(imagesUrl);

            const imagesData =
                await imagesRes.json();

            const backdrops =
                imagesData.backdrops || [];


            // =====================================
            // PRIORIDAD DE IDIOMAS
            // 1. Español México
            // 2. Español
            // 3. Inglés
            // 4. Sin idioma
            // =====================================

            let backdrop =
                backdrops.find(img =>
                    img.iso_639_1 === "es-MX"
                );


            if (!backdrop) {

                backdrop =
                    backdrops.find(img =>
                        img.iso_639_1 === "es"
                    );

            }


            if (!backdrop) {

                backdrop =
                    backdrops.find(img =>
                        img.iso_639_1 === "en"
                    );

            }


            // =====================================
            // Si no existe con idioma,
            // permitir uno sin idioma
            // como último recurso
            // =====================================

            if (!backdrop) {

                backdrop =
                    backdrops.find(img =>
                        img.iso_639_1 === null
                    );

            }


            if (!backdrop) continue;


            imagen =
                `https://image.tmdb.org/t/p/original${backdrop.file_path}`;

        }

        catch (error) {

            console.warn(
                "No se pudieron obtener imágenes de:",
                titulo,
                error
            );

            continue;

        }

    }


    // =========================================
    // CREAR RESULTADO
    // =========================================

    const div =
        document.createElement("div");


    div.className =
        "flex items-center gap-3 bg-slate-900 p-2 rounded";


    div.dataset.slug = slug;
div.dataset.imagen = imagen;
div.dataset.tmdbid = item.id;


    div.innerHTML = `

        <input
            type="checkbox"
            class="carouselCheck"
            checked
        >

        <img
            src="${imagen}"
            class="w-16 rounded"
        >

        <div class="flex-1">

            <div class="font-semibold">
                ${escapeHTML(titulo)}
            </div>

            <div class="text-xs text-slate-400">
                ${carpeta}${slug}.html
            </div>

        </div>

    `;


    contenedor.appendChild(div);

}


    // ==========================================
    // SIN RESULTADOS
    // ==========================================

    if (!resultados.length) {

        contenedor.innerHTML = `

            <div class="text-center p-6 text-slate-400">

                No se encontraron resultados.

            </div>

        `;

    }

}



function copiarTexto() {
  const salida = document.getElementById('salida');
  if (!salida.value.trim()) {
    alert("No hay texto para copiar.");
    return;
  }
  salida.select();
  salida.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(salida.value).then(() => {
    alert("Texto copiado al portapapeles.");
  }).catch(() => {
    alert("Error al copiar. Usa Ctrl+C.");
  });
}

function seleccionarTodo(){

document.querySelectorAll(".carouselCheck").forEach(c=>{
c.checked=true;
});

}

function deseleccionarTodo(){

document.querySelectorAll(".carouselCheck").forEach(c=>{
c.checked=false;
});

}

function copiarCarrusel() {

    if (
        !window.carouselPreviewItems ||
        window.carouselPreviewItems.length === 0
    ) {

        alert(
            "Primero agrega elementos al preview."
        );

        return;

    }


    const formato =
        document.getElementById("carouselFormato").value;


    const tituloCarrusel =
        document.getElementById("carouselTitulo").value.trim()
        || "Nuevo Carrusel";


    const carpeta =
        document.getElementById("carouselCarpeta").value;


    let html = "";


    // ==========================================
    // ENCABEZADO
    // ==========================================

    if (formato === "poster") {

        html += `
<div class="movie-section">
  <h2>${escapeHTML(tituloCarrusel)}</h2>
  <div class="scroll-container">

`;

    } else {

        html += `
<div class="movie-section">
  <h2>${escapeHTML(tituloCarrusel)}</h2>
  <div class="horizontal-scroll-container">

`;

    }


    // ==========================================
    // ELEMENTOS DEL PREVIEW
    // ==========================================

    window.carouselPreviewItems.forEach(item => {


        if (formato === "poster") {

            html += `
    <a href="${carpeta}${item.slug}.html">
      <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='130' height='200'></svg>"
           data-src="${item.imagen}"
           class="lazy-img"
           alt="${escapeHTML(item.slug)}">
    </a>

`;

        } else {

            html += `
    <a href="${carpeta}${item.slug}.html">
      <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'></svg>"
           data-src="${item.imagen}"
           class="lazy-img"
           alt="${escapeHTML(item.slug)}">
    </a>

`;

        }

    });


    // ==========================================
    // CIERRE
    // ==========================================

    html += `
  </div>
</div>
`;


    // ==========================================
    // COPIAR
    // ==========================================

    navigator.clipboard.writeText(html)

        .then(() => {

            alert(
                `Carrusel copiado con ${window.carouselPreviewItems.length} elemento${window.carouselPreviewItems.length === 1 ? "" : "s"}.`
            );

        })

        .catch(() => {

            alert(
                "No se pudo copiar automáticamente. Usa Ctrl+C."
            );

        });

}


function vaciarPreview() {

    const preview = document.getElementById("carouselPreview");
    const contador = document.getElementById("previewContador");

    if (!preview) {
        console.error("No existe #carouselPreview");
        return;
    }

    // Vaciar visualmente el carrusel
    preview.innerHTML = "";

    // Reiniciar contador
    if (contador) {
        contador.textContent = "0 elementos";
    }

    // Reiniciar arreglo si tu sistema lo utiliza
    if (Array.isArray(window.previewItems)) {
        window.previewItems.length = 0;
    }

    // Reiniciar también cualquier colección global común
    if (Array.isArray(window.carouselPreviewItems)) {
        window.carouselPreviewItems.length = 0;
    }

    console.log("Preview vaciado correctamente");
}


// ======================================================
// GENERADOR TOP 10 TMDB
// ======================================================

let top10Items = [];
let top10ResultadosActuales = [];


// ======================================================
// GENERAR TOP 10
// ======================================================

async function generarTop10() {

    const tipo =
        document.getElementById("top10Tipo").value;

    const modo =
        document.getElementById("top10Modo").value;

    const busqueda =
        document.getElementById("top10Busqueda").value.trim();

    let genero =
        document.getElementById("top10Genero").value;

    const carpeta =
        document.getElementById("top10Carpeta").value;


    const contenedor =
        document.getElementById("top10Resultados");


    contenedor.innerHTML = `
        <div class="text-center p-6 text-slate-300">
            Buscando contenido...
        </div>
    `;


    // ==================================================
    // VALIDAR BÚSQUEDA
    // ==================================================

    if (modo === "search" && !busqueda) {

        contenedor.innerHTML = "";

        alert(
            "Escribe el nombre de una película o serie."
        );

        return;

    }


    // ==================================================
    // GÉNEROS PARA SERIES
    // ==================================================

    if (tipo === "tv") {

        const generosTV = {

            "28": "10759",
            "12": "10759",
            "16": "16",
            "35": "35",
            "80": "80",
            "18": "18",
            "27": "9648",
            "878": "10765"

        };

        genero =
            generosTV[genero] || genero;

    }


    let resultados = [];


    // ==================================================
    // BUSCAR POR NOMBRE
    // ==================================================

    if (modo === "search") {

        const url =
            `https://api.themoviedb.org/3/search/${tipo}` +
            `?api_key=${API_KEY}` +
            `&language=es-MX` +
            `&query=${encodeURIComponent(busqueda)}` +
            `&include_adult=false` +
            `&page=1`;


        try {

            const res =
                await fetch(url);


            if (!res.ok) {

                throw new Error(
                    "Error al consultar TMDB."
                );

            }


            const data =
                await res.json();


            resultados =
                data.results || [];


        } catch (error) {

            console.error(error);

            contenedor.innerHTML = `
                <div class="text-center p-6 text-red-400">
                    Error al buscar en TMDB.
                </div>
            `;

            return;

        }

    }


    // ==================================================
    // ALEATORIO
    // ==================================================

    else {

        let filtroColeccion = "";


        // ==============================================
        // PELÍCULAS
        // ==============================================

        if (tipo === "movie") {

            if (carpeta === "Marvel/") {

                filtroColeccion =
                    "&with_keywords=180547";

            }


            if (carpeta === "DC/") {

                filtroColeccion =
                    "&with_companies=9993";

            }


            if (carpeta === "Disney/") {

                filtroColeccion =
                    "&with_companies=2";

            }


            if (carpeta === "Harry-Potter/") {

                filtroColeccion =
                    "&with_keywords=818";

            }


            if (carpeta === "Star-Wars/") {

                filtroColeccion =
                    "&with_companies=1";

            }


            if (carpeta === "Anime/") {

                filtroColeccion =
                    "&with_original_language=ja";

            }


            if (carpeta === "Peliculas/") {

                filtroColeccion =
                    "&without_keywords=180547|849";

            }

        }


        // ==============================================
        // SERIES
        // ==============================================

        if (tipo === "tv") {

            if (carpeta === "Marvel/") {

                filtroColeccion =
                    "&with_companies=420";

            }


            if (carpeta === "DC/") {

                filtroColeccion =
                    "&with_networks=71|3186";

            }


            if (carpeta === "Disney/") {

                filtroColeccion =
                    "&with_networks=2739";

            }


            if (carpeta === "Star-Wars/") {

                filtroColeccion =
                    "&with_networks=2739";

            }


            if (carpeta === "Anime/") {

                filtroColeccion =
                    "&with_original_language=ja";

            }


            if (carpeta === "Doramas/") {

                filtroColeccion =
                    "&with_original_language=ko";

            }

        }


        // ==============================================
        // PÁGINA ALEATORIA
        // ==============================================

        const paginaAleatoria =
            Math.floor(Math.random() * 10) + 1;


        const url =
            `https://api.themoviedb.org/3/discover/${tipo}` +
            `?api_key=${API_KEY}` +
            `&language=es-MX` +
            `&sort_by=popularity.desc` +
            `&with_genres=${genero}` +
            `${filtroColeccion}` +
            `&page=${paginaAleatoria}`;


        try {

            const res =
                await fetch(url);


            if (!res.ok) {

                throw new Error(
                    "Error al consultar TMDB."
                );

            }


            const data =
                await res.json();


            resultados =
                data.results || [];


            resultados.sort(
                () => Math.random() - 0.5
            );


        } catch (error) {

            console.error(error);

            contenedor.innerHTML = `
                <div class="text-center p-6 text-red-400">
                    Error al obtener contenido de TMDB.
                </div>
            `;

            return;

        }

    }


    // ==================================================
    // SOLO CONTENIDO CON IMAGEN
    // ==================================================

    resultados =
        resultados.filter(item => {

            return !!(
                item.poster_path ||
                item.backdrop_path
            );

        });


    // ==================================================
    // TOP 10
    // ==================================================

    resultados =
        resultados.slice(0, 10);


    contenedor.innerHTML = "";


   // ==================================================
// GUARDAR RESULTADOS DE LA BÚSQUEDA ACTUAL
// ==================================================

top10ResultadosActuales = resultados;


    // ==================================================
// MOSTRAR RESULTADOS
// ==================================================

resultados.forEach((item, index) => {

    const titulo =
        item.title ||
        item.name ||
        "Sin título";


    const slug =
        generarSlug(titulo);


    const imagen =
        item.poster_path
            ? `https://image.tmdb.org/t/p/original${item.poster_path}`
            : `https://image.tmdb.org/t/p/original${item.backdrop_path}`;


    // ==============================================
    // EVITAR DUPLICADOS
    // ==============================================

    const yaSeleccionado =
        top10Items.some(existing =>
            String(existing.id) === String(item.id) &&
            existing.tipo === tipo
        );


    const div =
        document.createElement("div");


    div.className =
        "flex items-center gap-3 bg-slate-900 p-2 rounded";


    div.dataset.slug =
        slug;


    div.dataset.imagen =
        imagen;


    div.dataset.tmdbid =
        item.id;


    div.dataset.tipo =
        tipo;


    div.dataset.carpeta =
        carpeta;


    div.innerHTML = `

    <input
        type="checkbox"
        class="top10Check"
        ${yaSeleccionado ? "checked" : ""}
    >

    <span
        class="w-8 text-center font-bold text-xl">

        ${index + 1}

    </span>

        <img
            src="${imagen}"
            class="w-16 rounded"
            loading="lazy"
        >

        <div class="flex-1">

            <div class="font-semibold">
                ${escapeHTML(titulo)}
            </div>

            <div class="text-xs text-slate-400">
                ${carpeta}${slug}.html
            </div>

        </div>

    `;


    contenedor.appendChild(div);



});


renderizarTop10();

}

// ======================================================
// PREVIEW TOP 10
// ======================================================

function renderizarTop10() {

    const preview =
        document.getElementById("top10Preview");


    if (!preview) return;


    const titulo =
        document.getElementById("top10Titulo")
            .value
            .trim()
        || "TOP 10";


    const logo =
        document.getElementById("top10Logo")
            .value
            .trim();


    // ==================================================
    // PREVIEW VACÍO
    // ==================================================

    if (!top10Items.length) {

        preview.innerHTML = `

            <div class="top-10">

                <div class="top-header">

                    ${
                        logo
                        ? `
                            <img
                                src="${escapeHTML(logo)}"
                                class="top-logo"
                                alt="Top 10">
                          `
                        : ""
                    }

                    <h2>
                        ${escapeHTML(titulo)}
                    </h2>

                </div>


                <div class="scrollable">

                    <div class="text-slate-400 text-sm p-4">
                        Selecciona películas o series para agregarlas al preview.
                    </div>

                </div>

            </div>

        `;

        return;

    }


    // ==================================================
    // PREVIEW
    // ==================================================

    preview.innerHTML = `

        <div class="top-10">

            <!-- ========================================
                 CABECERA
            ========================================= -->

            <div class="top-header">

                ${
                    logo
                    ? `
                        <img
                            src="${escapeHTML(logo)}"
                            class="top-logo"
                            alt="Top 10">
                      `
                    : ""
                }

                <h2>
                    ${escapeHTML(titulo)}
                </h2>

            </div>


            <!-- ========================================
                 CARRUSEL
            ========================================= -->

            <div class="scrollable">

                ${top10Items.map((item, index) => `

                    <div class="card">

                        <span class="rank-number">
                            ${index + 1}
                        </span>

                        <a
                            href="${item.carpeta}${item.slug}.html"
                            onclick="return false;">

                            <img
                                src="${item.imagen}"
                                class="lazy-img"
                                loading="lazy"
                                alt="${escapeHTML(item.titulo)}">

                        </a>

                    </div>

                `).join("")}

            </div>

        </div>

    `;

}


// ======================================================
// SELECCIONAR TODO
// ======================================================

function seleccionarTodoTop10() {

    document
        .querySelectorAll(".top10Check")
        .forEach(check => {

            check.checked = true;

        });

}


// ======================================================
// DESELECCIONAR TODO
// ======================================================

function deseleccionarTodoTop10() {

    document
        .querySelectorAll(".top10Check")
        .forEach(check => {

            check.checked = false;

        });

}


// ======================================================
// COPIAR TOP 10
// ======================================================

function copiarTop10() {

    if (!top10Items.length) {

        alert(
            "Selecciona al menos un elemento."
        );

        return;

    }


    const titulo =
        document.getElementById("top10Titulo")
            .value
            .trim()
        || "TOP 10";


    const logo =
        document.getElementById("top10Logo")
            .value
            .trim();


    let html = `

<div class="container">

    <div class="top-10">

        <div class="top-header">

`;


    // ==================================================
    // LOGO
    // ==================================================

    if (logo) {

        html += `

            <img
                src="${escapeHTML(logo)}"
                class="top-logo"
                alt="Top 10">

`;

    }


    // ==================================================
    // TÍTULO
    // ==================================================

    html += `

            <h2>
                ${escapeHTML(titulo)}
            </h2>

        </div>


        <div class="scrollable">

`;


    // ==================================================
    // ELEMENTOS SELECCIONADOS
    // ==================================================

    top10Items.forEach((item, index) => {

        html += `

            <!-- ${index + 1} -->

            <div class="card">

                <span class="rank-number">
                    ${index + 1}
                </span>

                <a
                    href="${item.carpeta}${item.slug}.html">

                    <img
                        data-src="${item.imagen}"
                        class="lazy-img"
                        alt="${escapeHTML(item.titulo)}">

                </a>

            </div>

`;

    });


    // ==================================================
    // CIERRE
    // ==================================================

    html += `

        </div>

    </div>

</div>

`;


    navigator.clipboard.writeText(html)

        .then(() => {

            alert(
                `Top 10 copiado con ${top10Items.length} elementos.`
            );

        })

        .catch(() => {

            alert(
                "No se pudo copiar automáticamente. Usa Ctrl+C."
            );

        });

}

// ======================================================
// AGREGAR SELECCIONADOS AL PREVIEW TOP 10
// ======================================================

function agregarSeleccionadosTop10() {

    const seleccionados =
        document.querySelectorAll(
            "#top10Resultados .top10Check:checked"
        );


    if (!seleccionados.length) {

        alert(
            "Selecciona al menos una película o serie."
        );

        return;

    }


    // ==================================================
    // VERIFICAR ESPACIO DISPONIBLE
    // ==================================================

    const espaciosDisponibles =
        10 - top10Items.length;


    if (espaciosDisponibles <= 0) {

        alert(
            "El Preview TOP 10 ya tiene 10 elementos."
        );

        return;

    }


    let agregados = 0;
    let duplicados = 0;
    let limite = 0;


    seleccionados.forEach(check => {

        // ==============================================
        // SI YA LLEGAMOS A 10
        // ==============================================

        if (top10Items.length >= 10) {

            limite++;

            return;

        }


        const item =
            check.closest(".flex.items-center");


        if (!item) return;


        const id =
            item.dataset.tmdbid;


        const tipo =
            item.dataset.tipo;


        // ==============================================
        // EVITAR DUPLICADOS
        // ==============================================

        const existe =
            top10Items.some(existing =>
                String(existing.id) === String(id) &&
                existing.tipo === tipo
            );


        if (existe) {

            duplicados++;

            return;

        }


        // ==============================================
        // DATOS
        // ==============================================

        const titulo =
            item.querySelector(
                ".font-semibold"
            )?.textContent.trim()
            || "Sin título";


        const slug =
            item.dataset.slug;


        const imagen =
            item.dataset.imagen;


        const carpeta =
            item.dataset.carpeta;


        // ==============================================
        // AGREGAR AL TOP 10
        // ==============================================

        top10Items.push({

            id: id,

            tipo: tipo,

            slug: slug,

            titulo: titulo,

            imagen: imagen,

            carpeta: carpeta

        });


        agregados++;

    });


    // ==================================================
    // ACTUALIZAR PREVIEW
    // ==================================================

    renderizarTop10();


    // ==================================================
    // DESMARCAR LOS CHECKBOX AGREGADOS
    // ==================================================

    document
        .querySelectorAll(
            "#top10Resultados .top10Check"
        )
        .forEach(check => {

            check.checked = false;

        });


    // ==================================================
    // MENSAJE
    // ==================================================

    let mensaje =
        `Se agregaron ${agregados} elemento${agregados !== 1 ? "s" : ""} al Preview TOP 10.`;


    if (duplicados) {

        mensaje +=
            `\n\n${duplicados} ya estaba${duplicados !== 1 ? "n" : ""} en el preview.`;

    }


    if (limite) {

        mensaje +=
            `\n\n${limite} no se agregaron porque el TOP 10 ya está completo.`;

    }


    if (top10Items.length === 10) {

        mensaje +=
            "\n\n🎬 Preview TOP 10 completo.";

    }


    alert(mensaje);

}


// ======================================================
// ACTUALIZAR PREVIEW AL CAMBIAR TÍTULO / LOGO
// ======================================================

document
    .getElementById("top10Titulo")
    ?.addEventListener(
        "input",
        renderizarTop10
    );


document
    .getElementById("top10Logo")
    ?.addEventListener(
        "input",
        renderizarTop10
    );
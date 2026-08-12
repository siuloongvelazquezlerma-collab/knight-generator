/* ============================================================
   DIGITAL KNIGHT
   GENERADOR DE SWIPER TMDB
   ============================================================ */

const SWIPER_TMDB_API_KEY = '4b77886f6f12c73066c0d0509038df60';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const SWIPER_CONFIG = {

    peliculas: {
        tipo: 'movie',
        carpeta: 'Peliculas/'
    },

    series: {
        tipo: 'tv',
        carpeta: 'Series/'
    },

    anime: {
        tipo: 'movie',
        carpeta: 'Anime/'
    },

    doramas: {
        tipo: 'tv',
        carpeta: 'Doramas/'
    },

    infantil: {
        tipo: 'movie',
        carpeta: 'Infantil/'
    }

};


/* ============================================================
   UTILIDADES
   ============================================================ */

function swiperEscapeHTML(texto) {

    if (!texto) return '';

    return String(texto).replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[caracter]));

}


function swiperSlug(texto) {

    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

}


function swiperLimitarTexto(texto, limite = 220) {

    if (!texto) return '';

    texto = String(texto).trim();

    if (texto.length <= limite) return texto;

    return texto.substring(0, limite).trim() + '...';

}


/* ============================================================
   FETCH TMDB
   ============================================================ */

async function swiperTMDB(endpoint) {

    const separador = endpoint.includes('?') ? '&' : '?';

    const url =
        `${TMDB_BASE}${endpoint}${separador}` +
        `api_key=${encodeURIComponent(SWIPER_TMDB_API_KEY)}` +
        `&language=es-MX`;

    const respuesta = await fetch(url);

    if (!respuesta.ok) {

        let detalle = '';

        try {
            const error = await respuesta.json();
            detalle = error.status_message || '';
        } catch (_) {}

        throw new Error(
            `TMDB ${respuesta.status}${detalle ? ': ' + detalle : ''}`
        );

    }

    return await respuesta.json();

}


/* ============================================================
   IMÁGENES
   ============================================================ */

function swiperImagenPoster(path) {

    return path
        ? `${TMDB_IMG}/original${path}`
        : '';

}


function swiperImagenBackdrop(path) {

    return path
        ? `${TMDB_IMG}/original${path}`
        : '';

}


function swiperImagenLogo(path) {

    return path
        ? `${TMDB_IMG}/original${path}`
        : '';

}


/* ============================================================
   BUSCAR LOGO TMDB
   Prioridad:
   1. Español
   2. Sin idioma
   3. Inglés
   4. Cualquier otro idioma
   ============================================================ */

function swiperBuscarLogo(logos) {

    if (!Array.isArray(logos) || !logos.length) {
        return '';
    }

    /* --------------------------------------------------------
       ESPAÑOL
       -------------------------------------------------------- */

    const espanol = logos.find(logo =>
        logo?.iso_639_1 === 'es'
    );

    if (espanol?.file_path) {
        return swiperImagenLogo(espanol.file_path);
    }


    /* --------------------------------------------------------
       SIN IDIOMA
       -------------------------------------------------------- */

    const sinIdioma = logos.find(logo =>
        logo?.iso_639_1 === null
    );

    if (sinIdioma?.file_path) {
        return swiperImagenLogo(sinIdioma.file_path);
    }


    /* --------------------------------------------------------
       INGLÉS
       -------------------------------------------------------- */

    const ingles = logos.find(logo =>
        logo?.iso_639_1 === 'en'
    );

    if (ingles?.file_path) {
        return swiperImagenLogo(ingles.file_path);
    }


    /* --------------------------------------------------------
       CUALQUIER OTRO IDIOMA
       -------------------------------------------------------- */

    const cualquierIdioma = logos.find(logo =>
        logo?.file_path
    );

    if (cualquierIdioma?.file_path) {
        return swiperImagenLogo(
            cualquierIdioma.file_path
        );
    }


    return '';
}


/* ============================================================
   CLASIFICACIÓN
   ============================================================ */

function swiperClasificacion(certificacion) {

    if (!certificacion) {
        return 'NR';
    }

    const cert = String(certificacion).trim();

    if (/^AA$/i.test(cert)) return '7+';
    if (/^A$/i.test(cert)) return '7+';
    if (/^B$/i.test(cert)) return '13+';
    if (/^B15$/i.test(cert)) return '15+';
    if (/^C$/i.test(cert)) return '18+';
    if (/^D$/i.test(cert)) return '18+';

    if (/^\d+$/.test(cert)) {
        return `${cert}+`;
    }

    if (/PG-?13/i.test(cert)) return '13+';
    if (/R|NC-17|18/i.test(cert)) return '18+';
    if (/PG/i.test(cert)) return '10+';
    if (/G/i.test(cert)) return 'Todas las edades';

    return cert || 'NR';

}


/* ============================================================
   EDAD PELÍCULA
   ============================================================ */

async function swiperEdadPelicula(id) {

    try {

        const datos =
            await swiperTMDB(`/movie/${id}/release_dates`);

        const mx =
            datos.results?.find(
                x => x.iso_3166_1 === 'MX'
            );

        const us =
            datos.results?.find(
                x => x.iso_3166_1 === 'US'
            );

        const certificacion =
            mx?.release_dates?.find(x => x.certification)?.certification ||
            us?.release_dates?.find(x => x.certification)?.certification ||
            '';

        return swiperClasificacion(certificacion);

    } catch (_) {

        return 'NR';

    }

}


/* ============================================================
   EDAD SERIE
   ============================================================ */

async function swiperEdadSerie(id) {

    try {

        const datos =
            await swiperTMDB(`/tv/${id}/content_ratings`);

        const mx =
            datos.results?.find(
                x => x.iso_3166_1 === 'MX'
            );

        const us =
            datos.results?.find(
                x => x.iso_3166_1 === 'US'
            );

        const certificacion =
            mx?.rating ||
            us?.rating ||
            '';

        return swiperClasificacion(certificacion);

    } catch (_) {

        return 'NR';

    }

}


/* ============================================================
   GÉNEROS
   ============================================================ */

const SWIPER_GENEROS = {

    28: 'Acción',
    12: 'Aventura',
    16: 'Animación',
    35: 'Comedia',
    80: 'Crimen',
    99: 'Documental',
    18: 'Drama',
    10751: 'Familiar',
    14: 'Fantasía',
    36: 'Historia',
    27: 'Terror',
    10402: 'Música',
    9648: 'Misterio',
    10749: 'Romance',
    878: 'Ciencia ficción',
    10770: 'TV Movie',
    53: 'Suspenso',
    10752: 'Guerra',
    37: 'Western'

};


function swiperGeneros(ids) {

    if (!ids || !ids.length) {
        return '';
    }

    return ids
        .map(id => SWIPER_GENEROS[id])
        .filter(Boolean)
        .slice(0, 3)
        .join(', ');

}


/* ============================================================
   OBTENER DETALLE + IMÁGENES
   ============================================================ */

async function swiperObtenerContenido(item, tipo, carpeta) {

    const id = item.id;

    const detalle =
        await swiperTMDB(`/${tipo}/${id}`);

    /*
       IMPORTANTE:

       include_image_language permite recuperar
       logos aunque no estén en español.
    */

    const imagenes =
    await swiperTMDB(
        `/${tipo}/${id}/images?include_image_language=null`
    );


/* ============================================================
   SEGUNDO INTENTO PARA LOGOS
   Si TMDB no devolvió ningún logo, hacemos una consulta
   adicional sin limitar el idioma.
   ============================================================ */

if (
    !imagenes?.logos ||
    !imagenes.logos.length
) {

    try {

        const imagenesCompletas =
            await swiperTMDB(
                `/${tipo}/${id}/images`
            );

        if (
            imagenesCompletas?.logos?.length
        ) {

            imagenes.logos =
                imagenesCompletas.logos;

        }

    } catch (error) {

        console.warn(
            'No se pudieron recuperar logos adicionales:',
            id,
            error
        );

    }

}


    /* POSTER VERTICAL */

    /* ============================================================
   IMÁGENES LIMPIAS DE TMDB
   Solo imágenes sin idioma
   ============================================================ */

/*
   TMDB marca las imágenes sin idioma como:
   iso_639_1: null

   Las priorizamos para evitar posters/backdrops
   con títulos o textos localizados.
*/

const postersLimpios =
    (imagenes.posters || [])
        .filter(img => img.iso_639_1 === null)
        .sort((a, b) =>
            (b.vote_average || 0) - (a.vote_average || 0)
        );

const backdropsLimpios =
    (imagenes.backdrops || [])
        .filter(img => img.iso_639_1 === null)
        .sort((a, b) =>
            (b.vote_average || 0) - (a.vote_average || 0)
        );


/* POSTER VERTICAL */

const poster =
    swiperImagenPoster(
        postersLimpios[0]?.file_path ||
        ''
    );


/* BACKDROP HORIZONTAL */

const backdrop =
    swiperImagenBackdrop(
        backdropsLimpios[0]?.file_path ||
        ''
    );


    /* LOGO */

    const logo =
        swiperBuscarLogo(
            imagenes.logos
        );


    const titulo =
        detalle.title ||
        detalle.name ||
        item.title ||
        item.name ||
        'Sin título';


    const descripcion =
        swiperLimitarTexto(
            detalle.overview ||
            'Sin descripción disponible.',
            220
        );


    const anio =
        (
            detalle.release_date ||
            detalle.first_air_date ||
            ''
        ).substring(0, 4) || '¿?';


    const generos =
        swiperGeneros(
            detalle.genre_ids
        );


    let edad = 'NR';

    if (tipo === 'movie') {
        edad = await swiperEdadPelicula(id);
    } else {
        edad = await swiperEdadSerie(id);
    }


    let meta;


    if (tipo === 'movie') {

        meta =
            `Película · ${edad} · ${anio}` +
            (generos ? ` · ${generos}` : '');

    } else {

        const temporadas =
            detalle.number_of_seasons || 1;

        meta =
            `Serie · ${edad} · ${anio} · ` +
            `${temporadas} ${temporadas === 1 ? 'Temporada' : 'Temporadas'}` +
            (generos ? ` · ${generos}` : '');

    }


    const slug =
        swiperSlug(titulo);


    const archivo =
        `${carpeta}${slug}.html`;


    return {

        id,
        tipo,

        titulo,
        slug,
        archivo,

        poster,
        backdrop,
        logo,

        descripcion,
        meta,

        /*
           Clase automática.
           El CSS del usuario puede sobrescribirla
           si después quiere ajustes individuales.
        */

        logoClass:
            `logo-${slug}`

    };

}

/* ============================================================
   CREAR HTML DEL SLIDE
   Mantiene la estructura completa del Swiper original
============================================================ */

function swiperCrearSlide(datos) {

    const bg =
        datos.poster ||
        datos.backdrop ||
        '';

    const bgLand =
        datos.backdrop ||
        datos.poster ||
        '';


    /* ========================================================
       LOGO
    ======================================================== */

    const logoHTML = datos.logo
        ? `<img src="${swiperEscapeHTML(datos.logo)}" alt="${swiperEscapeHTML(datos.titulo)}" class="title-logo ${swiperEscapeHTML(datos.logoClass || '')}" draggable="false" oncontextmenu="return false">`
        : `<div class="swiper-title-fallback">${swiperEscapeHTML(datos.titulo)}</div>`;


    /* ========================================================
       TEXTO DEL BOTÓN
    ======================================================== */

    const textoBoton =
        datos.tipo === 'movie'
            ? 'Ir a la película'
            : 'Ir a la serie';


    /* ========================================================
       SLIDE
    ======================================================== */

    return `
<div class="swiper-slide" style="--bg: url('${swiperEscapeHTML(bg)}'); --bg-land: url('${swiperEscapeHTML(bgLand)}')">
  <a href="${swiperEscapeHTML(datos.archivo)}">
    <div class="slide-overlay-top"></div>
    <div class="overlay"></div>
    <div class="content">
      <div class="title">
        ${logoHTML}
      </div>
      <div class="meta">
        ${swiperEscapeHTML(datos.meta)}
      </div>
      <div class="description">
        ${swiperEscapeHTML(datos.descripcion)}
      </div>
      <div class="button-wrapper">
        <a href="${swiperEscapeHTML(datos.archivo)}" class="cta-button">${textoBoton}</a>
      </div>
    </div>
  </a>
</div>`.trim();
}

/* ============================================================
   ESTADO DEL GENERADOR
   ============================================================ */

let swiperPreviewItems = [];

let swiperPreviewTimer = null;

let swiperPreviewIndex = 0;

let swiperPreviewOrientation = 'portrait';


/* ============================================================
   OBTENER ELEMENTOS
   ============================================================ */

function swiperElement(id) {

    return document.getElementById(id);

}


/* ============================================================
   GENERAR SWIPER
   ============================================================ */

async function generarSwiper() {

    const resultados =
        swiperElement('swiperResultados');

    const seccion =
        swiperElement('swiperSeccion')?.value ||
        'peliculas';

    const modo =
        swiperElement('swiperModo')?.value ||
        'random';

    const cantidad =
        Math.max(
            1,
            Math.min(
                10,
                parseInt(
                    swiperElement('swiperCantidad')?.value || '6',
                    10
                )
            )
        );


    const busqueda =
        swiperElement('swiperBusqueda')?.value.trim() ||
        '';


    if (!resultados) {
        console.error(
            'No existe #swiperResultados'
        );
        return;
    }


    resultados.innerHTML = `
        <div class="p-5 text-center text-slate-400">
            ⏳ Consultando TMDB...
        </div>
    `;


    try {

        const config =
            SWIPER_CONFIG[seccion];


        let data;


        /* ====================================================
           BÚSQUEDA
           ==================================================== */

        if (modo === 'search') {

            if (!busqueda) {

                resultados.innerHTML = `
                    <div class="p-4 text-yellow-400">
                        Escribe un nombre para buscar.
                    </div>
                `;

                return;

            }


            data =
                await swiperTMDB(
                    `/search/${config.tipo}?query=${encodeURIComponent(busqueda)}`
                );

        }


        /* ====================================================
           ALEATORIO
           ==================================================== */

        else {

            /*
               Discover para obtener contenido.
               Cada categoría puede tener filtros propios.
            */

            let endpoint =
                `/discover/${config.tipo}?sort_by=popularity.desc&page=${Math.floor(Math.random() * 5) + 1}`;


            /*
               ANIME
            */

            if (seccion === 'anime') {

                endpoint +=
                    '&with_genres=16&with_original_language=ja';

            }


            /*
               INFANTIL
            */

            if (seccion === 'infantil') {

                endpoint +=
                    '&with_genres=10751';

            }


            /*
               DORAMAS
            */

            if (seccion === 'doramas') {

                endpoint +=
                    '&with_original_language=ko';

            }


            data =
                await swiperTMDB(endpoint);

        }


        if (!data?.results?.length) {

            resultados.innerHTML = `
                <div class="p-4 text-red-400">
                    No se encontraron resultados.
                </div>
            `;

            return;

        }


        /*
           Mezclamos los resultados en modo aleatorio.
        */

        let lista =
            [...data.results];


        if (modo === 'random') {

            lista.sort(
                () => Math.random() - 0.5
            );

        }


        lista =
            lista.slice(0, cantidad);


        resultados.innerHTML = `
            <div class="p-4 text-slate-400">
                ⏳ Preparando ${lista.length} elementos...
            </div>
        `;


        /*
           Obtener detalles e imágenes.
        */

        const contenidos = [];


        for (const item of lista) {

            try {

                const contenido =
                    await swiperObtenerContenido(
                        item,
                        config.tipo,
                        swiperCarpetaActual()
                    );


                /*
                   No agregamos contenido sin imágenes.
                */

                if (
                    contenido.poster ||
                    contenido.backdrop
                ) {

                    contenidos.push(
                        contenido
                    );

                }

            } catch (error) {

                console.warn(
                    'No se pudo preparar:',
                    item,
                    error
                );

            }

        }


        if (!contenidos.length) {

            resultados.innerHTML = `
                <div class="p-4 text-red-400">
                    TMDB no devolvió imágenes válidas.
                </div>
            `;

            return;

        }


        /*
           Mostrar resultados seleccionables.
        */

        resultados.innerHTML =
            contenidos
                .map((item, index) => {

                    return `
<div
    class="swiper-result-item flex gap-3 items-center p-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition">

    <input
        type="checkbox"
        class="swiper-check w-5 h-5"
        data-index="${index}">

    <img
        src="${swiperEscapeHTML(item.poster || item.backdrop)}"
        class="w-16 h-24 object-cover rounded-lg"
        loading="lazy">

    <div class="flex-1 min-w-0">

        <div class="font-semibold truncate">

            ${swiperEscapeHTML(item.titulo)}

        </div>

        <div class="text-xs text-slate-400 mt-1">

            ${swiperEscapeHTML(item.meta)}

        </div>

        <div class="text-xs text-green-400 mt-1">

            ${item.logo ? '✓ Logo TMDB' : '⚠ Sin logo TMDB'}

        </div>

    </div>

</div>`;

                })
                .join('');


        /*
           Guardar temporalmente.
        */

        window._swiperResultadosActuales =
            contenidos;


    } catch (error) {

        console.error(
            'ERROR SWIPER TMDB:',
            error
        );


        resultados.innerHTML = `
            <div class="p-4 rounded-lg bg-red-950 border border-red-800 text-red-300">

                <strong>Error al consultar TMDB.</strong>

                <div class="text-sm mt-2">
                    ${swiperEscapeHTML(error.message)}
                </div>

                <div class="text-xs mt-3 text-red-400">
                    Revisa la consola del navegador (F12)
                    si necesitas ver el detalle.
                </div>

            </div>
        `;

    }

}


/* ============================================================
   CARPETA
   ============================================================ */

function swiperCarpetaActual() {

    const select =
        swiperElement('swiperCarpeta');


    if (select?.value) {
        return select.value;
    }


    const seccion =
        swiperElement('swiperSeccion')?.value ||
        'peliculas';


    return SWIPER_CONFIG[seccion]?.carpeta ||
        'Peliculas/';

}


/* ============================================================
   SELECCIONAR TODO
   ============================================================ */

function seleccionarTodoSwiper() {

    document
        .querySelectorAll('#swiperResultados .swiper-check')
        .forEach(check => {

            check.checked = true;

        });

}


/* ============================================================
   DESELECCIONAR TODO
   ============================================================ */

function deseleccionarTodoSwiper() {

    document
        .querySelectorAll('#swiperResultados .swiper-check')
        .forEach(check => {

            check.checked = false;

        });

}


/* ============================================================
   AGREGAR AL PREVIEW
   ============================================================ */

function agregarSeleccionadosSwiper() {

    const resultados =
        window._swiperResultadosActuales || [];


    const checks =
        [...document.querySelectorAll(
            '#swiperResultados .swiper-check'
        )];


    const seleccionados =
        checks
            .filter(check => check.checked)
            .map(check =>
                resultados[
                    parseInt(check.dataset.index, 10)
                ]
            )
            .filter(Boolean);


    if (!seleccionados.length) {

        alert(
            'Selecciona al menos un elemento.'
        );

        return;

    }


    /*
       Evitar duplicados por ID.
    */

    seleccionados.forEach(item => {

        const existe =
            swiperPreviewItems.some(
                x =>
                    x.id === item.id &&
                    x.tipo === item.tipo
            );


        if (!existe) {

            swiperPreviewItems.push(item);

        }

    });


    swiperActualizarPreview();

}


/* ============================================================
   ACTUALIZAR PREVIEW
   ============================================================ */

function swiperActualizarPreview() {

    const preview =
        swiperElement('swiperPreview');


    if (!preview) return;


    const wrapper =
        preview.querySelector('.swiper-wrapper');


    if (!wrapper) return;


    wrapper.innerHTML =
        swiperPreviewItems
            .map(item =>
                swiperCrearSlide(item)
            )
            .join('\n');


    const contador =
        swiperElement('swiperPreviewContador');


    if (contador) {

        contador.textContent =
            `${swiperPreviewItems.length} elemento${swiperPreviewItems.length === 1 ? '' : 's'}`;

    }


    swiperIniciarPreview();


    swiperActualizarClaseOrientacion();

}


/* ============================================================
   VACIAR PREVIEW
   ============================================================ */

function vaciarSwiperPreview() {

    swiperPreviewItems = [];

    swiperPreviewIndex = 0;

    swiperActualizarPreview();

}


/* ============================================================
   ORIENTACIÓN PREVIEW
   ============================================================ */

function swiperCambiarOrientacion(modo) {

    if (
        modo !== 'portrait' &&
        modo !== 'landscape' &&
        modo !== 'desktop'
    ) {
        return;
    }

    swiperPreviewOrientation = modo;

    swiperActualizarClaseOrientacion();

}


function swiperActualizarClaseOrientacion() {

    const previewWrapper =
        swiperElement('swiperPreviewWrapper');

    if (!previewWrapper) return;


    /* Limpiar todos los modos */

    previewWrapper.classList.remove(
        'swiper-preview-portrait',
        'swiper-preview-landscape',
        'swiper-preview-desktop'
    );


    /* Aplicar modo actual */

    previewWrapper.classList.add(
        `swiper-preview-${swiperPreviewOrientation}`
    );


    /*
       Actualizar botones si existen.
    */

    document
        .querySelectorAll(
            '[data-swiper-view]'
        )
        .forEach(boton => {

            boton.classList.toggle(
                'active',
                boton.dataset.swiperView ===
                    swiperPreviewOrientation
            );

        });


    /*
       Compatibilidad con botones existentes
       aunque no tengan data-swiper-view.
    */

    const botones = document.querySelectorAll(
        '#swiperPreviewWrapper button, ' +
        '#swiperCambiarOrientacion, ' +
        '.swiper-view-button'
    );


    botones.forEach(boton => {

        const id =
            (boton.id || '').toLowerCase();

        const texto =
            (boton.textContent || '').toLowerCase();


        let modo = '';


        if (
            id.includes('portrait') ||
            id.includes('vertical') ||
            texto.includes('vertical')
        ) {
            modo = 'portrait';
        }


        if (
            id.includes('landscape') ||
            id.includes('horizontal') ||
            texto.includes('horizontal')
        ) {
            modo = 'landscape';
        }


        if (
            id.includes('desktop') ||
            id.includes('escritorio') ||
            texto.includes('escritorio')
        ) {
            modo = 'desktop';
        }


        if (modo) {

            boton.classList.toggle(
                'active',
                modo === swiperPreviewOrientation
            );

        }

    });


    /*
       Botón antiguo de cambio de orientación.
    */

    const boton =
        document.getElementById(
            'swiperCambiarOrientacion'
        );


    if (boton) {

        if (
            swiperPreviewOrientation ===
            'portrait'
        ) {

            boton.textContent =
                '📱 Ver horizontal';

        } else if (
            swiperPreviewOrientation ===
            'landscape'
        ) {

            boton.textContent =
                '🖥️ Ver escritorio';

        } else {

            boton.textContent =
                '📱 Ver vertical';

        }

    }

}


/* ============================================================
   AUTOPLAY PREVIEW
   ============================================================ */

function swiperIniciarPreview() {

    clearInterval(
        swiperPreviewTimer
    );


    const slides =
        document.querySelectorAll(
            '#swiperPreview .swiper-slide'
        );


    if (!slides.length) return;


    slides.forEach(
        slide =>
            slide.style.display = 'none'
    );


    swiperPreviewIndex = 0;


    slides[0].style.display =
        'block';


    if (slides.length <= 1) {
        return;
    }


    swiperPreviewTimer =
        setInterval(() => {

            slides[
                swiperPreviewIndex
            ].style.display = 'none';


            swiperPreviewIndex =
                (
                    swiperPreviewIndex + 1
                ) % slides.length;


            const siguiente =
                slides[swiperPreviewIndex];


            siguiente.style.display =
                'block';


        }, 3000);

}


/* ============================================================
   COPIAR SWIPER
   ============================================================ */

async function copiarSwiper() {

    if (!swiperPreviewItems.length) {

        alert(
            'Primero agrega elementos al Preview.'
        );

        return;

    }


    const titulo =
        swiperElement('swiperTitulo')?.value.trim() ||
        'Inicio';


   const html =
`<!-- Sección "${swiperEscapeHTML(titulo)}" -->
<div id="inicio" class="swiper mySwiper active-tab" style="display:block;">
  <div class="swiper-wrapper">

${swiperPreviewItems
    .map(item => swiperCrearSlide(item))
    .join('\n\n')}

</div>`;


    try {

        await navigator.clipboard.writeText(
            html
        );


        alert(
            '✅ Swiper copiado correctamente.'
        );


    } catch (error) {

        /*
           Fallback para navegadores
           que bloqueen clipboard.
        */

        const textarea =
            document.createElement('textarea');


        textarea.value = html;

        textarea.style.position =
            'fixed';

        textarea.style.opacity =
            '0';


        document.body.appendChild(
            textarea
        );


        textarea.select();

        document.execCommand(
            'copy'
        );


        textarea.remove();


        alert(
            '✅ Swiper copiado correctamente.'
        );

    }

}


/* ============================================================
   CSS DEL PREVIEW
   ============================================================ */

(function swiperAgregarEstilosPreview() {

    if (
        document.getElementById(
            'swiper-generator-preview-css'
        )
    ) {
        return;
    }


    const style =
        document.createElement('style');


    style.id =
        'swiper-generator-preview-css';


    style.textContent = `

/* ==========================================================
   CONTENEDOR PREVIEW
   ========================================================== */

#swiperPreviewWrapper {

    min-height: 700px;

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 30px;

    background:
        radial-gradient(
            circle at center,
            #182033 0%,
            #080b12 55%,
            #020307 100%
        );

}


/* ==========================================================
   PREVIEW BASE
   ========================================================== */

#swiperPreview {

    position: relative;

    overflow: hidden;

    background: #000;

    border-radius: 25px;

    box-shadow:
        0 20px 60px rgba(0,0,0,.7);

    transition:
        width .4s ease,
        height .4s ease,
        border-radius .4s ease;

}


/* ==========================================================
   CELULAR VERTICAL
   ========================================================== */

#swiperPreviewWrapper.swiper-preview-portrait
#swiperPreview {

    width: 390px;

    height: 700px;

    max-width: 90vw;

    max-height: 80vh;

}


/* ==========================================================
   HORIZONTAL
   ========================================================== */

#swiperPreviewWrapper.swiper-preview-landscape
#swiperPreview {

    width: 900px;

    height: 506px;

    max-width: 90vw;

    max-height: 75vh;

    border-radius: 18px;

}


/* ==========================================================
   SWIPER
   ========================================================== */

#swiperPreview .swiper-wrapper {

    width: 100%;

    height: 100%;

}


#swiperPreview .swiper-slide {

    width: 100%;

    height: 100%;

    position: relative;

    background-color: #000;

    background-image: var(--bg);

    background-size: cover;

    background-repeat: no-repeat;

    background-position: center center;

    overflow: hidden;

}


/* ==========================================================
   VERTICAL
   ========================================================== */

#swiperPreviewWrapper.swiper-preview-portrait
#swiperPreview .swiper-slide {

    background-image: var(--bg) !important;

    background-size: cover !important;

    background-position: center center !important;

}


/* ==========================================================
   HORIZONTAL
   ========================================================== */

#swiperPreviewWrapper.swiper-preview-landscape
#swiperPreview .swiper-slide {

    background-image: var(--bg-land) !important;

    background-size: cover !important;

    background-position: center center !important;

}


/* ==========================================================
   OVERLAY SUPERIOR
   ========================================================== */

#swiperPreview .slide-overlay-top {

    position: absolute;

    top: 0;

    left: 0;

    right: 0;

    height: 30%;

    background:
        linear-gradient(
            to bottom,
            #01011daf,
            #01011d98,
            #01011d85,
            rgba(0,0,0,.151),
            transparent
        );

    z-index: 3;

    pointer-events: none;

}


/* ==========================================================
   OVERLAY PRINCIPAL
   ========================================================== */

#swiperPreview .overlay {

    position: absolute;

    top: 0;

    left: 0;

    right: 0;

    bottom: 0;

    background:
        linear-gradient(
            to top,
            #01011d 0%,
            #01011d 15%,
            #01011d 25%,
            rgba(0,0,0,.95) 38%,
            rgba(0,0,0,.78) 55%,
            rgba(0,0,0,.20) 75%,
            transparent 100%
        );

    z-index: 2;

    pointer-events: none;

}


/* ==========================================================
   CONTENIDO
   ========================================================== */

#swiperPreview .content {

    position: absolute;

    z-index: 5;

    left: 0;

    right: 0;

    bottom: 0;

    padding: 30px;

}


/* ==========================================================
   LOGO
   ========================================================== */

#swiperPreview .title {

    display: flex;

    align-items: flex-end;

    justify-content: flex-start;

    min-height: 80px;

    margin-bottom: 10px;

}


#swiperPreview .title-logo {

    display: block;

    width: auto;

    height: 100px;

    max-width: 70%;

    object-fit: contain;

    object-position: left bottom;

    filter:
        drop-shadow(
            0 3px 5px rgba(0,0,0,.7)
        );

}


/* ==========================================================
   LOGOS MUY ANCHOS
   ========================================================== */

#swiperPreview .logo-spider-man-un-nuevo-dia,
#swiperPreview .logo-toy-story-5,
#swiperPreview .logo-mortal-kombat-ii {

    max-width: 72%;

}


/* ==========================================================
   LOGOS MÁS COMPACTOS
   ========================================================== */

#swiperPreview .logo-troya,
#swiperPreview .logo-michael {

    max-width: 65%;

}


/* ==========================================================
   FALLBACK
   ========================================================== */

#swiperPreview .swiper-title-fallback {

    font-size: 32px;

    font-weight: 800;

    color: white;

    text-shadow:
        0 3px 10px black;

}


/* ==========================================================
   META
   ========================================================== */

#swiperPreview .meta {

    color: white;

    font-size: 14px;

    font-weight: 600;

    margin-bottom: 10px;

    line-height: 1.5;

}


/* ==========================================================
   DESCRIPCIÓN
   ========================================================== */

#swiperPreview .description {

    color: rgba(255,255,255,.88);

    font-size: 14px;

    line-height: 1.45;

    max-width: 650px;

    margin-bottom: 15px;

}


/* ==========================================================
   BOTÓN
   ========================================================== */

#swiperPreview .button-wrapper {

    margin-top: 8px;

}


#swiperPreview .cta-button {

    display: inline-block;

    padding: 10px 18px;

    border-radius: 8px;

    background: white;

    color: #111;

    font-weight: 700;

    text-decoration: none;

}


/* ==========================================================
   HORIZONTAL
   ========================================================== */

#swiperPreviewWrapper.swiper-preview-landscape
#swiperPreview .content {

    padding: 35px 45px;

}


#swiperPreviewWrapper.swiper-preview-landscape
#swiperPreview .title-logo {

    height: 110px;

    max-width: 45%;

}


#swiperPreviewWrapper.swiper-preview-landscape
#swiperPreview .description {

    max-width: 600px;

}

/* ==========================================================
   ESCRITORIO
   ========================================================== */

#swiperPreviewWrapper.swiper-preview-desktop
#swiperPreview {

    width: 1200px;

    height: 675px;

    max-width: 95vw;

    max-height: 80vh;

    border-radius: 18px;

}


#swiperPreviewWrapper.swiper-preview-desktop
#swiperPreview .swiper-slide {

    background-image: var(--bg-land) !important;

    background-size: cover !important;

    background-position: center center !important;

}


#swiperPreviewWrapper.swiper-preview-desktop
#swiperPreview .content {

    padding: 45px 60px;

}


#swiperPreviewWrapper.swiper-preview-desktop
#swiperPreview .title-logo {

    height: 125px;

    max-width: 42%;

}


#swiperPreviewWrapper.swiper-preview-desktop
#swiperPreview .description {

    max-width: 700px;

    font-size: 15px;

}


/* ==========================================================
   VERTICAL
   ========================================================== */

#swiperPreviewWrapper.swiper-preview-portrait
#swiperPreview .content {

    padding: 22px;

}


#swiperPreviewWrapper.swiper-preview-portrait
#swiperPreview .title-logo {

    height: 90px;

    max-width: 78%;

}


#swiperPreviewWrapper.swiper-preview-portrait
#swiperPreview .description {

    font-size: 13px;

    max-height: 76px;

    overflow: hidden;

}


/* ==========================================================
   TRANSICIÓN
   ========================================================== */

#swiperPreview .swiper-slide {

    animation:
        swiperPreviewFade .65s ease;

}


@keyframes swiperPreviewFade {

    from {

        opacity: 0;

        transform: scale(1.015);

    }

    to {

        opacity: 1;

        transform: scale(1);

    }

}


/* ==========================================================
   MÓVIL
   ========================================================== */

@media(max-width:600px) {

    #swiperPreviewWrapper {

        padding: 15px;

        min-height: 600px;

    }


    #swiperPreviewWrapper.swiper-preview-portrait
    #swiperPreview {

        width: 320px;

        height: 570px;

    }


    #swiperPreviewWrapper.swiper-preview-landscape
    #swiperPreview {

        width: 95vw;

        height: 53.4vw;

    }


    #swiperPreview .content {

        padding: 18px;

    }


    #swiperPreview .title-logo {

        height: 75px;

        max-width: 80%;

    }


    #swiperPreview .description {

        font-size: 12px;

        max-height: 65px;

    }

}

`;

    document.head.appendChild(style);

})();


/* ============================================================
   CREAR BOTÓN ORIENTACIÓN AUTOMÁTICAMENTE
   ============================================================ */

(function swiperCrearBotonOrientacion() {

    const wrapper =
        document.getElementById(
            'swiperPreviewWrapper'
        );


    if (!wrapper) return;


    if (
        document.getElementById(
            'swiperCambiarOrientacion'
        )
    ) {
        return;
    }


    const contenedor =
        wrapper.parentElement;


    const boton =
        document.createElement('button');


    boton.id =
        'swiperCambiarOrientacion';


    boton.type =
        'button';


    boton.className =
        'mb-3 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-semibold';


    boton.textContent =
        '📱 Ver horizontal';


   boton.onclick = () => {

    if (swiperPreviewOrientation === 'portrait') {

        swiperCambiarOrientacion('landscape');

    } else if (swiperPreviewOrientation === 'landscape') {

        swiperCambiarOrientacion('desktop');

    } else {

        swiperCambiarOrientacion('portrait');

    }

};


    contenedor.insertBefore(
        boton,
        wrapper
    );


    swiperActualizarClaseOrientacion();

})();


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        swiperActualizarClaseOrientacion();

    }
);

/* ============================================================
   CONECTAR BOTONES DE VISTA
   ============================================================ */

function swiperConectarBotonesVista() {

    const botones =
        document.querySelectorAll(
            '[data-swiper-view]'
        );


    botones.forEach(boton => {

        const modo =
            boton.dataset.swiperView;


        if (
            modo !== 'portrait' &&
            modo !== 'landscape' &&
            modo !== 'desktop'
        ) {
            return;
        }


        boton.addEventListener(
            'click',
            () => {

                swiperCambiarOrientacion(
                    modo
                );

            }
        );

    });

}

document.addEventListener(
    'DOMContentLoaded',
    () => {

        swiperConectarBotonesVista();

    }
);
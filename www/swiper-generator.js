/* ============================================================
   DIGITAL KNIGHT
   GENERADOR DE SWIPER TMDB
   ============================================================ */

const SWIPER_TMDB_API_KEY = '4b77886f6f12c73066c0d0509038df60';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const SWIPER_PAGINAS_RECIENTES = {};

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const SWIPER_CONFIG = {

    /* =========================================================
       CARPETAS / TEMÁTICAS
       ========================================================= */

    'series/': {
        filtro: 'todas-series'
    },

    'peliculas/': {
        filtro: 'todas-peliculas'
    },

    'anime/': {
        filtro: 'anime'
    },

    'Doramas/': {
        filtro: 'doramas'
    },

    'mexicanas/': {
        filtro: 'mexicanas'
    },

    'Disney/': {
        filtro: 'disney'
    },

    'marvel/': {
        filtro: 'marvel'
    },

    'DC/': {
        filtro: 'dc'
    },

    'Star wars/': {
        filtro: 'starwars'
    },

    'Animacion/': {
        filtro: 'animacion'
    },

    'Harry potter/': {
        filtro: 'harry-potter'
    },

    'dragon ball/': {
        filtro: 'dragon-ball'
    },

    'Destino Final/': {
        filtro: 'destino-final'
    },

    'Bruce Lee/': {
        filtro: 'bruce-lee'
    },

    'Arma mortal/': {
        filtro: 'arma-mortal'
    },

    'karate kid/': {
        filtro: 'karate-kid'
    },

    'blade/': {
        filtro: 'blade'
    },

    'Blade/': {
        filtro: 'blade'
    },

    'rec-coleccion/': {
        filtro: 'rec-coleccion'
    },

    'twilight/': {
        filtro: 'twilight'
    },

    'volver al futuro/': {
        filtro: 'volver-al-futuro'
    },

    'Alien/': {
        filtro: 'alien'
    },

    'Anime/': {
        filtro: 'anime'
    },

    'Infantil/': {
        filtro: 'infantil'
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
   OBTENER MÚLTIPLES PÁGINAS DE TMDB
   Permite obtener cantidades superiores a 20 resultados.
   ============================================================ */

async function swiperTMDBMultiplesPaginas(endpointBase, cantidad) {

    const resultados = [];

    const porPagina = 20;

    const paginasNecesarias =
        Math.ceil(cantidad / porPagina);

    /*
       TMDB permite consultar muchas páginas.
       Ponemos un límite de seguridad bastante amplio.
    */

    const maxPaginas = Math.min(
        paginasNecesarias,
        25
    );


    for (let pagina = 1; pagina <= maxPaginas; pagina++) {

        const separador =
            endpointBase.includes('?')
                ? '&'
                : '?';

        const endpoint =
            `${endpointBase}${separador}page=${pagina}`;


        try {

            const data =
                await swiperTMDB(endpoint);


            if (
                !data?.results ||
                !data.results.length
            ) {
                break;
            }


            resultados.push(
                ...data.results
            );


            /*
               Si TMDB ya no tiene más páginas,
               terminamos.
            */

            if (
                !data.total_pages ||
                pagina >= data.total_pages
            ) {
                break;
            }


            /*
               Ya tenemos suficientes.
            */

            if (
                resultados.length >= cantidad
            ) {
                break;
            }

        } catch (error) {

            console.warn(
                `No se pudo obtener la página ${pagina}:`,
                error
            );

            break;

        }

    }


    return resultados.slice(
        0,
        cantidad
    );

}

/* ============================================================
   OBTENER CONTENIDO SEGÚN FILTRO + SECCIÓN
   ============================================================ */

async function swiperObtenerLista(filtro, cantidad, seccion) {

    /*
       ========================================================
       LA SECCIÓN DEFINE EL TIPO
       
       series   → tv
       peliculas → movie
       cualquier otra → mixed
       ========================================================
    */

    let tipos;

    if (seccion === 'series') {

        tipos = ['tv'];

    } else if (seccion === 'peliculas') {

        tipos = ['movie'];

    } else {

        tipos = ['movie', 'tv'];

    }


    /* ========================================================
       DISCOVER
       ======================================================== */

    async function obtenerDiscover(tipo, parametros = '') {

        const endpointBase =
            `/discover/${tipo}?sort_by=popularity.desc${parametros}`;

        /*
           TMDB devuelve los resultados paginados. Primero leemos
           el total de páginas y luego elegimos páginas al azar para
           que cada pulsación de "Generar" no repita la página 1.
        */
        const primeraPagina = await swiperTMDB(
            `${endpointBase}&page=1`
        );

        const totalPaginas = Math.max(
            1,
            Math.min(500, primeraPagina.total_pages || 1)
        );

        const paginasNecesarias = Math.min(
            totalPaginas,
            Math.max(1, Math.ceil(cantidad / 20))
        );

        const clavePaginas = `${tipo}|${parametros}`;
        const paginasPrevias = new Set(
            SWIPER_PAGINAS_RECIENTES[clavePaginas] || []
        );

        let paginasDisponibles = Array.from(
            { length: totalPaginas },
            (_, indice) => indice + 1
        ).filter(pagina => !paginasPrevias.has(pagina));

        /* Si ya se recorrió todo el catálogo disponible, reiniciamos. */
        if (paginasDisponibles.length < paginasNecesarias) {
            paginasDisponibles = Array.from(
                { length: totalPaginas },
                (_, indice) => indice + 1
            );
        }

        const paginas = paginasDisponibles
            .sort(() => Math.random() - 0.5)
            .slice(0, paginasNecesarias);

        SWIPER_PAGINAS_RECIENTES[clavePaginas] = paginas;

        const resultados = [];

        for (const pagina of paginas) {
            const data = pagina === 1
                ? primeraPagina
                : await swiperTMDB(`${endpointBase}&page=${pagina}`);

            resultados.push(...(data.results || []));
        }

        return resultados
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidad);

    }


    /* ========================================================
       TODAS LAS PELÍCULAS
       ======================================================== */

    if (filtro === 'todas-peliculas') {

        const lista =
            await obtenerDiscover('movie');

        return lista.map(item => ({
            ...item,
            _swiperTipo: 'movie'
        }));

    }


    /* ========================================================
       TODAS LAS SERIES
       ======================================================== */

    if (filtro === 'todas-series') {

        const lista =
            await obtenerDiscover('tv');

        return lista.map(item => ({
            ...item,
            _swiperTipo: 'tv'
        }));

    }


    /* ========================================================
       ANIME
       
       La carpeta dice anime.
       La sección decide si son películas o series.
       ======================================================== */

    if (filtro === 'anime') {

        const resultados = [];

        for (const tipo of tipos) {

            const lista =
                await obtenerDiscover(
                    tipo,
                    '&with_genres=16&with_original_language=ja'
                );

            resultados.push(
                ...lista.map(item => ({
                    ...item,
                    _swiperTipo: tipo
                }))
            );

        }

        return resultados
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidad);

    }


    /* ========================================================
       DORAMAS
       ======================================================== */

    if (filtro === 'doramas') {

        const resultados = [];

        for (const tipo of tipos) {

            const lista =
                await obtenerDiscover(
                    tipo,
                    '&with_original_language=ko'
                );

            resultados.push(
                ...lista.map(item => ({
                    ...item,
                    _swiperTipo: tipo
                }))
            );

        }

        return resultados
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidad);

    }


    /* ========================================================
       INFANTIL
       ======================================================== */

    if (filtro === 'infantil') {

        const resultados = [];

        for (const tipo of tipos) {

            const lista =
                await obtenerDiscover(
                    tipo,
                    '&with_genres=10751'
                );

            resultados.push(
                ...lista.map(item => ({
                    ...item,
                    _swiperTipo: tipo
                }))
            );

        }

        return resultados
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidad);

    }


    /* ========================================================
       ANIMACIÓN
       ======================================================== */

    if (filtro === 'animacion') {

        const resultados = [];

        for (const tipo of tipos) {

            const lista =
                await obtenerDiscover(
                    tipo,
                    '&with_genres=16'
                );

            resultados.push(
                ...lista.map(item => ({
                    ...item,
                    _swiperTipo: tipo
                }))
            );

        }

        return resultados
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidad);

    }


    /* ========================================================
       CATEGORÍAS ESPECIALES
       ======================================================== */

    const busquedasPorFiltro = {
        'harry-potter': 'Harry Potter',
        'dragon-ball': 'Dragon Ball',
        'destino-final': 'Final Destination',
        'bruce-lee': 'Bruce Lee',
        'arma-mortal': 'Lethal Weapon',
        'karate-kid': 'Karate Kid',
        blade: 'Blade',
        'rec-coleccion': '[REC]',
        twilight: 'Twilight',
        'volver-al-futuro': 'Back to the Future',
        alien: 'Alien',
        starwars: 'Star Wars'
    };

    const parametrosPorFiltro = {
        marvel: '&with_companies=420',
        dc: '&with_companies=9993',
        disney: '&with_companies=2',
        mexicanas: '&with_original_language=es&region=MX'
    };

    if (parametrosPorFiltro[filtro]) {
        const resultados = [];

        for (const tipo of tipos) {
            const lista = await obtenerDiscover(
                tipo,
                parametrosPorFiltro[filtro]
            );

            resultados.push(
                ...lista.map(item => ({ ...item, _swiperTipo: tipo }))
            );
        }

        return resultados
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidad);
    }

    if (busquedasPorFiltro[filtro]) {
        const resultados = [];

        for (const tipo of tipos) {
            const lista = await swiperTMDBMultiplesPaginas(
                `/search/${tipo}?query=${encodeURIComponent(busquedasPorFiltro[filtro])}`,
                cantidad
            );

            resultados.push(
                ...lista.map(item => ({ ...item, _swiperTipo: tipo }))
            );
        }

        return resultados
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidad);
    }


    /* ========================================================
       SI NO EXISTE EL FILTRO
       ======================================================== */

    console.warn(
        'Filtro Swiper no reconocido:',
        filtro
    );

    return [];

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

    /* ============================================================
   OBTENER IMÁGENES TMDB
   ============================================================ */

let imagenes = {
    posters: [],
    backdrops: [],
    logos: []
};

try {

    /*
       Pedimos español, inglés y también imágenes sin idioma.
       Esto evita perder posters/backdrops que TMDB marca
       como iso_639_1: null.
    */

    imagenes = await swiperTMDB(
        `/${tipo}/${id}/images?include_image_language=es,en,null`
    );

} catch (error) {

    console.warn(
        `No se pudieron obtener imágenes para ${tipo}/${id}:`,
        error
    );

}


/* ============================================================
   SEGUNDO INTENTO
   Si la primera consulta no devuelve imágenes,
   intentamos nuevamente sin filtro de idioma.
   ============================================================ */

if (
    !imagenes?.posters?.length &&
    !imagenes?.backdrops?.length
) {

    try {

        const imagenesCompletas =
            await swiperTMDB(
                `/${tipo}/${id}/images`
            );

        if (imagenesCompletas) {

            imagenes =
                imagenesCompletas;

        }

    } catch (error) {

        console.warn(
            `Segundo intento de imágenes falló para ${tipo}/${id}:`,
            error
        );

    }

}


/* ============================================================
   ASEGURAR ESTRUCTURA
   ============================================================ */

if (!Array.isArray(imagenes.posters)) {

    imagenes.posters = [];

}

if (!Array.isArray(imagenes.backdrops)) {

    imagenes.backdrops = [];

}

if (!Array.isArray(imagenes.logos)) {

    imagenes.logos = [];

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

/* ============================================================
   IMÁGENES TMDB
   Prioridad:
   1. Sin idioma
   2. Español
   3. Japonés
   4. Inglés
   5. Cualquier idioma
   ============================================================ */

function swiperOrdenarImagenes(imagenes) {

    if (!Array.isArray(imagenes)) {
        return [];
    }

    return [...imagenes].sort((a, b) => {

        function prioridad(img) {

            if (img?.iso_639_1 === null) return 1;
            if (img?.iso_639_1 === 'es') return 2;
            if (img?.iso_639_1 === 'ja') return 3;
            if (img?.iso_639_1 === 'en') return 4;

            return 5;
        }

        const prioridadA = prioridad(a);
        const prioridadB = prioridad(b);

        if (prioridadA !== prioridadB) {
            return prioridadA - prioridadB;
        }

        return (
            (b.vote_average || 0) -
            (a.vote_average || 0)
        );

    });

}


/* ============================================================
   POSTERS
   ============================================================ */

const postersOrdenados =
    swiperOrdenarImagenes(
        imagenes.posters
    );


/* ============================================================
   BACKDROPS
   ============================================================ */

const backdropsOrdenados =
    swiperOrdenarImagenes(
        imagenes.backdrops
    );


/* ============================================================
   POSTER VERTICAL
   ============================================================ */

const poster =
    swiperImagenPoster(
        postersOrdenados[0]?.file_path ||
        ''
    );


/* ============================================================
   BACKDROP HORIZONTAL
   ============================================================ */

const backdrop =
    swiperImagenBackdrop(
        backdropsOrdenados[0]?.file_path ||
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
   CONJUNTOS SWIPER
============================================================ */

let swiperConjuntos = {};

let swiperConjuntoActual = '';

const SWIPER_SECCIONES = [
    'inicio',
    'series',
    'peliculas',
    'hbo',
    'documentales',
    'mi_lista'
];

/* ============================================================
   CREAR CONJUNTO
============================================================ */

function swiperCrearConjunto(nombre) {

    if (!nombre) return;

    if (!swiperConjuntos[nombre]) {

        swiperConjuntos[nombre] = {};

        SWIPER_SECCIONES.forEach(seccion => {
            swiperConjuntos[nombre][seccion] = [];
        });

    }

    swiperConjuntoActual = nombre;

}


/* ============================================================
   NORMALIZAR NOMBRE DEL CONJUNTO
============================================================ */

function swiperNombreConjunto(nombre) {

    nombre = String(nombre || '').trim();

    if (!nombre) {
        return 'conjunto1';
    }

    return nombre
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9_-]/g, '');

}


/* ============================================================
   AGREGAR AL CONJUNTO ACTUAL
============================================================ */

function swiperAgregarAlConjunto(items) {

    if (!items || !items.length) return;

    if (!swiperConjuntoActual) {

        swiperCrearConjunto('conjunto1');

    }

    const conjunto =
        swiperConjuntos[swiperConjuntoActual];

    if (!conjunto) return;


    const seccion =
    swiperElement('swiperDestino')?.value ||
    'peliculas';


    if (!conjunto[seccion]) {

        conjunto[seccion] = [];

    }


    items.forEach(item => {

        const existe =
            conjunto[seccion].some(
                x =>
                    x.tipo === item.tipo &&
                    x.titulo === item.titulo
            );


        if (!existe) {

            conjunto[seccion].push({

                tipo: item.tipo,

                titulo: item.titulo,

                archivo: item.archivo,

                poster: item.poster,

                backdrop: item.backdrop,

                logo: item.logo,

                logoClass: item.logoClass,

                meta: item.meta,

                descripcion: item.descripcion

            });

        }

    });

}


/* ============================================================
   CREAR JSON FINAL
============================================================ */

function swiperObtenerJSON() {

    return JSON.stringify(
        swiperConjuntos,
        null,
        2
    );

}


/* ============================================================
   OBTENER ELEMENTOS
   ============================================================ */

function swiperElement(id) {

    return document.getElementById(id);

}

function swiperTiposParaSeccion(seccion) {
    if (seccion === 'series') return ['tv'];
    if (seccion === 'peliculas') return ['movie'];
    return ['movie', 'tv'];
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

        const carpeta =
    swiperCarpetaActual();

const config = {
    ...(SWIPER_CONFIG[carpeta] || {}),
    // La configuración actual usa filtros por carpeta; el tipo
    // se determina desde la sección para no construir rutas "undefined".
    tipo: swiperTiposParaSeccion(seccion)[0]
};

const filtro =
    config.filtro || '';

    const modo =
        swiperElement('swiperModo')?.value ||
        'random';

    const cantidad =
    Math.max(
        1,
        Math.min(
            500,
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

  
let lista = [];


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


    /* ====================================================
       ANIME
       Películas + Series
       ==================================================== */

    if (seccion === 'anime') {

        resultados.innerHTML = `
            <div class="p-5 text-center text-slate-400">
                ⏳ Buscando películas y series de anime...
            </div>
        `;


        const [peliculas, series] =
            await Promise.all([

                swiperTMDBMultiplesPaginas(
                    `/search/movie?query=${encodeURIComponent(busqueda)}`,
                    cantidad
                ),

                swiperTMDBMultiplesPaginas(
                    `/search/tv?query=${encodeURIComponent(busqueda)}`,
                    cantidad
                )

            ]);


        const peliculasAnime =
            peliculas
                .filter(item =>
                    item &&
                    Array.isArray(item.genre_ids) &&
                    item.genre_ids.includes(16)
                )
                .map(item => ({
                    ...item,
                    _swiperTipo: 'movie'
                }));


        const seriesAnime =
            series
                .filter(item =>
                    item &&
                    Array.isArray(item.genre_ids) &&
                    item.genre_ids.includes(16)
                )
                .map(item => ({
                    ...item,
                    _swiperTipo: 'tv'
                }));


        lista = [
            ...peliculasAnime,
            ...seriesAnime
        ];


        /*
           Mezclar películas y series
        */

        lista.sort(
            () => Math.random() - 0.5
        );


        lista =
            lista.slice(
                0,
                cantidad
            );


    } else {

        /* ====================================================
           BÚSQUEDA NORMAL
           ==================================================== */

        const tipos = swiperTiposParaSeccion(seccion);

        const listas = await Promise.all(
            tipos.map(async tipo => {
                const items = await swiperTMDBMultiplesPaginas(
                    `/search/${tipo}?query=${encodeURIComponent(busqueda)}`,
                    cantidad
                );

                return items.map(item => ({
                    ...item,
                    _swiperTipo: tipo
                }));
            })
        );

        lista = listas
            .flat()
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidad);

    }


} else {

    /* ====================================================
       ALEATORIO
       ==================================================== */

    const paginasNecesarias =
        Math.max(
            1,
            Math.ceil(cantidad / 20)
        );


    const maxPaginas =
        Math.min(
            paginasNecesarias,
            25
        );


    const paginas = [];


    const paginasDisponibles =
        Array.from(
            { length: 500 },
            (_, i) => i + 1
        );


    paginasDisponibles.sort(
        () => Math.random() - 0.5
    );


    const paginasSeleccionadas =
        paginasDisponibles.slice(
            0,
            maxPaginas
        );


    for (
        const pagina of paginasSeleccionadas
    ) {

        let endpoint =
            `/discover/${config.tipo}` +
            `?sort_by=popularity.desc` +
            `&page=${pagina}`;


        /* ====================================================
           ANIME
           ==================================================== */

        if (seccion === 'anime') {

            /*
               Anime puede ser película o serie.
               Aquí hacemos discover de películas y series
               por separado.
            */

            const endpointsAnime = [

                `/discover/movie` +
                `?sort_by=popularity.desc` +
                `&with_genres=16` +
                `&with_original_language=ja` +
                `&page=${pagina}`,

                `/discover/tv` +
                `?sort_by=popularity.desc` +
                `&with_genres=16` +
                `&with_original_language=ja` +
                `&page=${pagina}`

            ];


            for (
                const endpointAnime of endpointsAnime
            ) {

                try {

                    const dataAnime =
                        await swiperTMDB(
                            endpointAnime
                        );


                    if (
                        dataAnime?.results?.length
                    ) {

                        const tipoAnime =
                            endpointAnime.includes('/movie')
                                ? 'movie'
                                : 'tv';


                        paginas.push(
                            ...dataAnime.results.map(
                                item => ({
                                    ...item,
                                    _swiperTipo:
                                        tipoAnime
                                })
                            )
                        );

                    }

                } catch (error) {

                    console.warn(
                        'Error obteniendo anime:',
                        error
                    );

                }

            }


            if (
                paginas.length >= cantidad
            ) {
                break;
            }


            continue;

        }


        /* ====================================================
           FILTROS EXISTENTES
           ==================================================== */

        if (seccion === 'infantil') {

            endpoint +=
                '&with_genres=10751';

        }


        if (seccion === 'Doramas') {

            endpoint +=
                '&with_original_language=ko';

        }


        try {

            const dataPagina =
                await swiperTMDB(
                    endpoint
                );


            if (
                dataPagina?.results?.length
            ) {

                paginas.push(
                    ...dataPagina.results
                );

            }


            if (
                paginas.length >= cantidad
            ) {
                break;
            }

        } catch (error) {

            console.warn(
                `Error obteniendo página ${pagina}:`,
                error
            );

        }

    }


    lista = paginas;


    lista.sort(
        () => Math.random() - 0.5
    );


   const carpetaSeleccionada =
    swiperCarpetaActual();

const filtroCarpeta =
    SWIPER_CONFIG[carpetaSeleccionada]?.filtro || '';

if (!filtroCarpeta) {

    console.warn(
        'No existe filtro para la carpeta:',
        carpetaSeleccionada
    );

}

lista = await swiperObtenerLista(
    filtroCarpeta,
    cantidad,
    seccion
);

}


/* ====================================================
   ELIMINAR DUPLICADOS
   ==================================================== */

const vistos = new Set();

lista =
    lista.filter(item => {

        const tipoContenido =
    item._swiperTipo ||
    (
        seccion === 'series'
            ? 'tv'
            : 'movie'
    );


        const clave =
            `${tipoContenido}-${item.id}`;


        if (vistos.has(clave)) {
            return false;
        }


        vistos.add(clave);

        return true;

    });


lista =
    lista.slice(
        0,
        cantidad
    );


        if (!lista.length) {

            resultados.innerHTML = `
                <div class="p-4 text-yellow-400">
                    No se encontraron resultados para la categoría seleccionada.
                </div>
            `;

            return;

        }



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

           const tipoContenido =
    item._swiperTipo ||
    (
        seccion === 'series'
            ? 'tv'
            : 'movie'
    );


const contenido =
    await swiperObtenerContenido(
        item,
        tipoContenido,
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


    /*
       Si no hay carpeta seleccionada,
       usamos la carpeta correspondiente
       a la sección.
    */

    const seccion =
        swiperElement('swiperSeccion')?.value ||
        'peliculas';


    if (seccion === 'series') {

        return 'series/';

    }


    if (seccion === 'peliculas') {

        return 'peliculas/';

    }


    if (seccion === 'anime') {

        return 'anime/';

    }


    if (seccion === 'doramas') {

        return 'Doramas/';

    }


    if (seccion === 'infantil') {

        return 'Infantil/';

    }


    return 'peliculas/';

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
        [
            ...document.querySelectorAll(
                '#swiperResultados .swiper-check'
            )
        ];


    const seleccionados =
        checks
            .filter(check => check.checked)
            .map(check =>
                resultados[
                    parseInt(
                        check.dataset.index,
                        10
                    )
                ]
            )
            .filter(Boolean);


    if (!seleccionados.length) {

        alert(
            'Selecciona al menos un elemento.'
        );

        return;

    }


    /* ========================================================
       CONJUNTO
    ======================================================== */

    const titulo =
        swiperElement('swiperTitulo')
            ?.value.trim() ||
        'conjunto1';


    const nombreConjunto =
        swiperNombreConjunto(titulo);


    swiperCrearConjunto(
        nombreConjunto
    );


    /* ========================================================
       AGREGAR AL JSON
    ======================================================== */

    swiperAgregarAlConjunto(
        seleccionados
    );


    /* ========================================================
       PREVIEW
       SE MANTIENE EXACTAMENTE IGUAL
    ======================================================== */

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

/* ============================================================
   COPIAR JSON SWIPER
============================================================ */

async function copiarSwiper() {

    if (!Object.keys(swiperConjuntos).length) {

        alert(
            'Primero genera y agrega elementos a un conjunto.'
        );

        return;

    }


    const json =
        swiperObtenerJSON();


    /* ========================================================
       MÉTODO 1 — CLIPBOARD API
       ======================================================== */

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                json
            );

            alert(
                '✅ JSON de Swipers copiado correctamente.'
            );

            return;

        }

    } catch (error) {

        console.warn(
            'Clipboard API no disponible:',
            error
        );

    }


    /* ========================================================
       MÉTODO 2 — TEXTAREA
       ======================================================== */

    try {

        const textarea =
            document.createElement('textarea');


        textarea.value =
            json;


        textarea.setAttribute(
            'readonly',
            ''
        );


        textarea.style.position =
            'fixed';

        textarea.style.left =
            '-9999px';

        textarea.style.top =
            '0';

        textarea.style.width =
            '1px';

        textarea.style.height =
            '1px';

        textarea.style.opacity =
            '0';


        document.body.appendChild(
            textarea
        );


        textarea.focus();

        textarea.select();

        textarea.setSelectionRange(
            0,
            textarea.value.length
        );


        const copiado =
            document.execCommand('copy');


        textarea.remove();


        if (copiado) {

            alert(
                '✅ JSON de Swipers copiado correctamente.'
            );

            return;

        }

    } catch (error) {

        console.error(
            'Error copiando JSON:',
            error
        );

    }


    /* ========================================================
       SI TODO FALLÓ
       ======================================================== */

    alert(
        '⚠️ No se pudo copiar automáticamente. El JSON se abrirá para copiarlo manualmente.'
    );


    /* ========================================================
       ÚLTIMO RECURSO — MOSTRAR JSON
       ======================================================== */

    const ventana =
        window.open(
            '',
            '_blank',
            'width=900,height=700'
        );


    if (ventana) {

        ventana.document.write(`
            <html>
            <head>
                <title>JSON de Swipers</title>
                <style>
                    body {
                        background:#0b0f19;
                        color:#fff;
                        font-family:monospace;
                        padding:20px;
                    }

                    textarea {
                        width:100%;
                        height:90vh;
                        box-sizing:border-box;
                        background:#111827;
                        color:#e5e7eb;
                        border:1px solid #374151;
                        padding:15px;
                        font-family:monospace;
                        font-size:14px;
                    }
                </style>
            </head>
            <body>

                <textarea id="jsonCopiar"></textarea>

                <script>
                    document.getElementById('jsonCopiar').value =
                        ${JSON.stringify(json)};
                    
                    document.getElementById('jsonCopiar').select();
                <\/script>

            </body>
            </html>
        `);

        ventana.document.close();

    }

}

/* ============================================================
   GENERAR JSON DE CONJUNTOS
============================================================ */

async function generarJSONSwipers() {

    if (!Object.keys(swiperConjuntos).length) {

        alert(
            'Primero agrega elementos a algún conjunto.'
        );

        return;

    }


    const json =
        JSON.stringify(
            swiperConjuntos,
            null,
            2
        );


    try {

        await navigator.clipboard.writeText(json);

        alert(
            '✅ JSON de Swipers copiado correctamente.'
        );

    } catch (error) {

        const textarea =
            document.createElement('textarea');

        textarea.value = json;

        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand('copy');

        textarea.remove();

        alert(
            '✅ JSON de Swipers copiado correctamente.'
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

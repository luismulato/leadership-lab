/* Catálogo de Apps del Lab. Para sumar una app: agregar una entrada a APPS.
   estado: "disponible" | "pronto" · categoria: Equipos, Acuerdos, Aprendizaje, Emociones, Liderazgo, Dinámicas
   color: hex (ícono con trazo blanco, usar tonos medios/oscuros) · icono: nombre de ICONOS */
window.CATEGORIAS = ["Equipos", "Acuerdos", "Aprendizaje", "Emociones", "Liderazgo", "Dinámicas"];

/* Glifos 24x24, trazo sin relleno. */
window.ICONOS = {
  canvas: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 10v10"/>',
  ciclo: '<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v4h-4"/>',
  tableros: '<rect x="3" y="5" width="5" height="14" rx="1"/><rect x="9.5" y="5" width="5" height="9" rx="1"/><rect x="16" y="5" width="5" height="12" rx="1"/>',
  mercado: '<path d="M4 9l1-4h14l1 4"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 12v7h14v-7"/>',
  acuerdo: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
  brujula: '<circle cx="12" cy="12" r="8"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  corazon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  semilla: '<path d="M12 20v-8"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
  pregunta: '<path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.1-1.5 2.4"/><circle cx="12" cy="18" r=".8"/>',
  estrella: '<path d="M12 4l2.4 5 5.6.7-4.1 3.8 1.1 5.5L12 16.3 7 19l1.1-5.5L4 9.7 9.6 9z"/>',
  sillas: '<path d="M7 4v8h10M7 12v8M17 12v8M7 16h10"/>',
  pausa: '<circle cx="12" cy="12" r="8"/><path d="M10 9v6M14 9v6"/>',
  termometro: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/>',
  rayo: '<path d="M13 3L6 13h5l-1 8 7-10h-5z"/>',
  reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  retrato: '<circle cx="12" cy="9" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  cuadrantes: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16M4 12h16"/>',
  dialogo: '<path d="M4 6h11v8H9l-3 3v-3H4z"/><path d="M18 10h2v8l-3-3h-5v-1"/>',
  grilla: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>'
};

window.APPS = [
  {
    id: "team-canvas", nombre: "Team Canvas", subtitulo: "Un canvas para enamorar a tu equipo",
    estado: "disponible", url: "/team-canvas/", ejemplo: "/team-canvas/#ejemplo", categoria: "Equipos", dia: "Día 1",
    resumen: "El canvas del taller: nueve secciones para que el equipo converse, defina quién es y cómo quiere trabajar. Se abre con un código de equipo y las notas quedan compartidas, sin cuentas.",
    incluye: ["Guía para facilitar la conversación", "Nueve secciones con notas compartidas", "Código de equipo, sin cuentas", "Exportación a PDF"],
    color: "#B3264B", icono: "canvas"
  },
  {
    id: "retro-de-equipo", nombre: "Retro de Equipo", subtitulo: "Un ciclo de 90 días para mirar y mejorar",
    estado: "disponible", url: "/retro/", ejemplo: "/retro/#ejemplo", categoria: "Aprendizaje", dia: "Día 1",
    resumen: "Ciclo de 90 días: capturar datos, reflexionar, identificar desafíos y crear experimentos. Se mira Producto, Proceso y Equipo, y se cambia el formato de la retro en cada ciclo.",
    incluye: ["Guía de retros", "Canvas descargable (PDF)", "Simulador de retro compartido con código"],
    color: "#1F7A78", icono: "ciclo"
  },
  {
    id: "tres-tableros", nombre: "Tres tableros vivos", subtitulo: "Feedback, Insights y Parking lot en vivo",
    estado: "pronto", url: "", categoria: "Dinámicas", dia: "Día 1",
    resumen: "La retro en vivo durante un encuentro: tres tableros con notas firmadas. Sirve a cualquier facilitador de talleres y se abre con un código.",
    incluye: ["Feedback para ajustar hoy", "Insights para compartir hallazgos", "Parking lot para conversaciones pendientes"],
    color: "#3E7C59", icono: "tableros"
  },
  {
    id: "mercado-de-temas", nombre: "OpenSpace / Mercado de temas", subtitulo: "Agenda armada entre todos (Open Space)",
    estado: "disponible", url: "/openspace/", ejemplo: "/openspace/#ejemplo", categoria: "Dinámicas", dia: "Día 1",
    resumen: "Cada persona propone una sesión con título, nombre, lugar y hora; otras se anotan y quien convoca registra lo conversado. Reemplaza las tarjetas pegadas en la pared.",
    incluye: ["Propuesta y anotación a sesiones", "Registro de lo conversado", "Agenda por lugar y horario", "Cuatro principios y ley de los dos pies siempre visibles"],
    color: "#B0702A", icono: "mercado"
  },
  {
    id: "acuerdos-1-2-4-todos", nombre: "Acuerdos 1-2-4-Todos", subtitulo: "Construí acuerdos en cuatro pasos",
    estado: "pronto", url: "", categoria: "Acuerdos", dia: "Día 1",
    resumen: "Se empieza solo, se sigue en parejas, en grupos de 4 y con todos. Cada paso junta y agrupa lo anterior hasta tener acuerdos votables.",
    incluye: ["Cuatro pasos guiados", "Agrupación y votación", "Conexión con Información, Comunicación y Colaboración", "Revisión de acuerdos vivos cada ciclo"],
    color: "#7A5BA8", icono: "acuerdo"
  },
  {
    id: "delegation-poker", nombre: "Delegation Poker", subtitulo: "Hasta dónde puede decidir tu equipo",
    estado: "disponible", url: "/delegation/", ejemplo: "/delegation/#ejemplo", categoria: "Liderazgo", dia: "Día 2",
    resumen: "Versión web de Delegation Compass. Ayuda a conversar cuánto se delega y cuánto decide el equipo sin pasar por vos.",
    incluye: ["Las siete cartas", "Decisión actual y deseada con plazo", "Tablero por organización con código"],
    color: "#2F6F8F", icono: "brujula"
  },
  {
    id: "listado-de-emociones", nombre: "Brújula emocional", subtitulo: "Ponerle nombre a lo que sentís y a lo que necesitás",
    estado: "disponible", url: "/emociones/", ejemplo: "/emociones/#ejemplo", categoria: "Emociones", dia: "Día 2",
    resumen: "Parte del medidor emocional de cuatro cuadrantes (alta o baja energía, agradable o desagradable) y suma el listado de sentimientos. Elegís una palabra, ves qué necesidad suele haber detrás y guardás el registro del equipo.",
    incluye: ["Guía", "Medidor emocional de cuatro cuadrantes", "Canvas descargable", "Check-in del equipo con código"],
    color: "#C0503A", icono: "corazon"
  },
  {
    id: "listado-de-necesidades", nombre: "Listado de necesidades", subtitulo: "¿Qué intención hay detrás?",
    estado: "pronto", url: "", categoria: "Emociones", dia: "Día 2",
    resumen: "Necesidades humanas universales como conexión, autonomía, seguridad o sentido. Incluye el ejercicio de distinguir si lo que nombrás es una necesidad o una estrategia.",
    incluye: ["Once necesidades universales", "Pregunta guía sobre la intención", "Ejercicio ¿necesidad o estrategia?"],
    color: "#3E7C59", icono: "semilla"
  },
  {
    id: "preguntas-poderosas", nombre: "Preguntas poderosas", subtitulo: "Intervenir menos y mejor",
    estado: "pronto", url: "", categoria: "Liderazgo", dia: "Día 2",
    resumen: "Preguntar en lugar de intervenir. Un banco de preguntas abiertas, como \"¿Qué necesitás de mí ahora?\", al que cada equipo suma las suyas y las guarda.",
    incluye: ["Banco de preguntas abiertas", "Preguntas propias del equipo", "Guardado para reutilizar"],
    color: "#7A5BA8", icono: "pregunta"
  },
  {
    id: "mi-scarf", nombre: "Mi SCARF", subtitulo: "Las cinco dimensiones de David Rock",
    estado: "pronto", url: "", categoria: "Emociones", dia: "Día 2",
    resumen: "Estatus, Certeza, Autonomía, Relación y Justicia. Marcás la que más te mueve con un ejemplo de esta semana y lo conversás en parejas.",
    incluye: ["Las cinco dimensiones", "Ejemplo personal de la semana", "Guía para conversar en parejas"],
    color: "#B0702A", icono: "estrella"
  },
  {
    id: "cinco-sillas", nombre: "Cinco sillas", subtitulo: "Mirá una situación desde cinco lugares",
    estado: "pronto", url: "", categoria: "Aprendizaje", dia: "Día 2",
    resumen: "Una pantalla por silla: Roja (juicio), Amarilla (dudo de mí), Verde (observo), Azul (qué siento, qué necesito, qué pido) y Violeta (qué le pasa al otro). Al final, un resumen para la conversación en parejas.",
    incluye: ["Una pantalla por silla", "Resumen para llevar", "Guía para la conversación en parejas"],
    color: "#C0503A", icono: "sillas"
  },
  {
    id: "pausa-con-el-observador", nombre: "Pausa con el observador", subtitulo: "Cuatro pasos para cuando te alterás",
    estado: "pronto", url: "", categoria: "Emociones", dia: "Día 2",
    resumen: "Cuando notás reactividad: respirás, qué sentís, qué te decís y qué te decís que lo alimenta. Pensada para usar en el momento.",
    incluye: ["Cuatro pasos cortos", "Uso en el momento", "Registro opcional para ver patrones"],
    color: "#2F6F8F", icono: "pausa"
  },
  {
    id: "termometro-seguridad", nombre: "Termómetro de seguridad psicológica", subtitulo: "Las cuatro zonas de Timothy Clark",
    estado: "pronto", url: "", categoria: "Equipos", dia: "Día 2",
    resumen: "Cada persona marca dónde está su equipo en Inclusión, Aprendizaje, Contribución y Desafío, y se compara con el resultado del grupo.",
    incluye: ["Cuatro zonas de seguridad", "Comparación con el grupo", "Prácticas IN y OUT del equipo", "Conductas que promueven seguridad"],
    color: "#3E7C59", icono: "termometro"
  },
  {
    id: "conflicto-productivo", nombre: "Conflicto productivo", subtitulo: "Pasá de evitar a conversar",
    estado: "pronto", url: "", categoria: "Aprendizaje", dia: "Día 2",
    resumen: "Ubicate en la \"Y\": evitación, destructivo o productivo. Tres prácticas para pasar al productivo: indagá, nombralo, celebralo.",
    incluye: ["La \"Y\" del conflicto", "Indagá, nombralo, celebralo"],
    color: "#B3264B", icono: "rayo"
  },
  {
    id: "crea-tu-propia-app", nombre: "Crea tu propia app", subtitulo: "Siete casos, una práctica simple",
    estado: "pronto", url: "", categoria: "Aprendizaje", dia: "Día 2",
    resumen: "Cada equipo elige un caso (Buurtzorg, Haier, Michelin, Morning Star, Nucor, Southwest o Gore), lee cómo lo resuelve y diseña una práctica simple que otros puedan descargar.",
    incluye: ["Siete organizaciones en red", "Diseño de tarjeta, página o paso a paso", "Galería para publicar y descargar"],
    color: "#7A5BA8", icono: "grilla"
  },
  {
    id: "reloj-de-citas", nombre: "Reloj de citas", subtitulo: "Doce citas, una por hora",
    estado: "pronto", url: "", categoria: "Dinámicas", dia: "Día 1 y Día 2",
    resumen: "Agendás 12 citas con personas con las que querés hacer red. El facilitador anuncia una hora y cada persona ve con quién tiene cita y qué pregunta compartir.",
    incluye: ["Agenda de 12 citas", "Aviso de la hora por el facilitador", "Pregunta para compartir"],
    color: "#B0702A", icono: "reloj"
  },
  {
    id: "retratos-y-objetivo", nombre: "Retratos y objetivo de aprendizaje", subtitulo: "Conocernos y fijar tu objetivo",
    estado: "pronto", url: "", categoria: "Aprendizaje", dia: "Día 1",
    resumen: "Ronda de retratos (4 minutos, 4 rondas, con pregunta de regalo) y objetivo de aprendizaje personal que el grupo ve y retoma al cierre.",
    incluye: ["Ronda de retratos con pregunta de regalo", "Objetivo de aprendizaje personal", "Vista del grupo para retomar al cierre"],
    color: "#C0503A", icono: "retrato"
  },
  {
    id: "ficha-del-equipo", nombre: "Ficha del equipo", subtitulo: "Cuatro cuadrantes y Barrett",
    estado: "pronto", url: "", categoria: "Liderazgo", dia: "Día 1",
    resumen: "Preguntas \"¿dónde estoy yo?\" sobre los cuatro cuadrantes de Ken Wilber (Yo, Nosotros, Ello, Ellos) y la idea de Richard Barrett de que la cultura refleja la conciencia de sus líderes.",
    incluye: ["Cuestionario individual", "Cuatro cuadrantes de Wilber", "Resumen para llevar al equipo"],
    color: "#2F6F8F", icono: "cuadrantes"
  },
  {
    id: "feedback-1-a-1", nombre: "Feedback 1 a 1", subtitulo: "Hechos, no juicios; un pedido, no una exigencia",
    estado: "pronto", url: "", categoria: "Liderazgo", dia: "Día 2",
    resumen: "En duplas dentro del equipo: qué valoré de trabajar con vos y qué me hubiera gustado ver más. Una guía para preparar y registrar el feedback.",
    incluye: ["Guía para preparar", "Qué valoré y qué me hubiera gustado ver más", "Registro del feedback"],
    color: "#3E7C59", icono: "dialogo"
  }
];

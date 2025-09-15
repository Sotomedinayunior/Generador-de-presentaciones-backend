// config/page2.js
module.exports = {
  // Mapea lo que envías en "data" -> nombre REAL del campo en tu PDF (de /api/campos)
  fieldMap: {
    // Reemplaza estos tres valores con los nombres exactos que te devuelva /api/campos:
    TITULO:    'P2_TITULO',    // p. ej. 'P2_TITULO' o 'TITULO_PAG2' o 'TITULO_2'
    PARRAFO_1: 'P2_PARRAFO1',  // p. ej. 'P2_PARRAFO1' o 'DESC_1_PAG2'
    PARRAFO_2: 'P2_PARRAFO2'   // p. ej. 'P2_PARRAFO2' o 'DESC_2_PAG2'
  },

  // Cuadro para la imagen grande de la izquierda
  imageSlot: {
    page: 1,           // página 2 (0-based)
    x: 0,
    y: -8,
    widthPct: 0.15,    // ~62% del ancho de la página (ajústalo si tu layout cambia)
    heightPct: 1.0,    // 100% del alto
    origin: 'tl',      // coordenadas desde la esquina superior izquierda
    fit: 'cover'       // llena el cuadro recortando lo que sobre
  }
};

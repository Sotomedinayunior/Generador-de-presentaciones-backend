// config/page4.js
module.exports = {
  // sólo imagen
  imageSlot: {
    page: 3,          // página 4 (0-based)
    x: 60,            // margen izq (pt)
    y: 115,           // margen sup (pt) – zona del título grande
    widthPct: 0.90,   // ~87% del ancho de página
    heightPct: 0.50,  // alto relativo
    origin: 'center',     // medimos desde la esquina superior izq
    fit: 'cover'      // que llene el cuadro, recortando lo que sobre
  }
};

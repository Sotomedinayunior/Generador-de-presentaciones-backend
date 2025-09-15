// config/page1.js
module.exports = {
 agentBadgeSlot: {
  page: 0,
  x: 910,
  y: 0,            // más arriba: prueba 50, 40...
  width: 540,
  height:460,
  origin: 'tl',
  fit: 'contain'
},
  // Ajuste a los nombres REALES que viste en /api/campos
  fieldMap: {
    FECHA: 'FECHA',
    SALUDO_1: 'SALUDO_1',           // <- antes poníamos SALUDO_LINEA1
    SALUDO_2: 'SALUDO_LINEA2',
    TELEFONO: 'TELEFONO',
    EMAIL: 'EMAIL',
    // WEB: 'WEB'  // solo déjalo si realmente existe en tu PDF
  }
};

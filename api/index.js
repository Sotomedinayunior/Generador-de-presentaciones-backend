// server.js (al final)
const IS_VERCEL = !!process.env.VERCEL;

if (IS_VERCEL) {
  module.exports = app; // Vercel toma la app exportada
} else {
  app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
}
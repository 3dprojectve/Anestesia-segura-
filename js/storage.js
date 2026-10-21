// Registros guardados en el teléfono (localStorage).
// Para pasar a Firebase después, solo hay que reemplazar estas funciones.
window.Registros = (() => {
  const KEY = 'as_registros_v1';
  const SEQ = 'as_secuencia_v1';

  const leer = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  };
  const escribir = (lista) => {
    try { localStorage.setItem(KEY, JSON.stringify(lista)); } catch {}
  };

  return {
    todos: () => leer().sort((a, b) => b.creado - a.creado),
    guardar(reg) {
      const lista = leer().filter((r) => r.numero !== reg.numero);
      lista.push(reg);
      escribir(lista);
    },
    borrar(numero) { escribir(leer().filter((r) => r.numero !== numero)); },
    siguienteNumero() {
      let n = 1;
      try { n = (parseInt(localStorage.getItem(SEQ), 10) || 0) + 1; localStorage.setItem(SEQ, n); } catch {}
      return 'AS-' + String(n).padStart(4, '0');
    },
  };
})();

(() => {
  const C = window.CONFIG;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => window.CotizacionPDF.money(n);
  const num = (v) => parseFloat(v) || 0;

  let modo = 'peptidos';
  let planSel = 'completo';
  const extras = []; // exámenes agregados a mano

  // ---------- Precios recordados (el último que puso el doctor) ----------
  const PKEY = 'as_precios_v1';
  const precios = (() => { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch { return {}; } })();
  const recordar = (k, v) => { if (v > 0) { precios[k] = v; try { localStorage.setItem(PKEY, JSON.stringify(precios)); } catch {} } };

  // ---------- Tabs ----------
  document.querySelectorAll('.tab').forEach((t) =>
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
      document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + t.dataset.view));
      if (t.dataset.view === 'registros') pintarRegistros();
      window.scrollTo(0, 0);
    })
  );

  // ---------- Modo: péptidos / servicios ----------
  function ponerModo(m) {
    modo = m;
    document.body.dataset.modo = m;
    document.querySelectorAll('.modo-btn').forEach((b) => b.classList.toggle('active', b.dataset.modo === m));
    // Renumerar las tarjetas visibles
    let n = 0;
    document.querySelectorAll('#form .card').forEach((c) => {
      const badge = c.querySelector('.num');
      if (badge && c.offsetParent !== null) badge.textContent = ++n;
    });
    $('terminos-lista').innerHTML = terminos().map((t) => `<li>${esc(t)}</li>`).join('');
    calcular();
  }
  document.querySelectorAll('.modo-btn').forEach((b) => b.addEventListener('click', () => ponerModo(b.dataset.modo)));

  // ---------- Péptidos ----------
  $('medicamento').innerHTML = C.medicamentos
    .map((m) => `<option value="${m.id}">${esc(m.nombre)} — ${esc(m.presentacion)}</option>`).join('');
  const medActual = () => C.medicamentos.find((m) => m.id === $('medicamento').value);
  const precioFijo = () => medActual().precios[planSel] || 0;
  const clavePeptido = () => `med:${medActual().id}:${planSel}`;

  function pintarPlanes() {
    const med = medActual();
    $('planes').innerHTML = C.planes.map((p) => {
      const pr = med.precios[p.id];
      return `<label class="plan ${p.id === planSel ? 'sel' : ''}">
        <input type="radio" name="plan" value="${p.id}" ${p.id === planSel ? 'checked' : ''}/>
        <div><strong>${esc(p.nombre)}</strong><small>${esc(p.detalle)}</small></div>
        <span class="plan-precio ${pr ? '' : 'libre'}">${pr ? '$' + pr : 'Precio libre'}</span>
      </label>`;
    }).join('');
    $('planes').querySelectorAll('input').forEach((i) =>
      i.addEventListener('change', () => { planSel = i.value; pintarPlanes(); ponerPrecio(); })
    );
  }

  function ponerPrecio() {
    const fijo = precioFijo();
    $('modificar-precio').checked = false;
    $('modificar-wrap').classList.toggle('hidden', !fijo);
    if (fijo) {
      $('precio').value = fijo;
      $('precio').readOnly = true;
    } else {
      $('precio').value = precios[clavePeptido()] || '';
      $('precio').readOnly = false;
    }
    calcular();
  }

  $('modificar-precio').addEventListener('change', () => {
    const on = $('modificar-precio').checked;
    $('precio').readOnly = !on;
    if (on) { $('precio').focus(); $('precio').select(); }
    else { $('precio').value = precioFijo(); calcular(); }
  });
  $('medicamento').addEventListener('change', () => { pintarPlanes(); ponerPrecio(); });
  $('precio').addEventListener('input', calcular);
  $('cantidad').addEventListener('input', calcular);

  // ---------- Servicios de anestesia ----------
  const claveServ = (nombre) => 'serv:' + nombre;

  function pintarServicios() {
    const marcados = {};
    document.querySelectorAll('#servicios .serv').forEach((row) => {
      marcados[row.dataset.nombre] = {
        on: row.querySelector('.serv-check').checked,
        cant: row.querySelector('.serv-cant').value,
        precio: row.querySelector('.serv-precio').value,
      };
    });
    const lista = [...C.servicios.map((n) => ({ nombre: n })), ...extras.filter((e) => e.servicio)];
    $('servicios').innerHTML = lista.map((s) => {
      const prev = marcados[s.nombre];
      const on = prev ? prev.on : !!s.servicio;
      const precio = prev ? prev.precio : (s.precio || precios[claveServ(s.nombre)] || '');
      return `<div class="serv ${on ? 'on' : ''}" data-nombre="${esc(s.nombre)}">
        <label class="check"><input type="checkbox" class="serv-check" ${on ? 'checked' : ''}/><span>${esc(s.nombre)}</span></label>
        <div class="serv-campos">
          <label>Cant.<input type="number" class="serv-cant" min="1" value="${esc(prev ? prev.cant : 1)}" inputmode="numeric"/></label>
          <label>Precio (USD)<input type="number" class="serv-precio" min="0" step="0.01" value="${esc(precio)}" inputmode="decimal" placeholder="Escribe el precio"/></label>
        </div>
      </div>`;
    }).join('');
    calcular();
  }

  $('servicios').addEventListener('change', (e) => {
    if (e.target.classList.contains('serv-check')) {
      const row = e.target.closest('.serv');
      row.classList.toggle('on', e.target.checked);
      if (e.target.checked) row.querySelector('.serv-precio').focus();
    }
    calcular();
  });
  $('servicios').addEventListener('input', calcular);

  const agregarServicio = () => {
    const nombre = $('nuevo-serv').value.trim();
    if (!nombre) return;
    extras.push({ servicio: true, nombre, precio: num($('nuevo-serv-precio').value) || '' });
    $('nuevo-serv').value = ''; $('nuevo-serv-precio').value = '';
    pintarServicios();
  };
  $('agregar-serv').onclick = agregarServicio;
  $('nuevo-serv').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); agregarServicio(); } });

  const serviciosMarcados = () => [...document.querySelectorAll('#servicios .serv')]
    .filter((r) => r.querySelector('.serv-check').checked)
    .map((r) => ({
      descripcion: r.dataset.nombre,
      cantidad: Math.max(1, parseInt(r.querySelector('.serv-cant').value, 10) || 1),
      precio: num(r.querySelector('.serv-precio').value),
    }));

  // ---------- Total ----------
  function calcular() {
    let total = 0;
    if (modo === 'peptidos') {
      const precio = num($('precio').value);
      const cant = Math.max(1, parseInt($('cantidad').value, 10) || 1);
      $('precio-aviso').classList.toggle('hidden', precio > 0);
      total = precio * cant;
    } else {
      total = serviciosMarcados().reduce((s, it) => s + it.precio * it.cantidad, 0);
    }
    $('total').textContent = money(total);
    return total;
  }

  // ---------- Exámenes ----------
  function pintarExamenes(marcados) {
    const lista = [...C.examenes];
    if ($('fertil').checked && $('sexo').value === 'Femenino') lista.push(C.examenEmbarazo);
    lista.push(...extras.filter((e) => typeof e === 'string'));
    const prev = marcados || new Set([...document.querySelectorAll('#examenes input:not(:checked)')].map((i) => i.value));
    $('examenes').innerHTML = lista.map((e) => {
      const off = marcados ? !marcados.has(e) : prev.has(e);
      return `<label class="check"><input type="checkbox" value="${esc(e)}" ${off ? '' : 'checked'}/><span>${esc(e)}</span></label>`;
    }).join('');
  }

  $('sexo').addEventListener('change', () => {
    const fem = $('sexo').value === 'Femenino';
    $('fertil-wrap').classList.toggle('hidden', !fem);
    if (fem && !$('fertil').dataset.touched) {
      const edad = parseInt($('edad').value, 10);
      $('fertil').checked = !edad || (edad >= 12 && edad <= 50);
    }
    pintarExamenes();
  });
  $('fertil').addEventListener('change', () => { $('fertil').dataset.touched = '1'; pintarExamenes(); });
  $('marcar-todos').onclick = () => document.querySelectorAll('#examenes input').forEach((i) => (i.checked = true));
  $('desmarcar-todos').onclick = () => document.querySelectorAll('#examenes input').forEach((i) => (i.checked = false));
  const agregarExamen = () => {
    const v = $('nuevo-examen').value.trim();
    if (!v) return;
    extras.push(v);
    $('nuevo-examen').value = '';
    pintarExamenes();
  };
  $('agregar-examen').onclick = agregarExamen;
  $('nuevo-examen').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); agregarExamen(); } });

  // ---------- Pagos y términos ----------
  $('pagos').innerHTML = C.pagos.map((p) =>
    `<label class="check"><input type="checkbox" value="${esc(p.nombre)}" ${p.activo ? 'checked' : ''}/><span>${esc(p.nombre)}</span></label>`
  ).join('');
  const terminos = () => (modo === 'servicios' ? C.terminosServicios : C.terminos).map((t) => t.replace('{validez}', C.validezDias));

  // ---------- Cliente = paciente ----------
  $('mismo').addEventListener('change', () => {
    if ($('mismo').checked) $('paciente').value = $('cliente').value;
    $('paciente').readOnly = $('mismo').checked;
  });
  $('cliente').addEventListener('input', () => { if ($('mismo').checked) $('paciente').value = $('cliente').value; });

  // ---------- Armar cotización ----------
  function armar() {
    const cliente = $('cliente').value.trim();
    const paciente = $('paciente').value.trim();
    if (!cliente || !paciente) {
      toast('Escribe el nombre del cliente y del paciente');
      (!cliente ? $('cliente') : $('paciente')).focus();
      return null;
    }
    const base = {
      tipo: modo,
      fecha: new Date().toISOString(),
      creado: Date.now(),
      cliente, paciente,
      cedula: $('cedula').value.trim(),
      telefono: $('telefono').value.trim(),
      edad: $('edad').value.trim(),
      sexo: $('sexo').value,
      pagos: [...document.querySelectorAll('#pagos input:checked')].map((i) => i.value),
      notas: $('notas').value.trim(),
      terminos: terminos(),
    };

    if (modo === 'peptidos') {
      const precio = num($('precio').value);
      if (!precio) { toast('Escribe el precio'); $('precio').focus(); return null; }
      const cant = Math.max(1, parseInt($('cantidad').value, 10) || 1);
      const med = medActual();
      const plan = C.planes.find((p) => p.id === planSel);
      if (!precioFijo()) recordar(clavePeptido(), precio);
      return Object.assign(base, {
        medicamento: { nombre: med.nombre, presentacion: med.presentacion },
        plan: { id: plan.id, nombre: plan.nombre, detalle: plan.detalle, incluye: plan.incluye },
        items: [{ descripcion: `${med.nombre} — ${med.presentacion}\n${plan.nombre} (${plan.detalle})`, cantidad: cant, precio }],
        cantidad: cant, precio, total: precio * cant,
        examenes: [...document.querySelectorAll('#examenes input:checked')].map((i) => i.value),
      });
    }

    const items = serviciosMarcados();
    if (!items.length) { toast('Marca al menos un servicio'); return null; }
    const sinPrecio = items.find((it) => !it.precio);
    if (sinPrecio) { toast(`Falta el precio de: ${sinPrecio.descripcion}`); return null; }
    items.forEach((it) => recordar(claveServ(it.descripcion), it.precio));
    return Object.assign(base, {
      procedimiento: $('procedimiento').value.trim(),
      cirujano: $('cirujano').value.trim(),
      clinica: $('clinica').value.trim(),
      fechaCirugia: $('fecha-cx').value,
      items,
      total: items.reduce((s, it) => s + it.precio * it.cantidad, 0),
    });
  }

  function descargar(q) {
    window.CotizacionPDF.generar(q).save(window.CotizacionPDF.nombreArchivo(q));
  }

  async function compartir(q) {
    const doc = window.CotizacionPDF.generar(q);
    const nombre = window.CotizacionPDF.nombreArchivo(q);
    const file = new File([doc.output('blob')], nombre, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Cotización ' + q.numero }); } catch {}
    } else {
      doc.save(nombre);
      toast('Tu equipo no permite compartir directo: se descargó el PDF');
    }
  }

  const nueva = () => {
    const q = armar();
    if (!q) return null;
    q.numero = window.Registros.siguienteNumero();
    window.Registros.guardar(q);
    actualizarContador();
    return q;
  };

  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = nueva();
    if (q) { descargar(q); toast(`Cotización ${q.numero} guardada`); }
  });
  $('btn-compartir').addEventListener('click', () => {
    const q = nueva();
    if (q) compartir(q);
  });

  // ---------- Registros ----------
  function actualizarContador() { $('reg-count').textContent = window.Registros.todos().length; }

  const resumen = (r) => r.tipo === 'servicios'
    ? 'Servicios: ' + r.items.map((i) => i.descripcion.split(' (')[0]).join(', ')
    : `${r.medicamento.nombre} · ${r.plan.nombre}`;

  function pintarRegistros() {
    const f = $('buscar').value.trim().toLowerCase();
    const lista = window.Registros.todos().filter((r) =>
      !f || r.paciente.toLowerCase().includes(f) || r.cliente.toLowerCase().includes(f) || r.numero.toLowerCase().includes(f));
    $('lista-registros').innerHTML = lista.length ? lista.map((r) => `
      <div class="reg card">
        <div class="reg-top">
          <span class="reg-num">${esc(r.numero)} <span class="reg-tipo">${r.tipo === 'servicios' ? 'Anestesia' : 'GLP-1'}</span></span>
          <span class="reg-fecha">${new Date(r.fecha).toLocaleDateString('es-VE')}</span>
        </div>
        <strong>${esc(r.paciente)}</strong>
        <small>Cliente: ${esc(r.cliente)}${r.telefono ? ' · ' + esc(r.telefono) : ''}</small>
        <small>${esc(resumen(r))}</small>
        <div class="reg-bottom">
          <span class="reg-total">${money(r.total)}</span>
          <div>
            <button class="btn-sm ghost" data-a="borrar" data-n="${esc(r.numero)}">Borrar</button>
            <button class="btn-sm ghost" data-a="compartir" data-n="${esc(r.numero)}">Compartir</button>
            <button class="btn-sm" data-a="pdf" data-n="${esc(r.numero)}">PDF</button>
          </div>
        </div>
      </div>`).join('') : '<p class="vacio">No hay cotizaciones guardadas todavía.</p>';
  }
  $('buscar').addEventListener('input', pintarRegistros);
  $('lista-registros').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]');
    if (!b) return;
    const r = window.Registros.todos().find((x) => x.numero === b.dataset.n);
    if (!r) return;
    if (b.dataset.a === 'pdf') descargar(r);
    if (b.dataset.a === 'compartir') compartir(r);
    if (b.dataset.a === 'borrar' && confirm(`¿Borrar la cotización ${r.numero}?`)) {
      window.Registros.borrar(r.numero); actualizarContador(); pintarRegistros();
    }
  });

  // ---------- Utilidades ----------
  let tt;
  function toast(msg) {
    $('toast').textContent = msg;
    $('toast').classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => $('toast').classList.remove('show'), 2800);
  }

  // ---------- Inicio ----------
  pintarPlanes();
  ponerPrecio();
  pintarServicios();
  pintarExamenes(new Set(C.examenes));
  ponerModo('peptidos');
  actualizarContador();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

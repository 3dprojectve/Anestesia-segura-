// Todo lo que se cambia seguido (precios, exámenes, términos) está aquí.
window.CONFIG = {
  doctor: {
    nombre: 'Dr. Julio Barroso',
    titulo: 'Médico Anestesiólogo',
    telefono: '0424-3085996',
    marca: 'Anestesia Segura',
  },

  validezDias: 7,

  // Solo análogos GLP-1 aprobados para pérdida de peso.
  // Precio 0 = sin precio cargado todavía (se escribe a mano en la app).
  medicamentos: [
    {
      id: 'tirzepatida',
      nombre: 'Tirzepatida',
      presentacion: 'Ampolla 20 mg',
      precios: { ampolla: 160, completo: 260 },
    },
    {
      id: 'semaglutida',
      nombre: 'Semaglutida',
      presentacion: 'Ampolla',
      precios: { ampolla: 0, completo: 0 },
    },
    {
      id: 'liraglutida',
      nombre: 'Liraglutida',
      presentacion: 'Pluma',
      precios: { ampolla: 0, completo: 0 },
    },
  ],

  planes: [
    {
      id: 'ampolla',
      nombre: 'Solo la ampolla',
      detalle: 'Sin asesoría ni seguimiento',
      incluye: [],
    },
    {
      id: 'completo',
      nombre: 'Ampolla + tratamiento por 1 mes',
      detalle: 'Asesoría, seguimiento y administración semanal',
      incluye: [
        'Asesoría y seguimiento durante 1 mes',
        'Administración semanal del fármaco',
        'Historia clínica',
        'Toma de medidas antropométricas',
        'Sugerencias a seguir para un tratamiento seguro',
      ],
    },
  ],

  // Servicios de anestesiología. Sin precio fijo: el doctor escribe el precio
  // en cada cotización (la app recuerda el último que usó).
  servicios: [
    'Consulta preanestésica',
    'Bomba elastomérica (analgesia postoperatoria)',
    'Anestesia general',
    'Anestesia raquídea (subaracnoidea)',
    'Anestesia epidural',
    'Anestesia combinada (raquídea + epidural)',
    'Sedación / anestesia local asistida',
    'Bloqueo de nervio periférico guiado por ecografía',
    'Analgesia obstétrica (parto)',
    'Catéter epidural para analgesia postoperatoria',
    'Visita postanestésica',
  ],

  examenes: [
    'Hematología completa',
    'Glicemia',
    'Urea',
    'Creatinina',
    'TGO',
    'TGP',
    'Amilasa sérica',
    'Lipasa sérica',
    'Perfil tiroideo (TSH, T4 libre, anticuerpos Anti TPO y Antitiroglobulina)',
    'Insulina basal y posprandial',
    'Hemoglobina glicosilada A1C',
    'Perfil lipídico',
    'Ultrasonido abdominal',
  ],
  examenEmbarazo: 'Prueba de embarazo en sangre (cuantitativa)',

  pagos: [
    { id: 'efectivo', nombre: 'Efectivo (USD)', activo: true },
    { id: 'usdt', nombre: 'USDT', activo: true },
    { id: 'pagomovil', nombre: 'Pago móvil / transferencia (Bs. a tasa BCV del día)', activo: false },
    { id: 'zelle', nombre: 'Zelle', activo: false },
  ],

  terminos: [
    'Esta cotización tiene una validez de {validez} días a partir de su fecha de emisión. Los precios están expresados en dólares estadounidenses (USD) y pueden variar sin previo aviso una vez vencido dicho plazo.',
    'El inicio del tratamiento está sujeto a la evaluación médica y a la presentación de los exámenes de laboratorio e imagen indicados en este documento. El médico se reserva el derecho de no indicar o suspender el tratamiento si los resultados o la evaluación clínica lo contraindican.',
    'El paciente declara haber suministrado información veraz y completa sobre sus antecedentes médicos, alergias, medicamentos en uso, embarazo, lactancia o planificación de embarazo. El médico no se hace responsable por complicaciones derivadas de información omitida o falsa.',
    'Contraindicaciones: no se indica en pacientes con antecedente personal o familiar de carcinoma medular de tiroides, Síndrome de Neoplasia Endocrina Múltiple tipo 2 (MEN 2), pancreatitis, embarazo o lactancia, ni ante hipersensibilidad conocida al principio activo.',
    'El paciente reconoce haber sido informado de los posibles efectos adversos (náuseas, vómitos, diarrea, estreñimiento, dolor abdominal, hipoglicemia, entre otros) y de que los resultados en la pérdida de peso varían en cada persona, por lo que no se garantiza un resultado específico.',
    'En la modalidad "Solo la ampolla" no se incluye asesoría, seguimiento ni administración. La aplicación, dosificación y uso del medicamento quedan bajo exclusiva responsabilidad del paciente, quien exime al médico de toda responsabilidad derivada de su uso sin supervisión.',
    'El medicamento requiere cadena de frío (2 °C a 8 °C). Una vez entregado, su correcto almacenamiento, transporte y conservación son responsabilidad del paciente.',
    'Por tratarse de un producto farmacéutico que requiere refrigeración, no se aceptan devoluciones ni reembolsos una vez entregado el medicamento.',
    'El paciente se compromete a cumplir las indicaciones médicas, asistir a los controles programados y notificar de inmediato cualquier síntoma o efecto adverso. El incumplimiento libera al médico de responsabilidad sobre los resultados del tratamiento.',
    'Los datos personales y médicos del paciente serán tratados con estricta confidencialidad y usados únicamente con fines médicos.',
    'El pago confirma la aceptación de estos términos y condiciones y constituye consentimiento informado para el inicio del tratamiento.',
  ],

  // Términos para la cotización de servicios de anestesia.
  terminosServicios: [
    'Esta cotización tiene una validez de {validez} días a partir de su fecha de emisión. Los montos están expresados en dólares estadounidenses (USD) y pueden variar sin previo aviso una vez vencido dicho plazo.',
    'Los montos corresponden únicamente a los honorarios profesionales del médico anestesiólogo y a los ítems descritos. No incluyen gastos de clínica, quirófano, hospitalización, medicamentos, insumos, exámenes ni honorarios de otros profesionales, salvo que se indique expresamente.',
    'El presupuesto está calculado para el procedimiento indicado. Si durante la cirugía cambia la técnica anestésica, se prolonga el tiempo quirúrgico o surgen complicaciones que requieran cuidados adicionales, el monto podrá ajustarse.',
    'Es requisito indispensable la evaluación preanestésica, la presentación de los exámenes preoperatorios solicitados y el cumplimiento del ayuno indicado. El anestesiólogo podrá suspender o diferir el procedimiento si no se cumplen estas condiciones o si el estado clínico del paciente implica un riesgo no aceptable.',
    'El paciente declara haber suministrado información veraz y completa sobre sus antecedentes médicos, alergias, medicamentos en uso, hábitos y anestesias previas. El médico no se hace responsable por complicaciones derivadas de información omitida o falsa.',
    'Todo acto anestésico conlleva riesgos inherentes, incluso cuando se realiza de forma correcta. Estos riesgos serán explicados al paciente, quien deberá firmar el consentimiento informado de anestesia antes del procedimiento.',
    'La bomba elastomérica y demás dispositivos de analgesia entregados al paciente deben usarse según las indicaciones médicas. Su manipulación indebida es responsabilidad del paciente.',
    'Los honorarios deben cancelarse antes del procedimiento, salvo acuerdo previo por escrito. En caso de suspensión por causas ajenas al anestesiólogo, la consulta preanestésica realizada no es reembolsable.',
    'Los datos personales y médicos del paciente serán tratados con estricta confidencialidad y usados únicamente con fines médicos.',
    'El pago confirma la aceptación de estos términos y condiciones.',
  ],
};

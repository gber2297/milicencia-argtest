insert into public.categories (name, slug, description)
values
  ('Senales', 'senales', 'Senalizacion vial y su interpretacion'),
  ('Prioridad de paso', 'prioridad_de_paso', 'Normas de prioridad en cruces y situaciones especiales'),
  ('Velocidad', 'velocidad', 'Limites y criterios de velocidad segura'),
  ('Alcohol y sustancias', 'alcohol_y_sustancias', 'Efectos y normativa'),
  ('Documentacion', 'documentacion', 'Documentos obligatorios para circular'),
  ('Seguridad vial', 'seguridad_vial', 'Conduccion preventiva y segura'),
  ('Infracciones', 'infracciones', 'Faltas y sanciones comunes'),
  ('Estacionamiento', 'estacionamiento', 'Reglas para estacionar correctamente'),
  ('Luces', 'luces', 'Uso obligatorio de luces'),
  ('Generales', 'generales', 'Conceptos generales del examen')
on conflict (slug) do nothing;

create or replace function public.seed_question(
  p_question text,
  p_explanation text,
  p_category_slug text,
  p_difficulty text,
  p_o1 text,
  p_o2 text,
  p_o3 text,
  p_o4 text,
  p_correct integer
) returns void as $$
declare
  v_question_id uuid;
  v_category_id uuid;
begin
  select id into v_category_id from public.categories where slug = p_category_slug;
  select id into v_question_id
  from public.questions
  where question_text = p_question
  limit 1;

  if v_question_id is not null then
    return;
  end if;

  insert into public.questions(question_text, explanation, category_id, difficulty, is_active)
  values (p_question, p_explanation, v_category_id, p_difficulty, true)
  returning id into v_question_id;

  insert into public.question_options(question_id, option_text, is_correct) values
  (v_question_id, p_o1, p_correct = 1),
  (v_question_id, p_o2, p_correct = 2),
  (v_question_id, p_o3, p_correct = 3),
  (v_question_id, p_o4, p_correct = 4);
end;
$$ language plpgsql;

do $$
begin
  perform public.seed_question('Al acercarte a una senal de "PARE", que debes hacer?', 'Debes detener por completo la marcha antes de la linea de detencion o la bocacalle.', 'senales', 'easy', 'Reducir y continuar si no viene nadie', 'Detener totalmente y ceder el paso', 'Tocar bocina y avanzar', 'Solo frenar si hay peatones', 2);
  perform public.seed_question('Que indica una senal triangular con borde rojo?', 'Las senales triangulares con borde rojo advierten peligro.', 'senales', 'easy', 'Obligacion', 'Prohibicion absoluta', 'Prevencion o peligro', 'Informacion turistica', 3);
  perform public.seed_question('En una rotonda, quien tiene prioridad?', 'La prioridad corresponde a quien ya circula dentro de la rotonda.', 'prioridad_de_paso', 'medium', 'El que ingresa por la derecha', 'El que circula dentro de la rotonda', 'El vehiculo mas grande', 'El que llega primero', 2);
  perform public.seed_question('En una esquina sin senalizacion, quien tiene prioridad?', 'En general, tiene prioridad el vehiculo que viene por la derecha.', 'prioridad_de_paso', 'easy', 'El vehiculo de la izquierda', 'El que toca bocina', 'El que viene por la derecha', 'El que circula mas rapido', 3);
  perform public.seed_question('Cual es la velocidad maxima general en calles urbanas, salvo senalizacion?', 'La norma general urbana para calles es 40 km/h, salvo excepciones locales.', 'velocidad', 'easy', '20 km/h', '40 km/h', '60 km/h', '80 km/h', 2);
  perform public.seed_question('Por que debes adaptar tu velocidad aunque no superes el maximo?', 'La velocidad debe ser segura segun clima, visibilidad y estado del camino.', 'velocidad', 'medium', 'Para ahorrar combustible', 'Porque la ley exige velocidad segura segun contexto', 'Solo para evitar multas', 'No es necesario adaptarla', 2);
  perform public.seed_question('Conducir bajo efectos del alcohol produce:', 'Afecta reflejos, percepcion y tiempo de reaccion, aumentando riesgo de siniestro.', 'alcohol_y_sustancias', 'easy', 'Mejor concentracion', 'Mas reflejos', 'Disminucion de capacidad de reaccion', 'Ningun cambio', 3);
  perform public.seed_question('Si consumiste alcohol, la opcion mas segura es:', 'La conduccion segura exige no manejar bajo efectos de alcohol o drogas.', 'alcohol_y_sustancias', 'easy', 'Tomar cafe y conducir', 'Esperar 10 minutos y conducir', 'No conducir y buscar alternativa', 'Conducir solo distancias cortas', 3);
  perform public.seed_question('Que documentacion minima debes llevar al conducir?', 'Debes llevar licencia habilitante, cedula, seguro y comprobantes requeridos.', 'documentacion', 'easy', 'Solo DNI', 'Licencia, cedula y seguro vigente', 'Solo licencia', 'Cedula y VTV unicamente', 2);
  perform public.seed_question('Si no presentas seguro vigente en un control, que puede pasar?', 'Es una falta y puede derivar en sanciones y retencion segun normativa local.', 'documentacion', 'medium', 'No pasa nada', 'Solo advertencia verbal', 'Se considera infraccion sancionable', 'Se renueva automaticamente', 3);
  perform public.seed_question('Que distancia de seguimiento es recomendable en condiciones normales?', 'Mantener distancia permite reaccionar ante frenadas inesperadas.', 'seguridad_vial', 'medium', 'La menor posible', 'Al menos 2 segundos respecto al vehiculo de adelante', 'Solo medio auto', 'Depende solo de la bocina', 2);
  perform public.seed_question('Que debes hacer antes de cambiar de carril?', 'Debes senalizar, verificar espejos y punto ciego antes de maniobrar.', 'seguridad_vial', 'easy', 'Cambiar rapidamente', 'Solo mirar espejo central', 'Senalizar y verificar espejos y punto ciego', 'Acelerar fuerte y cambiar', 3);
  perform public.seed_question('Estacionar en doble fila esta permitido?', 'La doble fila obstruye el transito y constituye una infraccion.', 'infracciones', 'easy', 'Si, con balizas', 'Solo de noche', 'No, esta prohibido', 'Si es por menos de 5 minutos', 3);
  perform public.seed_question('Cruzar un semaforo en rojo implica:', 'Es una falta grave por alto riesgo para terceros.', 'infracciones', 'easy', 'Una falta leve', 'Ninguna infraccion si no hay trafico', 'Una infraccion grave', 'Solo multa economica menor', 3);
  perform public.seed_question('Donde esta prohibido estacionar?', 'No se puede estacionar en lugares que afecten seguridad o circulacion.', 'estacionamiento', 'medium', 'A 10 metros de una esquina', 'En zonas habilitadas', 'Solo en playas privadas', 'En cualquier calle de noche', 1);
  perform public.seed_question('Al estacionar en pendiente descendente, las ruedas deben:', 'Orientar ruedas hacia el cordon reduce riesgo de desplazamiento.', 'estacionamiento', 'hard', 'Quedar rectas', 'Apuntar hacia el cordon', 'Apuntar al centro de la calle', 'No importa su posicion', 2);
  perform public.seed_question('En rutas nacionales durante el dia, el uso de luces bajas es:', 'En Argentina, el uso de luces bajas en ruta es obligatorio aun de dia.', 'luces', 'easy', 'Opcional', 'Obligatorio', 'Solo en lluvia', 'Solo para motos', 2);
  perform public.seed_question('Las balizas se usan principalmente para:', 'Las balizas advierten detencion o emergencia, no para circular normalmente.', 'luces', 'easy', 'Conducir bajo lluvia', 'Indicar giro', 'Advertir emergencia o detencion', 'Reemplazar luces bajas', 3);
  perform public.seed_question('Si escuchas una sirena de emergencia, que corresponde?', 'Debes facilitar el paso de vehiculos de emergencia de forma segura.', 'generales', 'easy', 'Acelerar para alejarte', 'Mantenerte en el centro', 'Ceder el paso de manera segura', 'Frenar bruscamente en cualquier lugar', 3);
  perform public.seed_question('Que actitud reduce mas el riesgo al conducir?', 'La conduccion preventiva anticipa riesgos y evita maniobras impulsivas.', 'generales', 'medium', 'Conducir agresivamente', 'Anticiparse y conducir de forma preventiva', 'Competir con otros conductores', 'Usar el celular en semaforos', 2);
end
$$;

drop function public.seed_question(text, text, text, text, text, text, text, text, integer);

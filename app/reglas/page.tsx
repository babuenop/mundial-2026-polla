export default function ReglasPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">📋 Reglas de la Polla</h1>

      {/* Cómo funciona */}
      <section className="bg-white border rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">⚽ ¿Cómo funciona?</h2>
        <ul className="text-sm text-gray-700 space-y-2 list-none">
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">▸</span>
            Cada jugador pronostica el <strong>marcador exacto</strong> de cada partido antes de que comience.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">▸</span>
            Los pronósticos se <strong>bloquean 15 minutos antes</strong> del inicio de cada partido — después de ese límite ya no se pueden editar.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">▸</span>
            Podés hacer tus pronósticos con días de anticipación, en cualquier orden.
          </li>
        </ul>
      </section>

      {/* Puntuación */}
      <section className="bg-white border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">🎯 Sistema de puntuación</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <span className="text-2xl font-bold text-green-700 tabular-nums leading-none mt-0.5">3</span>
            <div>
              <p className="font-semibold text-green-800 text-sm">Marcador exacto</p>
              <p className="text-sm text-green-700">
                Acertaste el resultado <em>y</em> los goles de ambos equipos.
              </p>
              <p className="text-xs text-green-600 mt-0.5">Ej: pronosticaste 2–1 → resultado real 2–1 ✅</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <span className="text-2xl font-bold text-yellow-700 tabular-nums leading-none mt-0.5">1</span>
            <div>
              <p className="font-semibold text-yellow-800 text-sm">Resultado correcto</p>
              <p className="text-sm text-yellow-700">
                Acertaste quién gana (o que hay empate), pero no el marcador exacto.
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">Ej: pronosticaste 2–1 → resultado real 3–1 (gana local) 🟡</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-2xl font-bold text-gray-400 tabular-nums leading-none mt-0.5">0</span>
            <div>
              <p className="font-semibold text-gray-600 text-sm">Sin acierto</p>
              <p className="text-sm text-gray-500">
                El resultado real fue distinto al que pronosticaste.
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Ej: pronosticaste 2–1 → resultado real 0–1 (gana visitante) ❌</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabla de posiciones y desempates */}
      <section className="bg-white border rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">🏆 Tabla de posiciones</h2>
        <p className="text-sm text-gray-600">
          En caso de empate, se aplican estos criterios <strong>en orden</strong>:
        </p>
        <ol className="space-y-3">
          {[
            {
              n: '1',
              titulo: 'Mayor puntaje total',
              desc: 'El jugador con más puntos acumulados queda primero.',
            },
            {
              n: '2',
              titulo: 'Menos pronósticos realizados',
              desc: 'Si dos jugadores tienen el mismo puntaje, gana quien lo haya logrado pronosticando menos partidos. Premia la eficiencia.',
            },
            {
              n: '3',
              titulo: 'Más marcadores exactos',
              desc: 'Mayor cantidad de pronósticos con 3 puntos (marcador exacto acertado).',
            },
            {
              n: '4',
              titulo: 'Marcador exacto más reciente',
              desc: 'El jugador cuyo último marcador exacto corresponda al partido más reciente queda mejor posicionado.',
            },
          ].map(({ n, titulo, desc }) => (
            <li key={n} className="flex gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {n}
              </span>
              <div>
                <p className="font-semibold text-gray-800">{titulo}</p>
                <p className="text-gray-500">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Participación y pago */}
      <section className="bg-white border rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">💰 Participación y pago</h2>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">▸</span>
            La participación en el pozo requiere <strong>confirmación de pago</strong> por parte del administrador. Los detalles de monto y método se coordinan directamente.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">▸</span>
            Podés registrarte y hacer pronósticos antes de confirmar el pago, pero solo entran <strong>oficialmente al pozo</strong> los jugadores con pago confirmado.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 shrink-0">▸</span>
            El estado de tu pago es visible en la Tabla de Posiciones.
          </li>
        </ul>
      </section>

      {/* Logros */}
      <section className="bg-white border rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">🏅 Logros</h2>
        <p className="text-sm text-gray-600 mb-1">
          La app otorga logros personales que podés ver en <strong>Mi Perfil</strong>:
        </p>
        <div className="space-y-2">
          {[
            { emoji: '🎯', nombre: 'Francotirador', desc: 'Acertá 5 o más marcadores exactos.' },
            { emoji: '🔥', nombre: 'Racha',         desc: 'Encadenás 3 o más partidos consecutivos acertando al menos el resultado.' },
            { emoji: '🌟', nombre: 'Madrugador',    desc: 'Hacés todos tus pronósticos con al menos 24 horas de anticipación (mínimo 5 pronósticos).' },
          ].map(({ emoji, nombre, desc }) => (
            <div key={nombre} className="flex gap-3 text-sm bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-xl shrink-0">{emoji}</span>
              <div>
                <p className="font-semibold text-gray-800">{nombre}</p>
                <p className="text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

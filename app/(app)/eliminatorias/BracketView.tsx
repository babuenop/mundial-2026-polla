'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCodigoISO } from '@/lib/banderas'
import Bandera from '@/app/components/Bandera'
import { Partido } from '@/lib/types'
import { SIGUIENTE_SLOT, calcularGanador } from '@/lib/bracketProgression'

// ── Bracket slot arrays ───────────────────────────────────────────────────────
const LEFT_COLS: string[][] = [
  ['D-1','D-2','D-3','D-4','D-5','D-6','D-7','D-8'],
  ['O-1','O-2','O-3','O-4'],
  ['C-1','C-2'],
  ['S-1'],
]
// Right side rendered from center outward; levels are mirrored
const RIGHT_COLS: string[][] = [
  ['S-2'],
  ['C-3','C-4'],
  ['O-5','O-6','O-7','O-8'],
  ['D-9','D-10','D-11','D-12','D-13','D-14','D-15','D-16'],
]
const RIGHT_LEVELS = [3, 2, 1, 0]

const MOBILE_PHASES = [
  { label: '1/16', fase: 'Dieciseisavos de Final' },
  { label: '1/8',  fase: 'Octavos de Final' },
  { label: '1/4',  fase: 'Cuartos de Final' },
  { label: 'Semis', fase: 'Semifinales' },
  { label: 'Final', fase: 'Final' },
]

// ── Vertical position formula ─────────────────────────────────────────────────
// Each match is centered between its two parent matches from the previous round.
function topPx(level: number, idx: number, sh: number, ch: number): number {
  return (2 * idx + 1) * Math.pow(2, level) * (sh / 2) - ch / 2
}

// ── Small flag (avoids importing the full Bandera client component) ────────────
function Flag({ equipo, size }: { equipo: string; size: 'sm' | 'md' }) {
  if (equipo === 'Por definir') return <span className={size === 'sm' ? 'w-4 h-3' : 'w-5 h-4'} />
  const iso = getCodigoISO(equipo)
  const cls = size === 'sm' ? 'w-4 h-3' : 'w-5 h-4'
  return <img src={`https://flagcdn.com/w20/${iso}.png`} alt="" className={`${cls} object-cover rounded-sm shrink-0`} />
}

// ── Admin modal ───────────────────────────────────────────────────────────────
function Modal({ partido, onClose, onSaved }: {
  partido: Partido; onClose: () => void; onSaved: () => void
}) {
  const supabase = createClient()
  const [gL, setGL] = useState(partido.goles_local?.toString() ?? '')
  const [gV, setGV] = useState(partido.goles_visitante?.toString() ?? '')
  const [pens, setPens] = useState(partido.penales_local != null)
  const [pL, setPL] = useState(partido.penales_local?.toString() ?? '')
  const [pV, setPV] = useState(partido.penales_visitante?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    setErr(null); setSaving(true)
    const golesL = gL === '' ? null : +gL
    const golesV = gV === '' ? null : +gV
    const penL = pens && pL !== '' ? +pL : null
    const penV = pens && pV !== '' ? +pV : null
    const { error } = await supabase.from('partidos')
      .update({ goles_local: golesL, goles_visitante: golesV, penales_local: penL, penales_visitante: penV, finalizado: true })
      .eq('id', partido.id)
    if (error) { setSaving(false); setErr(error.message); return }
    if (partido.bracket_slot && golesL != null && golesV != null) {
      const ganador = calcularGanador(partido.equipo_local, partido.equipo_visitante, golesL, golesV, penL, penV)
      const sig = SIGUIENTE_SLOT[partido.bracket_slot]
      if (ganador && sig) {
        const campo = sig.posicion === 'local' ? 'equipo_local' : 'equipo_visitante'
        await supabase.from('partidos').update({ [campo]: ganador }).eq('bracket_slot', sig.slot)
      }
    }
    setSaving(false); onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-sm rounded-t-xl sm:rounded-xl p-5 space-y-4">
        <h2 className="font-bold">{partido.equipo_local} vs {partido.equipo_visitante}</h2>
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</p>}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{partido.equipo_local}</p>
            <input type="number" min={0} max={20} value={gL} onChange={e => setGL(e.target.value)}
              className="w-full text-center border rounded-lg py-2 text-lg font-bold" />
          </div>
          <span className="text-gray-400 font-bold mt-5">–</span>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{partido.equipo_visitante}</p>
            <input type="number" min={0} max={20} value={gV} onChange={e => setGV(e.target.value)}
              className="w-full text-center border rounded-lg py-2 text-lg font-bold" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={pens} onChange={e => setPens(e.target.checked)} className="rounded" />
          Hubo penales
        </label>
        {pens && (
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Pen. {partido.equipo_local}</p>
              <input type="number" min={0} value={pL} onChange={e => setPL(e.target.value)}
                className="w-full text-center border rounded-lg py-2 font-bold" />
            </div>
            <span className="text-gray-400 font-bold mt-5">–</span>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Pen. {partido.equipo_visitante}</p>
              <input type="number" min={0} value={pV} onChange={e => setPV(e.target.value)}
                className="w-full text-center border rounded-lg py-2 font-bold" />
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Compact bracket card ──────────────────────────────────────────────────────
function BCard({ partido, isAdmin, onEdit, cw, ch, flagSize }: {
  partido: Partido | null; isAdmin: boolean; onEdit: () => void
  cw: number; ch: number; flagSize: 'sm' | 'md'
}) {
  if (!partido) {
    return (
      <div className="border border-dashed border-gray-200 rounded-md bg-gray-50 flex items-center justify-center"
           style={{ height: ch, width: cw }}>
        <span className="text-[9px] text-gray-300">–</span>
      </div>
    )
  }
  const isPending = partido.equipo_local === 'Por definir' || partido.equipo_visitante === 'Por definir'
  const pen = partido.penales_local != null && partido.penales_visitante != null
  const wL = pen ? partido.penales_local! > partido.penales_visitante!
    : partido.goles_local != null && partido.goles_visitante != null && partido.goles_local > partido.goles_visitante!
  const wV = pen ? partido.penales_visitante! > partido.penales_local!
    : partido.goles_local != null && partido.goles_visitante != null && partido.goles_visitante > partido.goles_local!
  const canEdit = isAdmin && !isPending
  const rH = ch / 2

  return (
    <div onClick={canEdit ? onEdit : undefined}
         className={`border rounded-md overflow-hidden bg-white select-none ${canEdit ? 'cursor-pointer hover:border-purple-400 hover:shadow-sm' : ''} ${partido.finalizado ? 'border-green-300' : 'border-gray-200'}`}
         style={{ height: ch, width: cw }}>
      <div className={`flex items-center gap-1 px-1.5 border-b border-gray-100 text-[10px] leading-none ${wL ? 'font-bold bg-green-50 text-gray-900' : 'text-gray-600'}`}
           style={{ height: rH }}>
        <Flag equipo={partido.equipo_local} size={flagSize} />
        <span className="flex-1 truncate">{partido.equipo_local}</span>
        <span className="tabular-nums shrink-0 ml-0.5">{partido.goles_local ?? '–'}</span>
      </div>
      <div className={`flex items-center gap-1 px-1.5 text-[10px] leading-none ${wV ? 'font-bold bg-green-50 text-gray-900' : 'text-gray-600'}`}
           style={{ height: rH }}>
        <Flag equipo={partido.equipo_visitante} size={flagSize} />
        <span className="flex-1 truncate">{partido.equipo_visitante}</span>
        <span className="tabular-nums shrink-0 ml-0.5">{partido.goles_visitante ?? '–'}</span>
      </div>
    </div>
  )
}

// ── Bracket grid (reused for desktop and mobile) ──────────────────────────────
function BracketGrid({ slotMap, isAdmin, onEdit, bh, ch, cw, centerW, gap, flagSize }: {
  slotMap: Map<string, Partido>; isAdmin: boolean; onEdit: (slot: string) => void
  bh: number; ch: number; cw: number; centerW: number; gap: number; flagSize: 'sm' | 'md'
}) {
  const sh = bh / 8
  const tp = (level: number, idx: number) => topPx(level, idx, sh, ch)
  const finalPartido = slotMap.get('F-1')

  return (
    <div className="flex" style={{ height: bh, gap }}>
      {/* Left: Dieciseisavos → Octavos → Cuartos → Semis */}
      {LEFT_COLS.map((slots, level) => (
        <div key={`L${level}`} className="relative shrink-0" style={{ width: cw, height: bh }}>
          {slots.map((slot, idx) => (
            <div key={slot} className="absolute" style={{ top: tp(level, idx), left: 0, width: cw }}>
              <BCard partido={slotMap.get(slot) ?? null} isAdmin={isAdmin}
                onEdit={() => onEdit(slot)} cw={cw} ch={ch} flagSize={flagSize} />
            </div>
          ))}
        </div>
      ))}

      {/* Center: trophy + Final */}
      <div className="relative shrink-0 flex flex-col items-center justify-center gap-1.5"
           style={{ width: centerW, height: bh }}>
        <div className="text-3xl">🏆</div>
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Final</div>
        {finalPartido && (
          <div className="text-[9px] text-gray-400">
            {new Date(finalPartido.fecha_partido).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </div>
        )}
        <BCard partido={finalPartido ?? null} isAdmin={isAdmin}
          onEdit={() => onEdit('F-1')} cw={cw + 16} ch={ch + 4} flagSize={flagSize} />
      </div>

      {/* Right: Semis → Cuartos → Octavos → Dieciseisavos */}
      {RIGHT_COLS.map((slots, displayIdx) => {
        const level = RIGHT_LEVELS[displayIdx]
        return (
          <div key={`R${displayIdx}`} className="relative shrink-0" style={{ width: cw, height: bh }}>
            {slots.map((slot, idx) => (
              <div key={slot} className="absolute" style={{ top: tp(level, idx), left: 0, width: cw }}>
                <BCard partido={slotMap.get(slot) ?? null} isAdmin={isAdmin}
                  onEdit={() => onEdit(slot)} cw={cw} ch={ch} flagSize={flagSize} />
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── Phase labels header ───────────────────────────────────────────────────────
function PhaseLabels({ cw, centerW, gap }: { cw: number; centerW: number; gap: number }) {
  const cols = ['1/16','1/8','1/4','Semis']
  return (
    <div className="flex mb-1" style={{ gap }}>
      {cols.map(l => (
        <div key={l} style={{ width: cw }} className="text-center text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{l}</div>
      ))}
      <div style={{ width: centerW }} className="text-center text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Final</div>
      {[...cols].reverse().map(l => (
        <div key={`r-${l}`} style={{ width: cw }} className="text-center text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{l}</div>
      ))}
    </div>
  )
}

// ── Full match card (mobile list) ─────────────────────────────────────────────
function ListCard({ partido, isAdmin, onEdit }: { partido: Partido; isAdmin: boolean; onEdit: () => void }) {
  const isPending = partido.equipo_local === 'Por definir' || partido.equipo_visitante === 'Por definir'
  const pen = partido.penales_local != null && partido.penales_visitante != null
  const wL = pen ? partido.penales_local! > partido.penales_visitante!
    : partido.goles_local != null && partido.goles_visitante != null && partido.goles_local > partido.goles_visitante!
  const wV = pen ? partido.penales_visitante! > partido.penales_local!
    : partido.goles_local != null && partido.goles_visitante != null && partido.goles_visitante > partido.goles_local!
  const canEdit = isAdmin && !isPending

  return (
    <div onClick={canEdit ? onEdit : undefined}
         className={`border rounded-xl p-4 bg-white shadow-sm ${canEdit ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${partido.finalizado ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex justify-between text-xs text-gray-400 mb-3">
        <span className="font-mono text-gray-300">{partido.bracket_slot}</span>
        {partido.finalizado
          ? <span className="text-green-600 font-medium">✓ Finalizado</span>
          : !isPending && <span>Por jugar</span>}
      </div>
      <div className="space-y-2">
        <div className={`flex items-center gap-2 ${wL ? 'font-bold' : ''}`}>
          {!isPending && <Bandera equipo={partido.equipo_local} />}
          <span className="flex-1">{partido.equipo_local}</span>
          <span className="text-xl font-bold tabular-nums">{partido.goles_local ?? '–'}</span>
        </div>
        <div className={`flex items-center gap-2 ${wV ? 'font-bold' : ''}`}>
          {!isPending && <Bandera equipo={partido.equipo_visitante} />}
          <span className="flex-1">{partido.equipo_visitante}</span>
          <span className="text-xl font-bold tabular-nums">{partido.goles_visitante ?? '–'}</span>
        </div>
      </div>
      {pen && <div className="mt-2 text-xs text-gray-500 text-center">pen. {partido.penales_local} – {partido.penales_visitante}</div>}
      {canEdit && <p className="text-right text-xs text-purple-500 mt-2">★ Editar</p>}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
type ViewMode = 'lista' | 'bracket'

export default function BracketView({ partidos, isAdmin }: { partidos: Partido[]; isAdmin: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Partido | null>(null)
  const [mobilePhase, setMobilePhase] = useState(0)
  const [mobileView, setMobileView] = useState<ViewMode>('lista')

  const slotMap = new Map<string, Partido>(
    partidos.filter(p => p.bracket_slot).map(p => [p.bracket_slot!, p])
  )
  const edit = (slot: string) => { const p = slotMap.get(slot); if (p) setEditing(p) }
  const handleSaved = () => { setEditing(null); router.refresh() }

  // Desktop sizing: 8×100 + 140 + 8×4 = 992px — fits on ≥ 1280px with sidebar
  const D = { bh: 800, ch: 54, cw: 100, centerW: 140, gap: 4 } as const
  // Mobile bracket sizing: scrollable horizontally
  const M = { bh: 520, ch: 38, cw: 80, centerW: 88, gap: 3 } as const

  return (
    <div>

      {/* ── Desktop bracket ────────────────────────────────────────────────── */}
      <div className="hidden lg:block px-3 py-4">
        <h1 className="text-2xl font-bold mb-3">Fase Eliminatoria</h1>
        <PhaseLabels cw={D.cw} centerW={D.centerW} gap={D.gap} />
        <BracketGrid slotMap={slotMap} isAdmin={isAdmin} onEdit={edit}
          bh={D.bh} ch={D.ch} cw={D.cw} centerW={D.centerW} gap={D.gap} flagSize="md" />
      </div>

      {/* ── Mobile ────────────────────────────────────────────────────────── */}
      <div className="lg:hidden p-4 space-y-4">

        {/* Header + view toggle */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Fase Eliminatoria</h1>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setMobileView('lista')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${mobileView === 'lista' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              Lista
            </button>
            <button onClick={() => setMobileView('bracket')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${mobileView === 'bracket' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              Bracket
            </button>
          </div>
        </div>

        {mobileView === 'lista' ? (
          <>
            {/* Phase tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {MOBILE_PHASES.map((ph, idx) => (
                <button key={idx} onClick={() => setMobilePhase(idx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${mobilePhase === idx ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {ph.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {partidos
                .filter(p => p.fase === MOBILE_PHASES[mobilePhase].fase)
                .sort((a, b) => (a.bracket_slot ?? '').localeCompare(b.bracket_slot ?? ''))
                .map(p => <ListCard key={p.id} partido={p} isAdmin={isAdmin} onEdit={() => setEditing(p)} />)}
            </div>
          </>
        ) : (
          /* Mobile bracket — horizontally scrollable */
          <div className="-mx-4">
            <p className="text-xs text-gray-400 mb-2 px-4">← Deslizá para ver todo el bracket</p>
            <div className="overflow-x-auto pb-4 px-4">
              <PhaseLabels cw={M.cw} centerW={M.centerW} gap={M.gap} />
              <BracketGrid slotMap={slotMap} isAdmin={isAdmin} onEdit={edit}
                bh={M.bh} ch={M.ch} cw={M.cw} centerW={M.centerW} gap={M.gap} flagSize="sm" />
            </div>
          </div>
        )}
      </div>

      {editing && <Modal partido={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  )
}

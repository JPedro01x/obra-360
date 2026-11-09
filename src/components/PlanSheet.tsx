import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ModelDraft, ModelElement } from '../services/modelGeometry';
import { anchor } from '../services/modelGeometry';
import { dimensionGeometry, wallEnds } from '../services/planTopology';
import { detectRooms, matchRoom } from '../services/planRooms';
import { DimensionMarks, RoomMarks } from './PlanAnnotations';

export type SheetSettings = {
  paper: 'A4' | 'A3';
  scale: number;
  responsavel: string;
  folha: string;
  includeDimensions: boolean;
  includeRooms: boolean;
};
export function sheetLayout(draft: ModelDraft, floorId: string, settings: SheetSettings) {
  const elements = draft.documento.elementos.filter((e) => e.pavimentoId === floorId),
    dimensions = settings.includeDimensions
      ? (draft.documento.cotas || []).filter((c) => c.pavimentoId === floorId)
      : [];
  const points: { x: number; z: number }[] = [];
  for (const e of elements) {
    const p = anchor(e, draft.documento.elementos),
      a = (p.rotacao * Math.PI) / 180,
      depth = e.paredeId ? p.profundidade : e.profundidade;
    for (const x of [-e.largura / 2, e.largura / 2])
      for (const z of [-depth / 2, depth / 2])
        points.push({
          x: p.x + Math.cos(a) * x + Math.sin(a) * z,
          z: p.z - Math.sin(a) * x + Math.cos(a) * z,
        });
  }
  for (const c of dimensions) {
    const { a, b } = dimensionGeometry(c);
    points.push(a, b, { x: c.ax, z: c.az }, { x: c.bx, z: c.bz });
  }
  if (settings.includeRooms) {
    try {
      const rooms = detectRooms(draft.documento, floorId);
      for (const label of (draft.documento.ambientes || []).filter(
        (r) => r.pavimentoId === floorId,
      )) {
        const room = matchRoom(label, rooms);
        if (!room) continue;
        const font = 0.0025 * settings.scale,
          half = Math.max(label.nome.length * 0.45, 9) * font;
        points.push(
          { x: room.anchor.x - half, z: room.anchor.z - font },
          { x: room.anchor.x + half, z: room.anchor.z + font * 2 },
        );
      }
    } catch {
      /* The sheet explicitly reports unavailable room detection. */
    }
  }
  if (!points.length) points.push({ x: -1, z: -1 }, { x: 1, z: 1 });
  const margin = settings.scale * 0.004,
    minX = Math.min(...points.map((p) => p.x)) - margin,
    minZ = Math.min(...points.map((p) => p.z)) - margin;
  const width = Math.max(...points.map((p) => p.x)) - minX + margin,
    height = Math.max(...points.map((p) => p.z)) - minZ + margin;
  const widthMm = (width * 1000) / settings.scale,
    heightMm = (height * 1000) / settings.scale;
  const availableWidth = settings.paper === 'A4' ? 272 : 395,
    availableHeight = settings.paper === 'A4' ? 140 : 227;
  return {
    minX,
    minZ,
    width,
    height,
    widthMm,
    heightMm,
    availableWidth,
    availableHeight,
    fits: widthMm <= availableWidth && heightMm <= availableHeight,
  };
}
function PrintedElement({
  e,
  elements,
  line,
}: {
  e: ModelElement;
  elements: ModelElement[];
  line: number;
}) {
  const p = anchor(e, elements),
    depth = e.paredeId ? p.profundidade : e.profundidade;
  const holes = e.tipo === 'PAREDE' ? elements.filter((o) => o.paredeId === e.id) : [];
  const xs = [
    -e.largura / 2,
    e.largura / 2,
    ...holes.flatMap((o) => [o.deslocamento - o.largura / 2, o.deslocamento + o.largura / 2]),
  ].sort((a, b) => a - b);
  return (
    <g transform={`translate(${p.x} ${p.z}) rotate(${-p.rotacao})`}>
      {e.tipo === 'PAREDE' ? (
        xs.slice(0, -1).map((x, i) => {
          const w = xs[i + 1] - x;
          if (
            w < 0.00001 ||
            holes.some((o) => Math.abs(x + w / 2 - o.deslocamento) < o.largura / 2 - 0.000001)
          )
            return null;
          return (
            <rect
              key={i}
              x={x}
              y={-depth / 2}
              width={w}
              height={depth}
              fill="#d8dce1"
              stroke="#111827"
              strokeWidth={line}
            />
          );
        })
      ) : (
        <rect
          x={-e.largura / 2}
          y={-depth / 2}
          width={e.largura}
          height={depth}
          fill={e.tipo === 'PILAR' ? '#6b7280' : e.tipo === 'LAJE' ? 'none' : '#fff'}
          stroke={e.tipo === 'LAJE' ? '#94a3b8' : '#111827'}
          strokeWidth={line}
          strokeDasharray={e.tipo === 'LAJE' ? `${line * 5} ${line * 3}` : undefined}
        />
      )}
      {e.tipo === 'JANELA' && (
        <line
          x1={-e.largura / 2}
          y1={0}
          x2={e.largura / 2}
          y2={0}
          stroke="#111827"
          strokeWidth={line}
        />
      )}
    </g>
  );
}
export function PlanSheet({
  draft,
  floorId,
  settings,
  projectName,
  revision,
  dirty,
}: {
  draft: ModelDraft;
  floorId: string;
  settings: SheetSettings;
  projectName: string;
  revision: number;
  dirty: boolean;
}) {
  const doc = draft.documento,
    floor = doc.pavimentos.find((f) => f.id === floorId)!,
    layout = sheetLayout(draft, floorId, settings),
    elements = doc.elementos.filter((e) => e.pavimentoId === floorId),
    font = 0.0025 * settings.scale,
    line = 0.00018 * settings.scale;
  let rooms: ReturnType<typeof detectRooms> = [];
  let roomError = '';
  try {
    if (settings.includeRooms) rooms = detectRooms(doc, floorId);
  } catch (e) {
    roomError = e instanceof Error ? e.message : 'Ambientes não calculados.';
  }
  return (
    <article className={`plan-sheet paper-${settings.paper}`} data-scale={settings.scale}>
      <header>
        <div>
          <h1>PLANTA ARQUITETÔNICA</h1>
          <p>
            {projectName} · {draft.nome}
          </p>
        </div>
        <div>
          <strong>{floor.nome}</strong>
          <p>Cota {floor.cota.toFixed(2)} m · Unidades em metros</p>
        </div>
      </header>
      <div className="sheet-drawing" style={{ height: `${layout.availableHeight}mm` }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Planta para impressão em escala"
          width={`${layout.widthMm}mm`}
          height={`${layout.heightMm}mm`}
          viewBox={`${layout.minX} ${layout.minZ} ${layout.width} ${layout.height}`}
          style={{ overflow: 'visible' }}
        >
          {elements
            .filter((e) => e.tipo === 'LAJE')
            .map((e) => (
              <PrintedElement key={e.id} e={e} elements={elements} line={line} />
            ))}
          {elements
            .filter((e) => e.tipo !== 'LAJE')
            .map((e) => (
              <PrintedElement key={e.id} e={e} elements={elements} line={line} />
            ))}
          {settings.includeRooms &&
            (doc.ambientes || [])
              .filter((r) => r.pavimentoId === floorId)
              .map((label) => {
                const room = matchRoom(label, rooms);
                return room ? (
                  <RoomMarks key={label.id} label={label} room={room} font={font} fill={false} />
                ) : null;
              })}
          {settings.includeDimensions &&
            (doc.cotas || [])
              .filter((c) => c.pavimentoId === floorId)
              .map((c) => <DimensionMarks key={c.id} cota={c} font={font} line={line} />)}
        </svg>
      </div>
      <footer>
        <div>
          <strong>LEGENDA</strong>
          <p>▰ Parede / pilar · □ Porta · ═ Janela · Tracejado: laje</p>
          <p>Áreas de ambientes pelo eixo das paredes, sem desconto das espessuras.</p>
          {roomError && <p>{roomError}</p>}
        </div>
        <div>
          <strong>Responsável informado</strong>
          <p>{settings.responsavel.trim() || 'Não informado'}</p>
          <p>
            {new Date().toLocaleDateString('pt-BR')} ·{' '}
            {dirty ? 'RASCUNHO NÃO SALVO' : `Revisão ${revision}`}
          </p>
        </div>
        <div>
          <strong>ESCALA 1:{settings.scale}</strong>
          <p>
            Folha {settings.folha || '01'} · {settings.paper} paisagem
          </p>
          <p>Imprimir em 100%, sem ajustar à página.</p>
        </div>
      </footer>
    </article>
  );
}
export function openPrintSheet(props: React.ComponentProps<typeof PlanSheet>) {
  const layout = sheetLayout(props.draft, props.floorId, props.settings);
  if (!layout.fits)
    throw new Error(
      'A planta não cabe nessa folha e escala. Escolha escala menor ou papel A3; o desenho não será reduzido automaticamente.',
    );
  const win = window.open('', '_blank');
  if (!win) throw new Error('Permita abrir a janela de impressão neste navegador.');
  win.opener = null;
  const markup = renderToStaticMarkup(<PlanSheet {...props} />);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Planta para impressão</title><style>
    *{box-sizing:border-box}body{margin:0;background:#e2e8f0;font-family:Arial,sans-serif;color:#111827}.print-toolbar{padding:14px;background:#fff;border-bottom:1px solid #cbd5e1;font-size:13px;display:flex;gap:15px;align-items:center;flex-wrap:wrap}.print-toolbar button{padding:9px 14px;cursor:pointer}.plan-sheet{background:white;margin:15px auto;padding:2mm;border:.25mm solid #111827;overflow:visible}.paper-A4{width:277mm;height:190mm}.paper-A3{width:400mm;height:277mm}.plan-sheet header{height:16mm;display:flex;justify-content:space-between;border-bottom:.2mm solid #111827;gap:8mm}.plan-sheet h1{font-size:4mm;margin:1mm 0}.plan-sheet p{font-size:2.5mm;margin:1mm 0;overflow-wrap:anywhere}.plan-sheet strong{font-size:2.7mm}.sheet-drawing{display:flex;align-items:center;justify-content:center;width:100%;overflow:visible}.plan-sheet footer{height:27mm;display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:3mm;border-top:.2mm solid #111827;padding-top:2mm}.plan-sheet footer>div{min-width:0}.sheet-drawing svg{flex:none} @page{size:${props.settings.paper} landscape;margin:10mm}@media print{body{background:white}.print-toolbar{display:none}.plan-sheet{margin:0;break-inside:avoid;page-break-inside:avoid}} 
  </style></head><body><div class="print-toolbar"><button id="print-action" type="button">Imprimir / Salvar PDF</button><span>Use papel ${props.settings.paper} paisagem, escala 100%, margens de 10 mm e desative cabeçalhos/rodapés do navegador. Não selecione “ajustar à página”.</span></div>${markup}</body></html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.document.getElementById('print-action')?.addEventListener('click', () => win.print());
  return win;
}

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Box,
  Copy,
  Download,
  Layers3,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { API_BASE_URL, requestApi } from '../services/http';
import {
  anchor,
  copyDraft,
  editableRoles,
  ElementType,
  ModelDocument,
  ModelDraft,
  ModelElement,
  PlanPoint,
  opening,
  rounded,
  SavedModel,
  validation,
} from '../services/modelGeometry';
import { ModelPlan } from './ModelPlan';
import { ModelViewport } from './ModelViewport';
import { connectWalls, syncTopology, upgrade, writeWallNodes } from '../services/planTopology';
import { PlanTools } from './PlanTools';
import { ModelTimeline } from './ModelTimeline';
import { ModelPublication } from './ModelPublication';
import { ModelComparison } from './ModelComparison';
import { ModelCloudDraft } from './ModelCloudDraft';
import { ModelReference } from './ModelReference';
import { loadSavedPlanReference, type OpenPlanReference, type SavedPlanReference } from '../services/planReference';
import './model-editor.css';

type ModelSummary = Omit<SavedModel, 'documento'>;
type LocalDraft = { draft: ModelDraft; version: number; raw: string };

function readLocalDraft(key: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { draft, version } = JSON.parse(raw);
    if (!Number.isSafeInteger(version) || !draft || validation(draft)) return null;
    return { draft, version, raw };
  } catch {
    return null;
  }
}

function removeLocalDraft(key: string, raw: string) {
  try {
    if (localStorage.getItem(key) === raw) localStorage.removeItem(key);
  } catch {
    // Browser storage may be unavailable.
  }
}
type Revision = {
  id: number;
  numero: number;
  nome: string;
  motivo: string;
  usuarioId: number;
  criadoEm: string;
};
const api = <T,>(path: string, options?: RequestInit) =>
  requestApi<T>(`/v1/workspace/modelador${path}`, options, 45000);
const colors: Record<ElementType, string> = {
  PAREDE: '#cbd5e1',
  LAJE: '#94a3b8',
  PILAR: '#64748b',
  PORTA: '#a87846',
  JANELA: '#38bdf8',
};
const typeNames: Record<ElementType, string> = {
  PAREDE: 'Parede',
  LAJE: 'Laje',
  PILAR: 'Pilar',
  PORTA: 'Porta',
  JANELA: 'Janela',
};
const uid = () => crypto.randomUUID();

export function ModelEditor({
  role,
  draftScope,
  onDirtyChange,
}: {
  role: string;
  draftScope: string;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const canEdit = editableRoles.includes(role);
  const [projects, setProjects] = useState<{ id: number; nome: string }[]>([]),
    [projectQuery, setProjectQuery] = useState(''),
    [project, setProject] = useState('');
  const [models, setModels] = useState<ModelSummary[]>([]),
    [modelTotal, setModelTotal] = useState(0),
    [modelPage, setModelPage] = useState(0),
    [includeArchived, setIncludeArchived] = useState(false);
  const [saved, setSaved] = useState<SavedModel | null>(null),
    [draft, setDraft] = useState<ModelDraft | null>(null);
  const [past, setPast] = useState<ModelDraft[]>([]),
    [future, setFuture] = useState<ModelDraft[]>([]);
  const [floorId, setFloorId] = useState(''),
    [selected, setSelected] = useState<string[]>([]),
    [view, setView] = useState<'split' | '2d' | '3d'>('split'),
    [allFloors, setAllFloors] = useState(false),
    [fit, setFit] = useState(0),
    [snap, setSnap] = useState(0.1),
    [drawWall, setDrawWall] = useState(false);
  const [measure, setMeasure] = useState(false),
    [connect, setConnect] = useState(true);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [listLoading, setListLoading] = useState(false),
    [refresh, setRefresh] = useState(0),
    [revisionPage, setRevisionPage] = useState(0),
    [revisions, setRevisions] = useState<Revision[]>([]),
    [revisionTotal, setRevisionTotal] = useState(0),
    [reason, setReason] = useState('Edição do modelo');
  const [cloneFrom, setCloneFrom] = useState<number | null>(null);
  const [timeline, setTimeline] = useState(false);
  const [publication, setPublication] = useState(false);
  const [comparisonSource, setComparisonSource] = useState<ModelDraft | null>(null);
  const [reference, setReference] = useState<OpenPlanReference | null>(null);
  const [referenceChanged, setReferenceChanged] = useState(false);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [referenceSource, setReferenceSource] = useState<{
    modelId: number; revision: number; metadata: SavedPlanReference;
  } | null>(null);
  const [calibration, setCalibration] = useState<{ meters: number; first?: PlanPoint } | null>(null);
  const [creating, setCreating] = useState(false),
    [modelName, setModelName] = useState(''),
    [filter, setFilter] = useState('');
  const generation = useRef(0),
    importInput = useRef<HTMLInputElement>(null);
  const importGeneration = useRef(0);
  const cloudDraftToken = useRef<string | null>(null);
  const geometryDirty =
    !!draft &&
    !!saved &&
    JSON.stringify(draft) !== JSON.stringify({ nome: saved.nome, documento: saved.documento });
  const dirty = geometryDirty || referenceChanged;
  const [recoverable, setRecoverable] = useState<LocalDraft | null>(null);
  const [draftStored, setDraftStored] = useState(false);
  const writtenDraft = useRef<{ key: string; raw: string } | null>(null);
  const draftKey = (id: number) => `obra360:model-draft:${JSON.stringify([API_BASE_URL, draftScope, id])}`;
  const storageKey = saved ? draftKey(saved.id) : null;
  const writable = canEdit && !saved?.arquivado && !busy && !recoverable;
  useLayoutEffect(() => {
    return () => { importGeneration.current++; };
  }, [saved, draft, writable]);
  useLayoutEffect(() => {
    if (!storageKey || !saved || !canEdit || saved.arquivado || recoverable) return;
    if (!geometryDirty || !draft) {
      if (writtenDraft.current?.key === storageKey) {
        removeLocalDraft(storageKey, writtenDraft.current.raw);
        writtenDraft.current = null;
      }
      return;
    }
    try {
      const raw = JSON.stringify({ version: saved.versao, draft });
      const current = localStorage.getItem(storageKey);
      const previous = writtenDraft.current?.key === storageKey ? writtenDraft.current.raw : null;
      if (current && current !== previous && current !== raw) {
        setDraftStored(false);
        return;
      }
      if (current !== raw) localStorage.setItem(storageKey, raw);
      writtenDraft.current = { key: storageKey, raw };
      setDraftStored(true);
    } catch {
      setDraftStored(false);
    }
  }, [storageKey, saved, canEdit, recoverable, geometryDirty, draft]);
  const floor =
    draft?.documento.pavimentos.find((f) => f.id === floorId) || draft?.documento.pavimentos[0];
  const element = draft?.documento.elementos.find((e) => e.id === selected[0]);
  const floorReference = reference && reference.floorId === floor?.id ? reference : undefined;
  useEffect(() => {
    if (!referenceSource) return;
    const controller = new AbortController();
    const { modelId, revision, metadata } = referenceSource;
    void loadSavedPlanReference(modelId, revision, metadata, controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return;
        setReference(loaded);
        setFit((n) => n + 1);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setReferenceLoading(false);
      });
    return () => controller.abort();
  }, [referenceSource]);
  useEffect(() => {
    onDirtyChange(dirty);
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      onDirtyChange(false);
    };
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    const c = new AbortController(),
      timer = setTimeout(
        () =>
          requestApi<{ id: number; nome: string }[]>(
            `/v1/workspace/opcoes/projetos?q=${encodeURIComponent(projectQuery)}`,
            { signal: c.signal },
          )
            .then((v) => {
              if (!c.signal.aborted) setProjects(v);
            })
            .catch((e) => {
              if (!c.signal.aborted) setError(e.message);
            }),
        projectQuery ? 250 : 0,
      );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [projectQuery]);
  useEffect(() => {
    if (!project) {
      setModels([]);
      setModelTotal(0);
      return;
    }
    const c = new AbortController();
    setListLoading(true);
    api<{ items: ModelSummary[]; total: number }>(
      `/modelos?projetoObraId=${project}&page=${modelPage}&incluirArquivados=${includeArchived}`,
      { signal: c.signal },
    )
      .then((v) => {
        if (!c.signal.aborted) {
          setModels(v.items);
          setModelTotal(v.total);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) {
          setModels([]);
          setError(e.message);
        }
      })
      .finally(() => {
        if (!c.signal.aborted) setListLoading(false);
      });
    return () => c.abort();
  }, [project, modelPage, includeArchived, refresh]);
  useEffect(() => {
    if (!saved) {
      setRevisions([]);
      return;
    }
    const c = new AbortController();
    api<{ items: Revision[]; total: number }>(
      `/modelos/${saved.id}/revisoes?page=${revisionPage}`,
      { signal: c.signal },
    )
      .then((v) => {
        if (!c.signal.aborted) {
          setRevisions(v.items);
          setRevisionTotal(v.total);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [saved, revisionPage]);
  const discard = () => !dirty || window.confirm(
    draftStored
      ? 'Há um rascunho guardado neste navegador. Deseja continuar?'
      : 'Há alterações sem rascunho salvo. Deseja descartá-las?',
  );
  function accept(model: SavedModel, reset = true) {
    setComparisonSource(null);
    cloudDraftToken.current = null;
    writtenDraft.current = null;
    setRecoverable(canEdit && !model.arquivado ? readLocalDraft(draftKey(model.id)) : null);
    setReference(null);
    setReferenceChanged(false);
    setReferenceLoading(!!model.referencia);
    setReferenceSource(model.referencia
      ? { modelId: model.id, revision: model.revisao, metadata: model.referencia }
      : null);
    setCalibration(null);
    if (saved?.id !== model.id) {
      setTimeline(false);
      setPublication(false);
    }
    setSaved(model);
    setDraft(copyDraft({ nome: model.nome, documento: model.documento }));
    setFloorId((current) =>
      model.documento.pavimentos.some((f) => f.id === current)
        ? current
        : model.documento.pavimentos[0].id,
    );
    if (reset) {
      setPast([]);
      setFuture([]);
      setSelected([]);
      setRevisionPage(0);
      setFit((n) => n + 1);
    }
    setDrawWall(false);
    setRefresh((n) => n + 1);
  }
  async function load(id: number) {
    if (!discard()) return;
    const token = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const m = await api<SavedModel>(`/modelos/${id}`);
      if (generation.current === token) {
        accept(m);
        setNotice('Modelo carregado do banco.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar.');
    } finally {
      setBusy(false);
    }
  }
  function switchProject(id: string) {
    if (!discard()) return;
    generation.current++;
    setProject(id);
    setSaved(null);
    setComparisonSource(null);
    cloudDraftToken.current = null;
    setRecoverable(null);
    writtenDraft.current = null;
    setReference(null);
    setReferenceChanged(false);
    setReferenceLoading(false);
    setReferenceSource(null);
    setCalibration(null);
    setTimeline(false);
    setPublication(false);
    setDraft(null);
    setPast([]);
    setFuture([]);
    setSelected([]);
    setModelPage(0);
    setError('');
    setNotice('');
    setCreating(false);
  }

  function calibrate(point: PlanPoint) {
    if (!calibration || !floorReference) return;
    const { x, z, width, height } = floorReference;
    if (point.x < x || point.x > x + width || point.z < z || point.z > z + height) {
      setError('Marque um ponto dentro da imagem da planta.');
      return;
    }
    setError('');
    const first = calibration.first;
    if (!first) {
      setCalibration({ ...calibration, first: point });
      return;
    }
    const distance = Math.hypot(point.x - first.x, point.z - first.z);
    const factor = calibration.meters / distance;
    if (distance < 0.001 || Math.max(width, height) * factor > 2000) {
      setError('Marque dois pontos distintos que representem a distância informada.');
      return;
    }
    setReference({
      ...floorReference, calibrated: true, width: width * factor, height: height * factor,
      x: first.x + (x - first.x) * factor, z: first.z + (z - first.z) * factor,
    });
    setReferenceChanged(true);
    setCalibration(null);
    setDrawWall(true);
    setFit((value) => value + 1);
  }
  function commit(next: ModelDraft) {
    if (!writable || !draft) return false;
    syncTopology(next.documento);
    const invalid = validation(next);
    if (invalid) {
      setError(invalid);
      return false;
    }
    if (JSON.stringify(next) === JSON.stringify(draft)) return true;
    setPast((v) => [...v.slice(-49), copyDraft(draft)]);
    setFuture([]);
    setDraft(next);
    setError('');
    setNotice('Alteração local. Salve para registrar uma revisão.');
    return true;
  }
  function undo() {
    if (!writable || !draft || !past.length) return;
    setFuture((v) => [copyDraft(draft), ...v].slice(0, 50));
    setDraft(past[past.length - 1]);
    setPast((v) => v.slice(0, -1));
    setSelected([]);
    setError('');
  }
  function redo() {
    if (!writable || !draft || !future.length) return;
    setPast((v) => [...v, copyDraft(draft)].slice(-50));
    setDraft(future[0]);
    setFuture((v) => v.slice(1));
    setSelected([]);
    setError('');
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable]')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape') {
        setDrawWall(false);
        setMeasure(false);
        setSelected([]);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !canEdit || busy || !discard()) return;
    setBusy(true);
    setError('');
    try {
      const result = await api<SavedModel>(
        cloneFrom ? `/modelos/${cloneFrom}/duplicar` : '/modelos',
        {
          method: 'POST',
          body: JSON.stringify({ projetoObraId: Number(project), nome: modelName.trim() }),
        },
      );
      accept(result);
      setCreating(false);
      setCloneFrom(null);
      setModelName('');
      setNotice(cloneFrom ? 'Modelo salvo duplicado no banco.' : 'Modelo vazio criado no banco.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar.');
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!saved || !draft || !writable) return;
    const invalid = validation(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!reason.trim()) {
      setError('Informe o motivo da revisão.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const nextReference = reference && draft.documento.pavimentos.some((f) => f.id === reference.floorId)
        ? reference : null;
      const revision = { ...draft, versao: saved.versao, motivo: reason.trim(),
        rascunhoToken: cloudDraftToken.current,
        ...(referenceChanged && !nextReference ? { removerReferencia: true } : {}),
      };
      let body: string | FormData = JSON.stringify(revision);
      if (referenceChanged && nextReference) {
        const form = new FormData();
        const metadata = { pavimentoId: nextReference.floorId, pagina: nextReference.page,
          x: nextReference.x, z: nextReference.z, largura: nextReference.width,
          altura: nextReference.height, calibrada: nextReference.calibrated,
        };
        form.set('revisao', new Blob([JSON.stringify(revision)], { type: 'application/json' }));
        form.set('referencia', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.set('arquivo', nextReference.file);
        body = form;
      }
      const result = await api<SavedModel>(`/modelos/${saved.id}`, {
        method: 'PUT',
        body,
      });
      if (writtenDraft.current) {
        removeLocalDraft(writtenDraft.current.key, writtenDraft.current.raw);
      }
      accept(result, false);
      setNotice(`Revisão ${result.revisao} salva no banco.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }
  async function archive() {
    if (!saved || !canEdit || !discard()) return;
    setBusy(true);
    setError('');
    try {
      accept(
        await api<SavedModel>(`/modelos/${saved.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ versao: saved.versao, arquivado: !saved.arquivado }),
        }),
      );
      setNotice(saved.arquivado ? 'Modelo reativado.' : 'Modelo arquivado; revisões preservadas.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na operação.');
    } finally {
      setBusy(false);
    }
  }
  async function restore(revision: Revision) {
    if (
      !saved ||
      !writable ||
      !discard() ||
      !window.confirm(
        `Restaurar a revisão ${revision.numero}? Uma nova revisão será criada, preservando o histórico.`,
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      accept(
        await api<SavedModel>(`/modelos/${saved.id}/restaurar`, {
          method: 'POST',
          body: JSON.stringify({
            versao: saved.versao,
            revisaoId: revision.id,
            motivo: 'Restauração solicitada no editor',
          }),
        }),
      );
      setNotice('Versão restaurada como uma nova revisão.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao restaurar.');
    } finally {
      setBusy(false);
    }
  }
  function select(id: string, extend = false) {
    setSelected((current) =>
      !id
        ? []
        : extend
          ? current.includes(id)
            ? current.filter((v) => v !== id)
            : [...current, id]
          : [id],
    );
  }
  function add(
    type: ElementType,
    placement?: { x: number; z: number; width: number; angle: number },
  ) {
    if (!draft || !floor || !writable) return;
    const next = copyDraft(draft),
      parent = element?.paredeId
        ? next.documento.elementos.find((e) => e.id === element.paredeId)
        : element;
    const e: ModelElement = {
      id: uid(),
      pavimentoId: floor.id,
      tipo: type,
      nome: `${typeNames[type]} ${draft.documento.elementos.filter((e) => e.tipo === type).length + 1}`,
      x: placement?.x || 0,
      z: placement?.z || 0,
      base: 0,
      largura:
        placement?.width ||
        (type === 'PAREDE' ? 5 : type === 'LAJE' ? 4 : type === 'PILAR' ? 0.25 : 0.9),
      profundidade: type === 'PAREDE' ? 0.15 : type === 'LAJE' ? 4 : 0.25,
      altura: type === 'LAJE' ? 0.15 : type === 'PAREDE' || type === 'PILAR' ? floor.altura : 2.1,
      rotacao: placement?.angle || 0,
      cor: colors[type],
      paredeId: null,
      deslocamento: 0,
    };
    if (opening(e)) {
      if (!parent || parent.tipo !== 'PAREDE') {
        setError('Selecione uma parede para adicionar uma porta ou janela.');
        return;
      }
      if (draft.documento.elementos.filter((child) => child.paredeId === parent.id).length >= 32) {
        setError('Limite de 32 aberturas por parede.');
        return;
      }
      e.paredeId = parent.id;
      e.pavimentoId = parent.pavimentoId;
      e.x = 0;
      e.z = 0;
      e.rotacao = 0;
      e.base = type === 'JANELA' ? Math.min(1, parent.altura / 3) : 0;
      e.altura =
        type === 'JANELA' ? Math.min(1.2, parent.altura - e.base) : Math.min(2.1, parent.altura);
      e.largura = Math.min(type === 'JANELA' ? 1.2 : 0.9, parent.largura);
      e.profundidade = parent.profundidade;
      let found = false;
      for (let offset = 0; offset <= parent.largura; offset += 0.1) {
        for (const sign of [1, -1]) {
          e.deslocamento = rounded(offset * sign);
          if (
            !validation({
              ...next,
              documento: { ...next.documento, elementos: [...next.documento.elementos, e] },
            })
          ) {
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        setError(
          'Não há espaço livre nessa parede para a abertura padrão. Ajuste as medidas existentes.',
        );
        return;
      }
    }
    next.documento.elementos.push(e);
    if (type === 'PAREDE' && connect) connectWalls(next.documento, floor.id);
    if (commit(next)) {
      setFloorId(e.pavimentoId);
      setSelected([e.id]);
      setFit((n) => n + 1);
    }
  }
  function remove() {
    if (!draft || !selected.length) return;
    const ids = new Set(selected);
    for (const e of draft.documento.elementos) if (e.paredeId && ids.has(e.paredeId)) ids.add(e.id);
    const next = copyDraft(draft);
    next.documento.elementos = next.documento.elementos.filter((e) => !ids.has(e.id));
    if (commit(next)) setSelected([]);
  }
  function duplicate() {
    if (!draft) return;
    const source = draft.documento.elementos.filter(
      (e) => selected.includes(e.id) || (!!e.paredeId && selected.includes(e.paredeId)),
    );
    const ids = new Map(source.map((e) => [e.id, uid()]));
    const nodeIds = new Map<string, string>();
    for (const e of source)
      for (const id of [e.noInicioId, e.noFimId])
        if (id && !nodeIds.has(id)) nodeIds.set(id, uid());
    const clonedNodes = (draft.documento.nos || [])
      .filter((n) => nodeIds.has(n.id))
      .map((n) => ({ ...n, id: nodeIds.get(n.id)!, x: n.x + 1, z: n.z + 1 }));
    const copies = source.map((e) => ({
      ...e,
      id: ids.get(e.id)!,
      nome: `${e.nome.slice(0, 90)} cópia`,
      noInicioId: e.noInicioId ? nodeIds.get(e.noInicioId) : null,
      noFimId: e.noFimId ? nodeIds.get(e.noFimId) : null,
      paredeId: e.paredeId ? ids.get(e.paredeId) || e.paredeId : null,
      x: opening(e) ? 0 : e.x + 1,
      z: opening(e) ? 0 : e.z + 1,
      deslocamento: opening(e) && !ids.has(e.paredeId || '') ? e.deslocamento + 1 : e.deslocamento,
    }));
    const next = copyDraft(draft);
    next.documento.elementos.push(...copies);
    if (clonedNodes.length) {
      upgrade(next.documento);
      next.documento.nos!.push(...clonedNodes);
    }
    if (commit(next)) setSelected(copies.map((e) => e.id));
  }
  function move(ids: string[], dx: number, dz: number) {
    if (!draft) return;
    const next = copyDraft(draft);
    const nodes = new Set<string>();
    for (const e of next.documento.elementos.filter((e) => ids.includes(e.id)))
      for (const id of [e.noInicioId, e.noFimId]) if (id) nodes.add(id);
    for (const n of next.documento.nos || [])
      if (nodes.has(n.id)) {
        n.x = rounded(n.x + dx);
        n.z = rounded(n.z + dz);
      }
    for (const e of next.documento.elementos) {
      if (!ids.includes(e.id) || (e.paredeId && ids.includes(e.paredeId))) continue;
      if (opening(e)) {
        const parent = next.documento.elementos.find((p) => p.id === e.paredeId)!;
        const a = (parent.rotacao * Math.PI) / 180;
        e.deslocamento = rounded(e.deslocamento + dx * Math.cos(a) - dz * Math.sin(a));
      } else {
        if (e.noInicioId && e.noFimId) continue;
        e.x = rounded(e.x + dx);
        e.z = rounded(e.z + dz);
      }
    }
    commit(next);
  }
  function applyProperties(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !element) return;
    const data = new FormData(event.currentTarget),
      next = copyDraft(draft),
      target = next.documento.elementos.find((e) => e.id === element.id)!;
    target.nome = String(data.get('nome') || '').trim();
    target.cor = String(data.get('cor'));
    if (!opening(target)) {
      target.pavimentoId = String(data.get('pavimentoId'));
      for (const child of next.documento.elementos)
        if (child.paredeId === target.id) child.pavimentoId = target.pavimentoId;
    }
    for (const key of [
      'largura',
      'altura',
      'base',
      ...(opening(target) ? ['deslocamento'] : ['x', 'z', 'profundidade', 'rotacao']),
    ] as (keyof ModelElement)[]) {
      (target as unknown as Record<string, unknown>)[key] = Number(data.get(key));
    }
    if (target.tipo === 'PAREDE') writeWallNodes(next.documento, target, element.pavimentoId);
    if (commit(next)) setFloorId(target.pavimentoId);
  }
  function addFloor(duplicate = false) {
    if (!draft || !floor) return;
    const next = copyDraft(draft),
      id = uid();
    const cota = Math.max(...next.documento.pavimentos.map((f) => f.cota + f.altura));
    next.documento.pavimentos.push({
      id,
      nome: `Pavimento ${next.documento.pavimentos.length}`,
      cota: rounded(cota),
      altura: floor.altura,
    });
    if (duplicate) {
      const elements = next.documento.elementos.filter((e) => e.pavimentoId === floor.id),
        ids = new Map(elements.map((e) => [e.id, uid()]));
      const nodeIds = new Map(
        (draft.documento.nos || [])
          .filter((n) => n.pavimentoId === floor.id)
          .map((n) => [n.id, uid()]),
      );
      next.documento.elementos.push(
        ...elements.map((e) => ({
          ...e,
          id: ids.get(e.id)!,
          pavimentoId: id,
          paredeId: e.paredeId ? ids.get(e.paredeId)! : null,
          noInicioId: e.noInicioId ? nodeIds.get(e.noInicioId) : null,
          noFimId: e.noFimId ? nodeIds.get(e.noFimId) : null,
        })),
      );
      if (draft.documento.schemaVersao === 2) {
        upgrade(next.documento);
        next.documento.nos!.push(
          ...(draft.documento.nos || [])
            .filter((n) => nodeIds.has(n.id))
            .map((n) => ({ ...n, id: nodeIds.get(n.id)!, pavimentoId: id })),
        );
        next.documento.cotas!.push(
          ...(draft.documento.cotas || [])
            .filter((c) => c.pavimentoId === floor.id)
            .map((c) => ({
              ...c,
              id: uid(),
              pavimentoId: id,
              noAId: c.noAId ? nodeIds.get(c.noAId) : null,
              noBId: c.noBId ? nodeIds.get(c.noBId) : null,
            })),
        );
        next.documento.ambientes!.push(
          ...(draft.documento.ambientes || [])
            .filter((r) => r.pavimentoId === floor.id)
            .map((r) => ({
              ...r,
              id: uid(),
              pavimentoId: id,
              paredeIds: r.paredeIds.map((w) => ids.get(w)!).filter(Boolean),
            })),
        );
      }
    }
    if (commit(next)) {
      setFloorId(id);
      setSelected([]);
    }
  }
  function floorProperties(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !floor) return;
    const data = new FormData(event.currentTarget),
      next = copyDraft(draft),
      f = next.documento.pavimentos.find((f) => f.id === floor.id)!;
    f.nome = String(data.get('nome'));
    f.cota = Number(data.get('cota'));
    f.altura = Number(data.get('altura'));
    commit(next);
  }
  function removeFloor() {
    if (!draft || !floor) return;
    if (draft.documento.pavimentos.length === 1) {
      setError('Mantenha ao menos um pavimento.');
      return;
    }
    if (
      draft.documento.elementos.some((e) => e.pavimentoId === floor.id) ||
      [...(draft.documento.cotas || []), ...(draft.documento.ambientes || [])].some(
        (e) => e.pavimentoId === floor.id,
      )
    ) {
      setError('Remova ou transfira os elementos, cotas e rótulos antes de excluir o pavimento.');
      return;
    }
    const next = copyDraft(draft);
    next.documento.pavimentos = next.documento.pavimentos.filter((f) => f.id !== floor.id);
    if (commit(next)) setFloorId(next.documento.pavimentos[0].id);
  }
  function exportModel(content = draft) {
    if (!content) return;
    const blob = new Blob(
      [
        JSON.stringify(
          { formato: 'obra360-modelador', versaoFormato: content.documento.schemaVersao, ...content },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = `modelo-${saved?.id || 'local'}-r${saved?.revisao || 0}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importModel(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !writable || !draft) return;
    const request = ++importGeneration.current;
    const modelGeneration = generation.current;
    const stillCurrent = () => request === importGeneration.current &&
      modelGeneration === generation.current;
    try {
      if (file.size > 2000000) throw new Error('Arquivo de projeto excede 2 MB.');
      const contents = await file.text();
      if (!stillCurrent()) return;
      const value = JSON.parse(contents);
      if (
        value.formato !== 'obra360-modelador' ||
        ![1, 2].includes(value.versaoFormato) ||
        !value.documento ||
        ![1, 2].includes(value.documento.schemaVersao)
      )
        throw new Error('Use um JSON exportado pelo Modelador Obra360.');
      const next: ModelDraft = { nome: value.nome, documento: value.documento };
      const invalid = validation(next);
      if (invalid) throw new Error(invalid);
      if (commit(next)) {
        setFloorId(next.documento.pavimentos[0].id);
        setSelected([]);
        setFit((n) => n + 1);
        setNotice('Projeto importado como edição local. Confira e salve uma revisão.');
      }
    } catch (e) {
      if (stillCurrent()) setError(e instanceof Error ? e.message : 'Arquivo de projeto inválido.');
    }
  }
  const floorElements = draft?.documento.elementos.filter((e) => e.pavimentoId === floor?.id) || [];
  return (
    <div className="model-module">
      <div className="ws-title-row">
        <div>
          <p className="ws-eyebrow">PROJETOS E GEOMETRIA</p>
          <h1>Modelador 2D/3D</h1>
          <p>Modelos por obra, pavimentos e elementos dimensionados em metros.</p>
        </div>
        <Box size={32} />
      </div>
      <section className="model-library">
        <label>
          Buscar obra
          <input
            aria-label="Buscar obra do modelo"
            value={projectQuery}
            onChange={(e) => setProjectQuery(e.target.value)}
            disabled={busy}
          />
        </label>
        <label>
          Obra
          <select
            aria-label="Obra do modelo"
            value={project}
            onChange={(e) => switchProject(e.target.value)}
            disabled={busy}
          >
            <option value="">Selecione uma obra…</option>
            {project && !projects.some((p) => String(p.id) === project) && (
              <option value={project}>Obra #{project}</option>
            )}
            {projects.map((p) => (
              <option value={p.id} key={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="model-check">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => {
              setIncludeArchived(e.target.checked);
              setModelPage(0);
            }}
          />
          Incluir arquivados
        </label>
        {canEdit && (
          <button
            className="ws-primary"
            disabled={!project || busy}
            onClick={() => {
              setCloneFrom(null);
              setCreating((v) => !v);
            }}
          >
            <Plus size={16} />
            Novo modelo
          </button>
        )}
      </section>
      {creating && (
        <form className="model-create" onSubmit={create}>
          <label>
            Nome do novo modelo
            <input
              aria-label="Nome do novo modelo"
              required
              maxLength={150}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </label>
          <button className="ws-primary" disabled={busy}>
            {cloneFrom ? 'Criar cópia do modelo salvo' : 'Criar modelo vazio'}
          </button>
          <button type="button" onClick={() => setCreating(false)}>
            Cancelar
          </button>
        </form>
      )}
      {error && (
        <div className="ws-alert" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <p className="model-notice" role="status">
          {notice}
        </p>
      )}
      {saved && recoverable && (
        <section className="ws-service-panel" aria-label="Rascunho do navegador">
          <p>{recoverable.version === saved.versao
            ? 'Há um rascunho deste modelo guardado neste navegador.'
            : 'O modelo mudou no banco desde este rascunho. Baixe o arquivo para comparar as versões.'}</p>
          <div className="model-toolbar">
            {recoverable.version === saved.versao && (
              <button type="button" disabled={busy} onClick={() => {
                writtenDraft.current = { key: draftKey(saved.id), raw: recoverable.raw };
                setDraft(copyDraft(recoverable.draft));
                setFloorId(recoverable.draft.documento.pavimentos[0].id);
                setSelected([]);
                setFit((value) => value + 1);
                setRecoverable(null);
                setNotice('Rascunho recuperado. Salve o modelo para registrar uma revisão no banco.');
              }}>Recuperar rascunho</button>
            )}
            <button type="button" disabled={busy} onClick={() => exportModel(recoverable.draft)}>Baixar rascunho JSON</button>
            <button type="button" onClick={() => setComparisonSource(recoverable.draft)}>Comparar com o banco</button>
            <button type="button" disabled={busy} onClick={() => {
              if (!window.confirm('Descartar o rascunho guardado neste navegador?')) return;
              removeLocalDraft(draftKey(saved.id), recoverable.raw);
              setRecoverable(null);
            }}>Descartar rascunho</button>
          </div>
        </section>
      )}
      {geometryDirty && <p className="ws-help">{draftStored
        ? 'Rascunho guardado neste navegador.'
        : 'O navegador não conseguiu guardar o rascunho. Salve o modelo ou exporte o JSON.'}</p>}
      {geometryDirty && !comparisonSource && (
        <button type="button" className="ws-secondary" onClick={() => setComparisonSource(draft)}>
          Comparar com o banco
        </button>
      )}
      {canEdit && saved && draft && (
        <ModelCloudDraft key={saved.id} model={saved} draft={draft} canStore={writable && geometryDirty}
          hasLocalChanges={dirty || !!recoverable} disabled={busy}
          onAssociate={(token) => { cloudDraftToken.current = token; }}
          onCompare={setComparisonSource} onDownload={exportModel}
          onRecover={(recovered) => {
            if (recoverable) writtenDraft.current = { key: draftKey(saved.id), raw: recoverable.raw };
            setRecoverable(null);
            setDraft(copyDraft(recovered));
            setFloorId(recovered.documento.pavimentos[0].id);
            setPast([]);
            setFuture([]);
            setSelected([]);
            setFit((value) => value + 1);
            setComparisonSource(null);
            setNotice('Rascunho do servidor recuperado. Salve para criar a revisão oficial.');
          }} />
      )}
      {comparisonSource && saved && (
        <ModelComparison modelId={saved.id} draft={comparisonSource}
          onClose={() => setComparisonSource(null)} />
      )}
      {project && (
        <div className="model-list" aria-label="Modelos cadastrados">
          {listLoading ? (
            <p>Consultando modelos…</p>
          ) : models.length ? (
            models.map((m) => (
              <button
                key={m.id}
                disabled={busy}
                onClick={() => load(m.id)}
                aria-pressed={saved?.id === m.id}
              >
                <Layers3 size={16} />
                <span>
                  {m.nome}
                  <small>
                    Revisão {m.revisao}
                    {m.arquivado ? ' · Arquivado' : ''}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p>Nenhum modelo cadastrado nesta consulta. Crie um modelo vazio para começar.</p>
          )}
          <div className="model-list-pagination">
            <span>{modelTotal} modelo(s)</span>
            <button
              disabled={modelPage === 0 || listLoading}
              onClick={() => setModelPage((n) => n - 1)}
            >
              Anteriores
            </button>
            <button
              disabled={(modelPage + 1) * 25 >= modelTotal || listLoading}
              onClick={() => setModelPage((n) => n + 1)}
            >
              Próximos
            </button>
          </div>
        </div>
      )}
      {draft && saved && floor ? (
        <>
          <section className="model-savebar">
            <label>
              Nome do modelo
              <input
                aria-label="Nome do modelo"
                value={draft.nome}
                maxLength={150}
                disabled={!writable}
                onChange={(e) => commit({ ...copyDraft(draft), nome: e.target.value })}
              />
            </label>
            <label>
              Motivo da revisão
              <input
                aria-label="Motivo da revisão 3D"
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                disabled={!writable}
              />
            </label>
            <span className={dirty ? 'model-dirty' : 'model-clean'} role="status">
              {saved.arquivado
                ? 'Arquivado'
                : dirty
                  ? 'Alterações não salvas'
                  : `Salvo · revisão ${saved.revisao}`}
            </span>
            <button className="ws-primary" onClick={save} disabled={!writable || !dirty}>
              <Save size={16} />
              Salvar modelo
            </button>
            <button onClick={() => load(saved.id)} disabled={busy}>
              Recarregar
            </button>
            {canEdit && (
              <button
                disabled={busy || dirty}
                onClick={() => {
                  setCloneFrom(saved.id);
                  setModelName(`${saved.nome.slice(0, 140)} cópia`);
                  setCreating(true);
                }}
              >
                Duplicar modelo salvo
              </button>
            )}
            {canEdit && (
              <button onClick={archive} disabled={busy || !!recoverable}>
                {saved.arquivado ? 'Reativar modelo' : 'Arquivar modelo'}
              </button>
            )}
          </section>
          <section className="model-toolbar" aria-label="Ferramentas de modelagem">
            <button onClick={undo} disabled={!writable || !past.length} title="Ctrl+Z">
              <Undo2 size={16} />
              Desfazer
            </button>
            <button onClick={redo} disabled={!writable || !future.length} title="Ctrl+Y">
              <Redo2 size={16} />
              Refazer
            </button>
            {(['PAREDE', 'LAJE', 'PILAR', 'PORTA', 'JANELA'] as ElementType[]).map((t) => (
              <button key={t} onClick={() => add(t)} disabled={!writable}>
                <Plus size={14} />
                Adicionar {typeNames[t].toLowerCase()}
              </button>
            ))}
            <button
              className={drawWall ? 'is-active' : ''}
              disabled={!writable || view === '3d' || !!calibration || (!!floorReference && !floorReference.calibrated)}
              onClick={() => {
                setDrawWall((v) => !v);
                setMeasure(false);
              }}
            >
              Desenhar parede
            </button>
            <button
              disabled={!writable || view === '3d'}
              className={measure ? 'is-active' : ''}
              onClick={() => {
                setMeasure((v) => !v);
                setDrawWall(false);
              }}
            >
              Desenhar cota
            </button>
            <label className="model-check">
              <input
                type="checkbox"
                checked={connect}
                onChange={(e) => setConnect(e.target.checked)}
                disabled={!writable}
              />
              Conectar extremidades ao desenhar
            </label>
            <button onClick={duplicate} disabled={!writable || !selected.length}>
              <Copy size={14} />
              Duplicar seleção
            </button>
            <button onClick={remove} disabled={!writable || !selected.length}>
              <Trash2 size={14} />
              Excluir seleção
            </button>
            <button onClick={() => exportModel()}>
              <Download size={14} />
              Exportar projeto JSON
            </button>
            <button disabled={!writable} onClick={() => importInput.current?.click()}>
              <Upload size={14} />
              Importar projeto JSON
            </button>
            <input
              type="file"
              accept=".json,application/json"
              ref={importInput}
              hidden
              aria-label="Arquivo de projeto JSON"
              onChange={importModel}
            />
          </section>
          {referenceLoading && <p role="status">Carregando referência da revisão…</p>}
          {referenceChanged && <p className="ws-help">Salve o modelo para registrar a alteração da referência.</p>}
          {canEdit && !saved.arquivado && (
            <ModelReference key={`${saved.id}:${saved.revisao}:${floor.id}`}
              reference={floorReference} floorId={floor.id} calibrated={!!floorReference?.calibrated}
              calibrating={!!calibration} disabled={!writable || referenceLoading}
              onLoad={(image) => {
                setReference(image);
                setReferenceChanged(true);
                setView('split');
                setDrawWall(false);
                setMeasure(false);
                setCalibration(null);
                setFit((value) => value + 1);
              }}
              onCalibrate={(meters) => {
                setError('');
                setCalibration(meters === null ? null : { meters });
                setDrawWall(false);
                setMeasure(false);
                setView('split');
              }}
              onRemove={() => {
                setReference(null);
                setReferenceChanged(!!saved.referencia);
                setCalibration(null);
                setDrawWall(false);
              }} />
          )}
          {calibration && <p role="status">{calibration.first
            ? 'Marque o segundo ponto da distância na imagem.'
            : 'Marque o primeiro ponto da distância na imagem.'}</p>}
          <div className="model-view-options">
            <label>
              Pavimento
              <select
                aria-label="Pavimento ativo"
                value={floor.id}
                onChange={(e) => {
                  setFloorId(e.target.value);
                  setSelected([]);
                  setDrawWall(false);
                  setCalibration(null);
                }}
              >
                {draft.documento.pavimentos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome} · cota {f.cota} m
                  </option>
                ))}
              </select>
            </label>
            <label>
              Visualização
              <select
                aria-label="Modo de visualização do modelo"
                value={view}
                onChange={(e) => {
                  setView(e.target.value as typeof view);
                  if (e.target.value === '3d') setCalibration(null);
                }}
              >
                <option value="split">Planta e 3D</option>
                <option value="2d">Planta 2D</option>
                <option value="3d">Vista 3D</option>
              </select>
            </label>
            <label>
              Encaixe na grade
              <select
                aria-label="Encaixe na grade"
                value={snap}
                onChange={(e) => setSnap(Number(e.target.value))}
              >
                {[0.1, 0.25, 0.5, 1].map((n) => (
                  <option value={n} key={n}>
                    {n} m
                  </option>
                ))}
              </select>
            </label>
            <label className="model-check">
              <input
                type="checkbox"
                checked={allFloors}
                onChange={(e) => setAllFloors(e.target.checked)}
              />
              Todos os pavimentos em 3D
            </label>
            <button onClick={() => setFit((n) => n + 1)}>Enquadrar modelo</button>
          </div>
          <PlanTools
            draft={draft}
            floorId={floor.id}
            selected={selected}
            writable={writable}
            onChange={commit}
            projectName={projects.find((p) => String(p.id) === project)?.nome || `Obra #${project}`}
            revision={saved.revisao}
            dirty={dirty}
          />
          <div className="model-workbench">
            <div className={`model-canvases view-${view}`}>
              {view !== '3d' && (
                <ModelPlan
                  documento={draft.documento}
                  floorId={floor.id}
                  reference={floorReference}
                  calibrationPoint={calibration?.first}
                  onCalibrate={calibration && writable ? calibrate : undefined}
                  selected={selected}
                  onSelect={select}
                  editable={writable}
                  drawWall={drawWall}
                  measure={measure}
                  connect={connect}
                  onNodeMove={(id, x, z) => {
                    const next = copyDraft(draft);
                    const node = next.documento.nos?.find((n) => n.id === id);
                    if (node) {
                      const other = next.documento.nos?.find(
                        (n) =>
                          n.id !== id &&
                          n.pavimentoId === node.pavimentoId &&
                          Math.hypot(n.x - x, n.z - z) < 0.001,
                      );
                      if (other) {
                        for (const e of next.documento.elementos) {
                          if (e.noInicioId === id) e.noInicioId = other.id;
                          if (e.noFimId === id) e.noFimId = other.id;
                        }
                        for (const c of next.documento.cotas || []) {
                          if (c.noAId === id) c.noAId = other.id;
                          if (c.noBId === id) c.noBId = other.id;
                        }
                      } else {
                        node.x = x;
                        node.z = z;
                      }
                      commit(next);
                    }
                  }}
                  onDimension={(a, b) => {
                    const next = copyDraft(draft);
                    upgrade(next.documento);
                    const find = (p: { x: number; z: number }) =>
                      next.documento.nos!.find(
                        (n) =>
                          n.pavimentoId === floor.id && Math.hypot(n.x - p.x, n.z - p.z) < 0.001,
                      )?.id || null;
                    next.documento.cotas!.push({
                      id: uid(),
                      pavimentoId: floor.id,
                      tipo: 'ALINHADA',
                      ax: a.x,
                      az: a.z,
                      bx: b.x,
                      bz: b.z,
                      afastamento: 0.4,
                      noAId: find(a),
                      noBId: find(b),
                    });
                    commit(next);
                    setMeasure(false);
                  }}
                  snap={snap}
                  fit={fit}
                  onMove={move}
                  onWall={(x, z, width, angle) => add('PAREDE', { x, z, width, angle })}
                  onDrawEnd={() => setDrawWall(false)}
                />
              )}
              {view !== '2d' && (
                <ModelViewport
                  documento={draft.documento}
                  floorId={floor.id}
                  allFloors={allFloors}
                  selected={selected}
                  onSelect={select}
                  fit={fit}
                />
              )}
            </div>
            <aside className="model-inspector">
              <h2>Elementos do pavimento</h2>
              <input
                aria-label="Buscar elemento do modelo"
                placeholder="Buscar pelo nome…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <p>
                {floorElements.length} elemento(s) · {selected.length} selecionado(s)
              </p>
              <div className="model-element-list">
                {floorElements
                  .filter((e) => e.nome.toLowerCase().includes(filter.toLowerCase()))
                  .map((e) => (
                    <button
                      key={e.id}
                      className={selected.includes(e.id) ? 'is-active' : ''}
                      onClick={(event) => select(e.id, event.shiftKey)}
                    >
                      {typeNames[e.tipo]} · {e.nome}
                    </button>
                  ))}
              </div>
              {element && selected.length === 1 ? (
                <form key={JSON.stringify(element)} onSubmit={applyProperties}>
                  <h3>Propriedades · {typeNames[element.tipo]}</h3>
                  {!opening(element) && (
                    <label>
                      Pavimento do elemento
                      <select
                        name="pavimentoId"
                        aria-label="Pavimento do elemento"
                        defaultValue={element.pavimentoId}
                        disabled={!writable}
                      >
                        {draft.documento.pavimentos.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    Nome do elemento
                    <input
                      name="nome"
                      aria-label="Nome do elemento"
                      defaultValue={element.nome}
                      maxLength={100}
                      required
                      disabled={!writable}
                    />
                  </label>
                  {(opening(element)
                    ? [
                        ['deslocamento', 'Deslocamento na parede (m)'],
                        ['largura', 'Largura (m)'],
                        ['altura', 'Altura (m)'],
                        ['base', 'Peitoril / base (m)'],
                      ]
                    : [
                        ['x', 'Posição X (m)'],
                        ['z', 'Posição Z (m)'],
                        ['largura', 'Largura (m)'],
                        [
                          'profundidade',
                          element.tipo === 'PAREDE' ? 'Espessura (m)' : 'Profundidade (m)',
                        ],
                        ['altura', 'Altura (m)'],
                        ['base', 'Base no pavimento (m)'],
                        ['rotacao', 'Rotação Y (graus)'],
                      ]
                  ).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        name={key}
                        aria-label={label}
                        type="number"
                        step="0.0001"
                        required
                        defaultValue={Number(element[key as keyof ModelElement])}
                        disabled={!writable || (element.tipo === 'PORTA' && key === 'base')}
                      />
                      {element.tipo === 'PORTA' && key === 'base' && (
                        <input type="hidden" name="base" value={0} />
                      )}
                    </label>
                  ))}
                  <label>
                    Cor
                    <input
                      type="color"
                      name="cor"
                      aria-label="Cor do elemento"
                      defaultValue={element.cor}
                      disabled={!writable}
                    />
                  </label>
                  <button className="ws-primary" disabled={!writable}>
                    Aplicar propriedades
                  </button>
                  {opening(element) && (
                    <small>
                      A posição e a rotação acompanham a parede. A base é relativa à base da parede.
                    </small>
                  )}
                </form>
              ) : (
                <p>
                  Selecione um elemento para editar medidas. Use Shift para selecionar vários e
                  mover ou duplicar.
                </p>
              )}
              <details>
                <summary>Pavimento e estrutura</summary>
                <form
                  key={`${floor.id}-${floor.nome}-${floor.cota}-${floor.altura}`}
                  onSubmit={floorProperties}
                >
                  <label>
                    Nome do pavimento
                    <input
                      name="nome"
                      aria-label="Nome do pavimento"
                      defaultValue={floor.nome}
                      required
                      maxLength={100}
                      disabled={!writable}
                    />
                  </label>
                  <label>
                    Cota do pavimento (m)
                    <input
                      name="cota"
                      aria-label="Cota do pavimento (m)"
                      type="number"
                      defaultValue={floor.cota}
                      required
                      step="0.01"
                      min={-1000}
                      max={10000}
                      disabled={!writable}
                    />
                  </label>
                  <label>
                    Altura do pavimento (m)
                    <input
                      name="altura"
                      aria-label="Altura do pavimento (m)"
                      type="number"
                      defaultValue={floor.altura}
                      required
                      step="0.01"
                      min={0.1}
                      max={100}
                      disabled={!writable}
                    />
                  </label>
                  <button disabled={!writable}>Aplicar pavimento</button>
                </form>
                <div className="model-floor-actions">
                  <button disabled={!writable} onClick={() => addFloor()}>
                    Adicionar pavimento
                  </button>
                  <button disabled={!writable} onClick={() => addFloor(true)}>
                    Duplicar pavimento
                  </button>
                  <button disabled={!writable} onClick={removeFloor}>
                    Excluir pavimento vazio
                  </button>
                </div>
              </details>
            </aside>
          </div>
          {role === 'SUPER_ADMIN' && (
            <details key={saved.id} className="model-plan-tools" onToggle={(event) => setPublication(event.currentTarget.open)}>
              <summary>Compartilhar planta com o cliente</summary>
              {publication && <ModelPublication key={saved.id} model={saved} disabled={busy || dirty || !!recoverable}
                onPublished={(updated) => setSaved((current) =>
                  current?.id === updated.id && current.versao <= updated.versao ? updated : current
                )} />}
              {dirty && <p>Salve o rascunho antes de alterar a publicação.</p>}
            </details>
          )}
          <details className="model-revisions" onToggle={(event) => {
            if (!event.currentTarget.open) setTimeline(false);
          }}>
            <summary>Revisões salvas · {revisionTotal}</summary>
            <p>Restaurar cria uma nova revisão. O histórico anterior permanece disponível.</p>
            <button className="ws-secondary" onClick={() => setTimeline((value) => !value)}>
              {timeline ? 'Fechar timelapse' : 'Abrir timelapse'}
            </button>
            {timeline && <ModelTimeline key={saved.id} modelId={saved.id} last={saved.revisao} />}
            {revisions.map((r) => (
              <div key={r.id}>
                <span>
                  <strong>
                    Revisão {r.numero} · {r.nome}
                  </strong>
                  <small>
                    {r.motivo} · usuário #{r.usuarioId} ·{' '}
                    {new Date(r.criadoEm).toLocaleString('pt-BR')}
                  </small>
                </span>
                {canEdit && (
                  <button
                    disabled={!writable || r.numero === saved.revisao}
                    onClick={() => restore(r)}
                  >
                    Restaurar revisão {r.numero}
                  </button>
                )}
              </div>
            ))}
            <div className="model-list-pagination">
              <button disabled={revisionPage === 0} onClick={() => setRevisionPage((n) => n - 1)}>
                Revisões anteriores na lista
              </button>
              <button
                disabled={(revisionPage + 1) * 20 >= revisionTotal}
                onClick={() => setRevisionPage((n) => n + 1)}
              >
                Mais revisões
              </button>
            </div>
          </details>
        </>
      ) : (
        <div className="model-empty">
          <Box size={42} />
          <h2>Escolha uma obra e abra um modelo</h2>
          <p>
            Os modelos começam vazios. Crie os pavimentos e elementos reais do seu projeto e salve
            as revisões no banco.
          </p>
        </div>
      )}
      <p className="model-footnote">
        Editor arquitetônico básico, com limites de 50 pavimentos e 2.000 elementos por modelo. As
        medidas são informadas pelo usuário. PDF e imagem servem como referência para traçar a
        geometria. A conferência das medidas e a aprovação técnica são feitas pelo responsável.
      </p>
    </div>
  );
}

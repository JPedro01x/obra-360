import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { ElementTransform } from '../services/modelTransform';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { anchor, ModelDocument, ModelElement, opening, wallCells } from '../services/modelGeometry';
import { useAppearance } from './Appearance';

export function ModelViewport({
  documento,
  floorId,
  allFloors,
  selected,
  onSelect,
  fit,
  writable = false,
  snap = 0.1,
  onTransform,
}: {
  documento: ModelDocument;
  floorId: string;
  allFloors: boolean;
  selected: string[];
  onSelect: (id: string, extend: boolean) => void;
  fit: number;
  writable?: boolean;
  snap?: number;
  onTransform?: (id: string, change: ElementTransform) => boolean;
}) {
  const { resolved } = useAppearance();
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    group: THREE.Group;
    grid: THREE.GridHelper;
    fit: () => void;
    render: () => void;
    gizmo: TransformControls;
    configure: () => void;
    cancel: () => void;
  } | null>(null);
  const selection = useRef(onSelect);
  selection.current = onSelect;
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'navigate' | 'translate' | 'rotate' | 'scale'>('navigate');
  const interaction = useRef({ writable, snap, onTransform, mode, documento, selected });
  interaction.current = { writable, snap, onTransform, mode, documento, selected };
  const selectedElement =
    selected.length === 1 ? documento.elementos.find((e) => e.id === selected[0]) : undefined;
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setError(
        'WebGL não está disponível neste navegador. A planta 2D e o salvamento continuam disponíveis.',
      );
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(resolved === 'light' ? 0xf1f1f4 : 0x141416);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', 'Vista 3D do modelo');
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.tabIndex = 0;
    node.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, 1, 0.01, 50000),
      controls = new OrbitControls(camera, renderer.domElement),
      group = new THREE.Group();
    const gizmo = new TransformControls(camera, renderer.domElement);
    gizmo.setSize(1.05);
    scene.add(gizmo);
    scene.add(group);
    controls.enableDamping = true;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x7a889a, 2.3));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(12, 25, 18);
    scene.add(sun);
    const grid = new THREE.GridHelper(
      40,
      80,
      resolved === 'light' ? 0x8a8a95 : 0x71717a,
      resolved === 'light' ? 0xd9d9df : 0x303036,
    );
    grid.position.y = -0.02;
    scene.add(grid);
    const fitScene = () => {
      const box = new THREE.Box3().setFromObject(group);
      const center = box.isEmpty()
        ? new THREE.Vector3(0, 1, 0)
        : box.getCenter(new THREE.Vector3());
      const radius = box.isEmpty()
        ? 8
        : Math.max(2, box.getSize(new THREE.Vector3()).length() * 0.8);
      camera.position.copy(center).add(new THREE.Vector3(radius, radius * 0.8, radius));
      controls.target.copy(center);
      controls.update();
    };
    let request = 0;
    const render = () => {
      if (!request && !document.hidden) request = requestAnimationFrame(frame);
    };
    const frame = () => {
      request = 0;
      const changing = controls.update();
      renderer.render(scene, camera);
      if (changing) render();
    };
    controls.addEventListener('change', render);
    gizmo.addEventListener('change', render);
    type Original = {
      object: THREE.Object3D;
      position: THREE.Vector3;
      quaternion: THREE.Quaternion;
      scale: THREE.Vector3;
    };
    let gesture: {
      object: THREE.Object3D;
      documento: ModelDocument;
      originals: Original[];
    } | null = null;
    let manipulated = false;
    const restore = () => {
      for (const original of gesture?.originals || []) {
        original.object.position.copy(original.position);
        original.object.quaternion.copy(original.quaternion);
        original.object.scale.copy(original.scale);
      }
      gesture?.object.updateMatrixWorld(true);
    };
    const cancel = () => {
      restore();
      gesture = null;
      gizmo.dragging = false;
      controls.enabled = true;
      render();
    };
    const configure = () => {
      const current = interaction.current;
      const element = current.documento.elementos.find(
        (e) => current.selected.length === 1 && e.id === current.selected[0],
      );
      let object: THREE.Object3D | undefined;
      group.traverse((o) => {
        if (o.userData.id === element?.id) object = o;
      });
      gizmo.detach();
      if (
        !current.writable ||
        !current.onTransform ||
        current.mode === 'navigate' ||
        !element ||
        !object ||
        (element.tipo === 'MALHA_IFC' && current.mode === 'scale') ||
        (opening(element) && current.mode === 'rotate')
      )
        return;
      gizmo.setMode(current.mode);
      gizmo.setSpace(current.mode === 'scale' || opening(element) ? 'local' : 'world');
      gizmo.setTranslationSnap(current.snap);
      gizmo.setRotationSnap((5 * Math.PI) / 180);
      gizmo.setScaleSnap(0.05);
      gizmo.showX = current.mode !== 'rotate';
      gizmo.showY = current.mode !== 'translate' || element.tipo !== 'PORTA';
      gizmo.showZ = current.mode !== 'rotate' && !opening(element);
      gizmo.attach(object);
      render();
    };
    const start = () => {
      const current = interaction.current,
        object = gizmo.object;
      if (!current.writable || !object) return;
      const originals = [object, ...object.children.filter((child) => child.userData.id)].map(
        (object) => ({
          object,
          position: object.position.clone(),
          quaternion: object.quaternion.clone(),
          scale: object.scale.clone(),
        }),
      );
      gesture = { object, documento: current.documento, originals };
      manipulated = true;
    };
    const preview = () => {
      if (!gesture || gesture.object.scale.toArray().some((value) => value <= 0.0001)) return;
      // A wall resize must not stretch its doors/windows or their offsets.
      const scale = gesture.object.scale;
      for (const child of gesture.originals.slice(1)) {
        child.object.position.copy(child.position).divide(scale);
        child.object.scale.copy(child.scale).divide(scale);
      }
    };
    const finish = () => {
      const current = interaction.current;
      if (!gesture) return;
      const { object, documento: originalDocument } = gesture;
      object.updateWorldMatrix(true, false);
      const position = object.getWorldPosition(new THREE.Vector3());
      const direction = new THREE.Vector3(1, 0, 0).applyQuaternion(
        object.getWorldQuaternion(new THREE.Quaternion()),
      );
      const change: ElementTransform = {
        x: position.x,
        y: position.y,
        z: position.z,
        rotation: (Math.atan2(-direction.z, direction.x) * 180) / Math.PI,
        scaleX: object.scale.x,
        scaleY: object.scale.y,
        scaleZ: object.scale.z,
      };
      const id = object.userData.id as string;
      restore();
      gesture = null;
      controls.enabled = true;
      if (current.writable && current.documento === originalDocument)
        current.onTransform?.(id, change);
      render();
    };
    gizmo.addEventListener('mouseDown', start);
    gizmo.addEventListener('mouseUp', finish);
    gizmo.addEventListener('objectChange', preview);
    gizmo.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    };
    renderer.domElement.addEventListener('keydown', escape);
    renderer.domElement.addEventListener('pointercancel', cancel);
    document.addEventListener('visibilitychange', render);
    runtime.current = {
      scene,
      camera,
      renderer,
      controls,
      group,
      grid,
      fit: fitScene,
      render,
      gizmo,
      configure,
      cancel,
    };
    fitScene();
    const resize = () => {
      const w = node.clientWidth,
        h = node.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();
    render();
    let downX = 0,
      downY = 0;
    const down = (event: PointerEvent) => {
      if (!gizmo.dragging) manipulated = false;
      downX = event.clientX;
      downY = event.clientY;
    };
    const pick = (event: PointerEvent) => {
      if (manipulated || gizmo.dragging || gizmo.axis) return;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(group.children, true).find((h) => h.object.userData.id);
      if (hit) selection.current(hit.object.userData.id, event.shiftKey);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      cancel();
      gizmo.detach();
      gizmo.enabled = false;
      controls.enabled = false;
      setError(
        'A vista 3D perdeu o contexto gráfico. Use a planta 2D e recarregue a vista após salvar.',
      );
    };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointerup', pick);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      cancelAnimationFrame(request);
      observer.disconnect();
      controls.dispose();
      gizmo.detach();
      gizmo.dispose();
      renderer.domElement.removeEventListener('keydown', escape);
      renderer.domElement.removeEventListener('pointercancel', cancel);
      document.removeEventListener('visibilitychange', render);
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointerup', pick);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      dispose(group);
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
      runtime.current = null;
    };
  }, []);
  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    state.renderer.setClearColor(resolved === 'light' ? 0xf1f1f4 : 0x141416);
    const reference = new THREE.GridHelper(
      40,
      80,
      resolved === 'light' ? 0x8a8a95 : 0x71717a,
      resolved === 'light' ? 0xd9d9df : 0x303036,
    );
    const colors = state.grid.geometry.getAttribute('color');
    const referenceColors = reference.geometry.getAttribute('color');
    for (let i = 0; i < colors.count; i++)
      colors.setXYZ(i, referenceColors.getX(i), referenceColors.getY(i), referenceColors.getZ(i));
    colors.needsUpdate = true;
    reference.geometry.dispose();
    (reference.material as THREE.Material).dispose();
    state.render();
  }, [resolved]);
  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    state.cancel();
    state.gizmo.detach();
    dispose(state.group);
    for (const element of documento.elementos) {
      if (!allFloors && element.pavimentoId !== floorId) continue;
      const floor = documento.pavimentos.find((f) => f.id === element.pavimentoId);
      if (!floor) continue;
      let geometry: THREE.BufferGeometry;
      if (element.tipo === 'MALHA_IFC' && !element.malhaIfc) {
        setError(`A malha IFC “${element.nome}” não contém buffers válidos.`);
        continue;
      } else if (element.tipo === 'MALHA_IFC' && element.malhaIfc) {
        const positions = new Float32Array(decodeBase64(element.malhaIfc.positionsBase64).buffer);
        const indices = new Uint32Array(decodeBase64(element.malhaIfc.indicesBase64).buffer);
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
      } else if (element.tipo === 'PAREDE') {
        const pieces = wallCells(element, documento.elementos).map((cell) => {
          const g = new THREE.BoxGeometry(cell.width, cell.height, element.profundidade);
          g.translate(cell.x, cell.y, 0);
          return g;
        });
        if (!pieces.length) continue;
        geometry = mergeGeometries(pieces);
        for (const p of pieces) p.dispose();
      } else {
        geometry = new THREE.BoxGeometry(
          element.largura,
          element.altura,
          opening(element)
            ? Math.min(0.06, anchor(element, documento.elementos).profundidade)
            : element.profundidade,
        );
        geometry.translate(0, element.altura / 2, 0);
      }
      const position = anchor(element, documento.elementos);
      if (element.tipo === 'MALHA_IFC') position.base = element.base + element.altura / 2;
      const material = new THREE.MeshStandardMaterial({
        color: element.cor,
        roughness: 0.75,
        metalness: 0,
        transparent: element.tipo === 'JANELA' || element.tipo === 'LAJE',
        opacity: element.tipo === 'JANELA' ? 0.45 : element.tipo === 'LAJE' ? 0.72 : 1,
        emissive: selected.includes(element.id) ? 0x704000 : 0x000000,
        emissiveIntensity: 0.35,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position.x, floor.cota + position.base, position.z);
      mesh.rotation.y = (position.rotacao * Math.PI) / 180;
      mesh.userData.id = element.id;
      state.group.add(mesh);
      if (selected.includes(element.id)) {
        const outline = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry),
          new THREE.LineBasicMaterial({ color: 0xf97316 }),
        );
        mesh.add(outline);
      }
    }
    state.group.updateMatrixWorld(true);
    const meshes = [...state.group.children];
    for (const mesh of meshes) {
      const element = documento.elementos.find((e) => e.id === mesh.userData.id);
      if (element?.paredeId)
        meshes.find((parent) => parent.userData.id === element.paredeId)?.attach(mesh);
    }
    state.configure();
    state.render();
  }, [documento, floorId, allFloors, selected]);
  useEffect(() => {
    runtime.current?.cancel();
    runtime.current?.configure();
  }, [mode, writable, snap]);
  useEffect(() => {
    runtime.current?.fit();
  }, [fit, floorId, allFloors]);
  return (
    <div className="model-three">
      {writable && !error && (
        <div className="model-three-tools" role="group" aria-label="Edição na vista 3D">
          {(
            [
              ['navigate', 'Navegar'],
              ['translate', 'Mover 3D'],
              ['rotate', 'Girar 3D'],
              ['scale', 'Dimensionar 3D'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={mode === value}
              disabled={
                value !== 'navigate' &&
                (!selectedElement ||
                  (value === 'rotate' && opening(selectedElement)) ||
                  (value === 'scale' && selectedElement.tipo === 'MALHA_IFC'))
              }
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div ref={host} className="model-three-canvas" />
      {error && (
        <div role="alert" className="model-webgl-error">
          {error}
        </div>
      )}
      <p className="model-viewport-hint">
        Arraste para orbitar · botão direito para deslocar · roda para aproximar · clique para
        selecionar.{' '}
        {writable &&
          'Selecione um elemento e escolha uma ferramenta 3D. Solte para aplicar; Esc cancela. Girar: passos de 5°; dimensionar: passos de 5%. Aberturas se movem ao longo da parede.'}
      </p>
    </div>
  );
}
function dispose(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((m: THREE.Material) => m.dispose());
    }
  });
  group.clear();
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function footprint(element: ModelElement, elements: ModelElement[]) {
  const p = anchor(element, elements);
  return {
    x: p.x,
    z: p.z,
    width: element.largura,
    depth: opening(element) ? Math.max(0.12, p.profundidade) : element.profundidade,
    angle: -p.rotacao,
  };
}

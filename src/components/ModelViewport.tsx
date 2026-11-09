import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
}: {
  documento: ModelDocument;
  floorId: string;
  allFloors: boolean;
  selected: string[];
  onSelect: (id: string, extend: boolean) => void;
  fit: number;
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
  } | null>(null);
  const selection = useRef(onSelect);
  selection.current = onSelect;
  const [error, setError] = useState('');
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
    runtime.current = { scene, camera, renderer, controls, group, grid, fit: fitScene };
    fitScene();
    const resize = () => {
      const w = node.clientWidth,
        h = node.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();
    let request = 0;
    const animate = () => {
      request = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    let downX = 0,
      downY = 0;
    const down = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
    };
    const pick = (event: PointerEvent) => {
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
  }, [resolved]);
  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    dispose(state.group);
    for (const element of documento.elementos) {
      if (!allFloors && element.pavimentoId !== floorId) continue;
      const floor = documento.pavimentos.find((f) => f.id === element.pavimentoId);
      if (!floor) continue;
      let geometry: THREE.BufferGeometry;
      if (element.tipo === 'PAREDE') {
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
  }, [documento, floorId, allFloors, selected]);
  useEffect(() => {
    runtime.current?.fit();
  }, [fit, floorId, allFloors]);
  return (
    <div className="model-three">
      <div ref={host} className="model-three-canvas" />
      {error && (
        <div role="alert" className="model-webgl-error">
          {error}
        </div>
      )}
      <p className="model-viewport-hint">
        Arraste para orbitar · botão direito para deslocar · roda para aproximar · clique para
        selecionar
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

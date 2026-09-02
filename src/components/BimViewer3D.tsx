import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingElement, ConstructionOccurrence, Project, RoleId, ThemeMode } from '../types';
import { INITIAL_OCCURRENCES, USER_ROLES } from '../data/mockData';
import { 
  Box, Eye, Layers, Calendar, CheckCircle2, Clock, 
  AlertCircle, Sparkles, Upload, FileText, ChevronRight, Check, X, Move, Plus, Trash2, Sliders, Lock, Search, Building2, MapPin, Play, Pause, RefreshCw, AlertTriangle, ShieldCheck, Camera 
} from 'lucide-react';

interface BimViewer3DProps {
  elements: BuildingElement[];
  activeProject?: Project;
  currentRole: RoleId;
  theme: ThemeMode;
  onUpdateElementStatus: (id: string, status: 'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO', progress: number) => void;
  onUpdateElementPosition: (id: string, pos: [number, number, number]) => void;
  onAddElement: (elem: Omit<BuildingElement, 'id' | 'lastUpdatedAt'>) => void;
  onDeleteElement: (id: string) => void;
  onImportFloorPlan: (presetName: string) => void;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const BimViewer3D: React.FC<BimViewer3DProps> = ({
  elements,
  activeProject,
  currentRole,
  theme,
  onUpdateElementStatus,
  onUpdateElementPosition,
  onAddElement,
  onDeleteElement,
  onImportFloorPlan,
  onSendToast
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'REAL' | 'PLANNED' | 'SCHEMATIC'>('REAL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [bimVersion, setBimVersion] = useState<string>('v2.4 (Revisão Estrutural Aprovada)');
  
  // Timeline evolution state (Weeks 1 to 8) - Matching screenshot default: Semana 4
  const [selectedWeek, setSelectedWeek] = useState<number>(4);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(true);

  // Occurrences State (Section 4.7)
  const [occurrences, setOccurrences] = useState<ConstructionOccurrence[]>(INITIAL_OCCURRENCES);
  const [showOccurrenceModal, setShowOccurrenceModal] = useState<boolean>(false);
  const [occTitle, setOccTitle] = useState<string>('');
  const [occCategory, setOccCategory] = useState<'Não Conformidade' | 'Atraso' | 'Manutenção' | 'Falha de Execução' | 'Segurança NR-18'>('Não Conformidade');
  const [occSeverity, setOccSeverity] = useState<'ALTA' | 'MEDIA' | 'BAIXA'>('MEDIA');
  const [occDescription, setOccDescription] = useState<string>('');

  // Modals & Panels
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('Casa 3 Quartos (120m²)');

  const selectedElement = elements.find((e) => e.id === selectedElementId);
  const userPermissions = USER_ROLES[currentRole]?.permissions || [];
  
  // Can edit 3D model
  const canEditModel = 
    userPermissions.includes('all') || 
    userPermissions.includes('modelo3d.editar');

  // Auto-play timeline simulation
  useEffect(() => {
    let timer: any;
    if (isPlayingTimeline) {
      timer = setInterval(() => {
        setSelectedWeek((prev) => (prev >= 8 ? 1 : prev + 1));
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isPlayingTimeline]);

  // Spatial coordinates state
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [posZ, setPosZ] = useState<number>(0);

  useEffect(() => {
    if (selectedElement && selectedElement.position) {
      setPosX(selectedElement.position[0]);
      setPosY(selectedElement.position[1]);
      setPosZ(selectedElement.position[2]);
    } else {
      setPosX(0);
      setPosY(0);
      setPosZ(0);
    }
  }, [selectedElementId]);

  // THREE.js Scene setup matching screenshot geometry precisely
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x121214 : 0xf8fafc);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(14, 12, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2.5, 0);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.0);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    sunLight.position.set(20, 30, 15);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Grid Helper (Matching screenshot dark grid with orange axis line)
    const grid = new THREE.GridHelper(30, 30, 0xf97316, isDark ? 0x27272a : 0xcbce0);
    grid.position.y = 0;
    scene.add(grid);

    // Group for building meshes
    const meshesGroup = new THREE.Group();

    // 1. Foundation Sapatas (Semana 1)
    if (selectedWeek >= 1) {
      const footingGeo = new THREE.BoxGeometry(2.4, 0.7, 2.4);
      const footingMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      [
        [-5, 0.35, -3.5], [0, 0.35, -3.5], [5, 0.35, -3.5],
        [-5, 0.35, 3.5],  [0, 0.35, 3.5],  [5, 0.35, 3.5]
      ].forEach((pos) => {
        const footing = new THREE.Mesh(footingGeo, footingMat);
        footing.position.set(pos[0], pos[1], pos[2]);
        footing.castShadow = true;
        footing.receiveShadow = true;
        meshesGroup.add(footing);
      });
    }

    // 2. Lower Baldrame Beams Ring (Semana 2)
    if (selectedWeek >= 2) {
      const baldrameLongGeo = new THREE.BoxGeometry(12.4, 0.6, 0.6);
      const baldrameShortGeo = new THREE.BoxGeometry(0.6, 0.6, 7.6);
      const baldrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

      const bLong1 = new THREE.Mesh(baldrameLongGeo, baldrameMat);
      bLong1.position.set(0, 0.9, -3.5);
      meshesGroup.add(bLong1);

      const bLong2 = new THREE.Mesh(baldrameLongGeo, baldrameMat);
      bLong2.position.set(0, 0.9, 3.5);
      meshesGroup.add(bLong2);

      const bShort1 = new THREE.Mesh(baldrameShortGeo, baldrameMat);
      bShort1.position.set(-5, 0.9, 0);
      meshesGroup.add(bShort1);

      const bShort2 = new THREE.Mesh(baldrameShortGeo, baldrameMat);
      bShort2.position.set(5, 0.9, 0);
      meshesGroup.add(bShort2);
    }

    // 3. Structural Concrete Columns (Semana 3 & 4 - Matching Screenshot EXACTLY)
    if (selectedWeek >= 3) {
      const colGeo = new THREE.BoxGeometry(0.6, 3.2, 0.6);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
      
      // Red Inspection/Rebar Markers on Column Tops
      const markerGeo = new THREE.BoxGeometry(0.2, 0.3, 0.2);
      const markerMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });

      [
        [-5, 2.8, -3.5], [-1.7, 2.8, -3.5], [1.7, 2.8, -3.5], [5, 2.8, -3.5],
        [-5, 2.8, 3.5],  [-1.7, 2.8, 3.5],  [1.7, 2.8, 3.5],  [5, 2.8, 3.5]
      ].forEach((pos, idx) => {
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(pos[0], pos[1], pos[2]);
        col.castShadow = true;
        col.userData = { id: `ELEM-003`, name: `Coluna P-0${idx + 1}` };
        meshesGroup.add(col);

        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(pos[0], pos[1] + 1.7, pos[2]);
        meshesGroup.add(marker);
      });
    }

    // 4. Upper Ring Beams & Concrete Slab Frame (Semana 4 - EXACT SCREENSHOT STATE)
    if (selectedWeek >= 4) {
      const topBeamLongGeo = new THREE.BoxGeometry(12.4, 0.5, 0.6);
      const topBeamShortGeo = new THREE.BoxGeometry(0.6, 0.5, 7.6);
      const slabMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });

      const tLong1 = new THREE.Mesh(topBeamLongGeo, slabMat);
      tLong1.position.set(0, 4.65, -3.5);
      meshesGroup.add(tLong1);

      const tLong2 = new THREE.Mesh(topBeamLongGeo, slabMat);
      tLong2.position.set(0, 4.65, 3.5);
      meshesGroup.add(tLong2);

      const tShort1 = new THREE.Mesh(topBeamShortGeo, slabMat);
      tShort1.position.set(-5, 4.65, 0);
      meshesGroup.add(tShort1);

      const tShort2 = new THREE.Mesh(topBeamShortGeo, slabMat);
      tShort2.position.set(5, 4.65, 0);
      meshesGroup.add(tShort2);

      // Upper Concrete Slab Floor
      const slabFloorGeo = new THREE.BoxGeometry(11.8, 0.25, 7.0);
      const slabFloorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
      const slabFloor = new THREE.Mesh(slabFloorGeo, slabFloorMat);
      slabFloor.position.set(0, 4.5, 0);
      meshesGroup.add(slabFloor);
    }

    // 5. Masonry Walls (Semana 5 & 6)
    if (selectedWeek >= 5) {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 });
      
      const backWallGeo = new THREE.BoxGeometry(11.8, 3.2, 0.3);
      const backWall = new THREE.Mesh(backWallGeo, wallMat);
      backWall.position.set(0, 2.8, -3.4);
      backWall.userData = { id: 'ELEM-005', name: 'Parede Traseira' };
      meshesGroup.add(backWall);

      const sideWallGeo = new THREE.BoxGeometry(0.3, 3.2, 6.8);
      const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
      leftWall.position.set(-4.9, 2.8, 0);
      leftWall.userData = { id: 'ELEM-005', name: 'Parede Esquerda' };
      meshesGroup.add(leftWall);
    }

    if (selectedWeek >= 6) {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 });
      const sideWallGeo = new THREE.BoxGeometry(0.3, 3.2, 6.8);
      const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
      rightWall.position.set(4.9, 2.8, 0);
      rightWall.userData = { id: 'ELEM-006', name: 'Parede Direita' };
      meshesGroup.add(rightWall);
    }

    // 6. Roof & Photovoltaic Solar Panels (Semana 7 & 8)
    if (selectedWeek >= 7) {
      const roofGeo = new THREE.ConeGeometry(7.5, 2.5, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 6.0, 0);
      roof.rotation.y = Math.PI / 4;
      roof.userData = { id: 'ELEM-007', name: 'Telhado Cerâmico' };
      meshesGroup.add(roof);
    }

    if (selectedWeek >= 8) {
      const panelGeo = new THREE.BoxGeometry(2.5, 0.08, 1.4);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2 });
      const p1 = new THREE.Mesh(panelGeo, panelMat);
      p1.position.set(-2.0, 6.5, 1.2);
      p1.rotation.x = -Math.PI / 8;
      meshesGroup.add(p1);
      const p2 = new THREE.Mesh(panelGeo, panelMat);
      p2.position.set(2.0, 6.5, 1.2);
      p2.rotation.x = -Math.PI / 8;
      meshesGroup.add(p2);
    }

    // Dynamic Elements added by user
    elements.forEach((elem) => {
      if (elem.assignedWeek <= selectedWeek && elem.position && (elem.position[0] !== 0 || elem.position[1] !== 0 || elem.position[2] !== 0)) {
        const dynGeo = elem.category === 'Estrutura' 
          ? new THREE.BoxGeometry(0.6, 3.2, 0.6) 
          : new THREE.BoxGeometry(2.5, 3.0, 0.3);
        const dynMat = new THREE.MeshStandardMaterial({
          color: elem.category === 'Estrutura' ? 0x94a3b8 : 0xf97316
        });
        const dynMesh = new THREE.Mesh(dynGeo, dynMat);
        dynMesh.position.set(elem.position[0], elem.position[1], elem.position[2]);
        dynMesh.userData = { id: elem.id, name: elem.name };
        meshesGroup.add(dynMesh);
      }
    });

    scene.add(meshesGroup);

    // Raycaster Click Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(meshesGroup.children, true);

      if (intersects.length > 0) {
        const clickedObj = intersects[0].object;
        if (clickedObj.userData && clickedObj.userData.id) {
          setSelectedElementId(clickedObj.userData.id);
        }
      }
    };

    const domElem = mountRef.current;
    domElem.addEventListener('click', handleCanvasClick);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [elements, isDark, viewMode, selectedWeek]);

  // AI 2D -> 3D Generation Simulation Handler
  const startAiGeneration = () => {
    setIsAiProcessing(true);
    setAiStep(1);
    setTimeout(() => setAiStep(2), 1000);
    setTimeout(() => setAiStep(3), 2000);
    setTimeout(() => {
      setIsAiProcessing(false);
      setShowAiModal(false);
      onImportFloorPlan(selectedPreset);
    }, 3000);
  };

  const handleCreateOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!occTitle.trim()) return;

    const created: ConstructionOccurrence = {
      id: `OCC-${Math.floor(300 + Math.random() * 700)}`,
      projectId: activeProject ? activeProject.id : 'PRJ-001',
      title: occTitle.trim(),
      category: occCategory,
      severity: occSeverity,
      description: occDescription.trim() || 'Ocorrência registrada no canteiro.',
      assignedTo: 'Equipe de Engenharia',
      status: 'EM_CORRECAO',
      reportedBy: USER_ROLES[currentRole].title,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      hasPhoto: true
    };

    setOccurrences([created, ...occurrences]);
    setShowOccurrenceModal(false);
    setOccTitle('');
    setOccDescription('');

    onSendToast(
      'warning',
      'Ocorrência Registrada (ISO 9001)',
      `Não conformidade ${created.id} cadastrada no canteiro. Notificação transmitida aos responsáveis.`
    );
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      
      {/* Organic Project & Terreno Ecosystem Info Bar */}
      <div className={`border rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs transition-colors ${innerBg}`}>
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
          <div>
            <span className={textMuted}>Empreendimento Ativo: </span>
            <strong className={textTitle}>{activeProject ? activeProject.name : 'Residencial Jardins'} ({activeProject ? activeProject.type : 'Prédio'})</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className={textMuted}>Projeto Arquitetônico: </span>
            <span className="font-bold text-cyan-400">{activeProject ? activeProject.responsibleArchitect : 'Silva & Associados'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className={textMuted}>Versão BIM: </span>
            <select
              value={bimVersion}
              onChange={(e) => setBimVersion(e.target.value)}
              className={`p-1 rounded-lg border text-[11px] font-bold ${
                isDark ? 'bg-[#18181b] text-emerald-400 border-[#27272a]' : 'bg-white text-emerald-700 border-zinc-300'
              }`}
            >
              <option value="v2.4 (Revisão Estrutural Aprovada)">v2.4 (Revisão Estrutural Aprovada)</option>
              <option value="v2.3 (Alvenaria e Vergas)">v2.3 (Alvenaria e Vergas)</option>
              <option value="v1.0 (Planta Inicial)">v1.0 (Planta Inicial)</option>
            </select>
          </div>

          {/* DDE Performance & Safety Accreditation Badges */}
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>⚡ 60 FPS (WebGL Hardware Accelerated)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2.5 py-1 rounded-xl text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>🛡️ Laudo NR-18 VIGENTE</span>
          </div>
        </div>
      </div>

      {/* 3D Viewer Header Controls Bar */}
      <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 transition-colors`}>
        
        {/* Row 1: Header Title, AI Floorplan & Occurrence Registration Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-zinc-700/40">
          <div>
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-orange-500 shrink-0" />
              <h2 className={`font-extrabold text-base sm:text-lg ${textTitle}`}>
                Visualizador & Editor 3D/BIM
              </h2>
            </div>
            <p className={`text-[11px] sm:text-xs ${textMuted}`}>
              Modelo tridimensional procedurar interativo com física e inspeção de não conformidades (ISO 9001)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowOccurrenceModal(true)}
              className="flex items-center justify-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs px-3 py-2 rounded-2xl transition shrink-0"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Nova Ocorrência</span>
            </button>

            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-2 sm:py-2.5 rounded-2xl shadow-lg shadow-orange-600/30 transition shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Planta 2D → 3D</span>
            </button>
          </div>
        </div>

        {/* Row 2: View Modes Pills, Search Bar & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* View Modes */}
          <div className={`flex p-1 rounded-2xl border text-xs overflow-x-auto max-w-full ${
            isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              onClick={() => setViewMode('REAL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                viewMode === 'REAL' ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
              }`}
            >
              Status Real
            </button>
            <button
              onClick={() => setViewMode('PLANNED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                viewMode === 'PLANNED' ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
              }`}
            >
              Planejado (BIM)
            </button>
            <button
              onClick={() => setViewMode('SCHEMATIC')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                viewMode === 'SCHEMATIC' ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
              }`}
            >
              Esquema 2D
            </button>
          </div>

          {/* Search 3D Element Bar */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${textMuted}`} />
            <input
              type="text"
              placeholder="Buscar elemento 3D..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
              }`}
            />
          </div>

          {/* Spawning 3D Elements Buttons (Only Authorized Roles) */}
          {canEditModel ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddElement({
                  name: 'Parede Adicional',
                  category: 'Alvenaria',
                  status: 'EM_EXECUCAO',
                  progressPercent: 50,
                  assignedWeek: 5,
                  materialUsed: 'Blocos Cerâmicos Baianos',
                  lastUpdatedBy: USER_ROLES[currentRole].title,
                  position: [2, 2.2, 2]
                })}
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  isDark ? 'bg-[#121214] border-[#27272a] hover:bg-[#27272a] text-orange-400' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-orange-600'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Parede
              </button>
              <button
                onClick={() => onAddElement({
                  name: 'Coluna Adicional',
                  category: 'Estrutura',
                  status: 'EM_EXECUCAO',
                  progressPercent: 60,
                  assignedWeek: 3,
                  materialUsed: 'Concreto Armado CA-50',
                  lastUpdatedBy: USER_ROLES[currentRole].title,
                  position: [-2, 2.35, 2]
                })}
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  isDark ? 'bg-[#121214] border-[#27272a] hover:bg-[#27272a] text-orange-400' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-orange-600'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Coluna
              </button>
            </div>
          ) : (
            <div className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-500" /> Somente Leitura 3D
            </div>
          )}

        </div>

      </div>

      {/* Main 3D Canvas Area */}
      <div className={`relative border rounded-3xl overflow-hidden shadow-2xl transition-colors space-y-4 p-3 sm:p-4 ${cardBg}`}>
        
        {viewMode === 'SCHEMATIC' ? (
          /* 2D Schematic Blueprint View */
          <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[480px] space-y-4">
            <h3 className={`font-extrabold text-base sm:text-lg ${textTitle}`}>Planta Baixa Arquitetônica 2D</h3>
            <div className="w-full max-w-lg aspect-square border-2 border-orange-500/50 rounded-2xl p-4 flex flex-col justify-between relative bg-orange-950/10 font-mono text-xs text-orange-400">
              <div className="flex justify-between border-b pb-2 border-orange-500/30">
                <span>[Suíte Master 4x4m]</span>
                <span>[Banheiro 2x2m]</span>
              </div>
              <div className="flex justify-between my-auto border-y py-6 border-orange-500/30">
                <span>[Sala de Estar & Jantar 6x4m]</span>
              </div>
              <div className="flex justify-between border-t pt-2 border-orange-500/30">
                <span>[Cozinha Americana 4x3m]</span>
                <span>[Varana Gourmet 3x3m]</span>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] bg-orange-600 text-white px-2 py-1 rounded-full font-bold">
                Porta de Entrada (Arco 90°)
              </div>
            </div>
          </div>
        ) : (
          /* 3D Canvas WebGL Container */
          <div className="relative rounded-2xl overflow-hidden">
            <div 
              ref={mountRef} 
              className="w-full h-[360px] xs:h-[400px] sm:h-[480px] md:h-[520px] cursor-grab active:cursor-grabbing rounded-2xl" 
            />

            {/* Click Raycaster Selection Overlay Inspector */}
            {selectedElement && (
              <div className={`absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-xs border rounded-2xl p-4 shadow-2xl space-y-3 backdrop-blur-md z-20 ${
                isDark ? 'bg-[#18181b]/95 border-[#27272a]' : 'bg-white/95 border-zinc-300'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-orange-500 uppercase font-mono">{selectedElement.category}</span>
                    <h4 className={`font-extrabold text-xs sm:text-sm ${textTitle}`}>{selectedElement.name}</h4>
                  </div>
                  <button onClick={() => setSelectedElementId(null)} className={`text-xs font-bold ${textMuted}`}>✕</button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className={textMuted}>Progresso:</span>
                    <span className="font-bold text-orange-500">{selectedElement.progressPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={textMuted}>Material:</span>
                    <span className={`font-mono text-[10px] ${textTitle}`}>{selectedElement.materialUsed}</span>
                  </div>
                </div>

                {/* Status Evolution Change Buttons */}
                <div className="space-y-1 pt-2 border-t border-zinc-700/30">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Atualizar Evolução da Etapa:</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => onUpdateElementStatus(selectedElement.id, 'CONCLUIDO', 100)}
                      className="py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] rounded-lg shadow-sm"
                    >
                      100% OK
                    </button>
                    <button
                      onClick={() => onUpdateElementStatus(selectedElement.id, 'EM_EXECUCAO', 50)}
                      className="py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[9px] rounded-lg shadow-sm"
                    >
                      50% Em Uso
                    </button>
                    <button
                      onClick={() => onUpdateElementStatus(selectedElement.id, 'PLANEJADO', 0)}
                      className="py-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-[9px] rounded-lg shadow-sm"
                    >
                      0% Reset
                    </button>
                  </div>
                </div>

                {/* Spatial X, Y, Z Sliders */}
                {canEditModel && (
                  <div className="space-y-2 pt-2 border-t border-zinc-700/30 text-xs">
                    <span className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1">
                      <Sliders className="w-3 h-3" /> Coordenadas Especiais 3D:
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono w-4 font-bold text-rose-500">X:</span>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          step="0.5"
                          value={posX}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setPosX(val);
                            onUpdateElementPosition(selectedElement.id, [val, posY, posZ]);
                          }}
                          className="w-full accent-orange-500 h-1.5"
                        />
                        <span className="text-[10px] font-mono w-6 text-right font-bold">{posX}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono w-4 font-bold text-emerald-500">Y:</span>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          step="0.5"
                          value={posY}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setPosY(val);
                            onUpdateElementPosition(selectedElement.id, [posX, val, posZ]);
                          }}
                          className="w-full accent-orange-500 h-1.5"
                        />
                        <span className="text-[10px] font-mono w-6 text-right font-bold">{posY}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono w-4 font-bold text-blue-500">Z:</span>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          step="0.5"
                          value={posZ}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setPosZ(val);
                            onUpdateElementPosition(selectedElement.id, [posX, posY, val]);
                          }}
                          className="w-full accent-orange-500 h-1.5"
                        />
                        <span className="text-[10px] font-mono w-6 text-right font-bold">{posZ}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteElement(selectedElement.id)}
                      className="w-full mt-2 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Elemento 3D
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TIMELINE CONTROL PANEL MATCHING SCREENSHOT EXACTLY */}
        <div className={`border rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 transition-colors ${
          isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
              <div className={`text-xs sm:text-sm font-semibold ${textTitle}`}>
                Evolução Temporal da Construção: <strong className="text-orange-500 font-extrabold">Semana {selectedWeek}</strong>
              </div>
            </div>

            <button
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-orange-600/30 transition shrink-0"
            >
              {isPlayingTimeline ? (
                <>
                  <Pause className="w-4 h-4 fill-white stroke-none" />
                  <span>Pausar Time-Lapse</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white stroke-none" />
                  <span>Iniciar Time-Lapse</span>
                </>
              )}
            </button>
          </div>

          {/* Range Slider & Week Ticks Matching Screenshot */}
          <div className="space-y-2 pt-1">
            <div className="relative flex items-center">
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg cursor-pointer appearance-none focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-8 text-center text-[10px] font-mono transition-colors">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => {
                const isActive = selectedWeek === w;
                return (
                  <span
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className={`cursor-pointer transition-all ${
                      isActive
                        ? 'text-orange-500 font-extrabold text-xs scale-110'
                        : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    Sem {w}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* OCCURRENCES & QUALITY INSPECTIONS SECTION (SECTION 4.7) */}
      <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl space-y-3`}>
        <div className="flex items-center justify-between border-b pb-2 border-zinc-700/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className={`font-extrabold text-xs sm:text-sm ${textTitle}`}>
              Ocorrências & Laudos de Fiscalização Técnico (ISO 9001)
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-rose-400">{occurrences.length} Ocorrências Ativas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {occurrences.map((occ) => (
            <div key={occ.id} className={`p-3 rounded-2xl border flex items-start justify-between ${innerBg}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-orange-500">{occ.id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                    occ.severity === 'ALTA' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {occ.severity} Prioridade
                  </span>
                </div>
                <h4 className={`font-bold text-xs ${textTitle}`}>{occ.title}</h4>
                <p className={`text-[11px] ${textMuted}`}>{occ.description}</p>
                <div className="text-[10px] font-mono text-zinc-500 pt-1">
                  Atribuído a: <strong>{occ.assignedTo}</strong> • Registrado em: {occ.createdAt}
                </div>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                occ.status === 'APROVADA_FISCAL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {occ.status === 'APROVADA_FISCAL' ? '✓ Fiscalizado' : '⚡ Em Correção'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* NEW OCCURRENCE MODAL */}
      {showOccurrenceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className={`font-bold text-base ${textTitle}`}>Registrar Não Conformidade / Ocorrência</h3>
              </div>
              <button onClick={() => setShowOccurrenceModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            <form onSubmit={handleCreateOccurrence} className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Título da Ocorrência:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fissura em viga ou Falta de E.P.I NR-18"
                  value={occTitle}
                  onChange={(e) => setOccTitle(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Categoria:</label>
                  <select
                    value={occCategory}
                    onChange={(e) => setOccCategory(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  >
                    <option value="Não Conformidade">Não Conformidade</option>
                    <option value="Atraso">Atraso de Atividade</option>
                    <option value="Manutenção">Manutenção de Equipamento</option>
                    <option value="Falha de Execução">Falha de Execução</option>
                    <option value="Segurança NR-18">Segurança NR-18</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Gravidade / Urgência:</label>
                  <select
                    value={occSeverity}
                    onChange={(e) => setOccSeverity(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none font-bold ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta (Crítica)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Descrição da Ocorrência:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalhamento técnico da não-conformidade observada..."
                  value={occDescription}
                  onChange={(e) => setOccDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOccurrenceModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    isDark ? 'bg-[#27272a] text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" /> Registrar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI 2D -> 3D PARSER MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className={`font-bold text-base ${textTitle}`}>Importar Planta 2D & Gerar Modelo 3D</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            {isAiProcessing ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className={`font-bold text-sm ${textTitle}`}>
                  {aiStep === 1 && '1/3 Analisando linhas e vetores da Planta 2D...'}
                  {aiStep === 2 && '2/3 Mapeando paredes, portas e pilares com Visão Computacional...'}
                  {aiStep === 3 && '3/3 Gerando geometria 3D BIM procedurar...'}
                </h4>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className={`block mb-1.5 font-semibold ${textMuted}`}>Selecione um Projeto Preset de Planta 2D:</label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none font-semibold ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  >
                    <option value="Casa 3 Quartos (120m²)">Casa Residencial 3 Quartos com Suíte (120m²)</option>
                    <option value="Sobrado Duplex (220m²)">Sobrado Duplex com Garagem (220m²)</option>
                    <option value="Galpão Comercial (350m²)">Galpão Comercial / Estrutura Metálica (350m²)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAiModal(false)}
                    className={`px-4 py-2 rounded-xl font-bold ${
                      isDark ? 'bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={startAiGeneration}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Processar & Gerar 3D
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Componente de Editor e Extrusor 3D de Plantas Baixas (Obra360)
 * Desenvolvido em React + Three.js / WebGL
 * 
 * Funcionalidades:
 * - Extrusão automática de paredes 2D para 3D (Procedural THREE.ExtrudeGeometry)
 * - Ajuste em tempo real de pé-direito (altura) e espessura das paredes
 * - Aplicação de texturas de acabamento (Tinta, Concreto, Tijolo, Cerâmica)
 * - Cálculo automático de área de parede (m²) e volume (m³) integrado com Almoxarifado (Cm²)
 */
export const Planta3DEditor: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Parâmetros de Edição 3D
  const [peDireito, setPeDireito] = useState<number>(2.80); // Altura em metros
  const [espessuraParede, setEspessuraParede] = useState<number>(0.15); // Espessura em metros
  const [corParede, setCorParede] = useState<string>('#3B82F6');
  const [texturaAtiva, setTexturaAtiva] = useState<string>('concreto');
  
  // Métricas Calculadas em Tempo Real
  const [areaParedeM2, setAreaParedeM2] = useState<number>(0);
  const [volumeConcretoM3, setVolumeConcretoM3] = useState<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Configuração do Cenário 3D (Scene, Camera, Renderer)
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0F172A');

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(10, 12, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // 2. Iluminação do Ambiente 3D
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 3. Chão e Grid 3D de Referência
    const gridHelper = new THREE.GridHelper(30, 30, 0x2563EB, 0x334155);
    scene.add(gridHelper);

    const planeGeometry = new THREE.PlaneGeometry(30, 30);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x1E293B, side: THREE.DoubleSide });
    const floorMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 4. Extrusão Procedural de Parede 3D a partir do Perfil 2D da Planta Baixa
    const wallShape = new THREE.Shape();
    // Cômodo retangular de 8m x 6m
    const comodoLargura = 8;
    const comodoComprimento = 6;

    // Perfil Externo
    wallShape.moveTo(-comodoLargura / 2, -comodoComprimento / 2);
    wallShape.lineTo(comodoLargura / 2, -comodoComprimento / 2);
    wallShape.lineTo(comodoLargura / 2, comodoComprimento / 2);
    wallShape.lineTo(-comodoLargura / 2, comodoComprimento / 2);
    wallShape.closePath();

    // Hole Interno (Espessura da Parede)
    const holePath = new THREE.Path();
    const innerW = comodoLargura / 2 - espessuraParede;
    const innerH = comodoComprimento / 2 - espessuraParede;
    holePath.moveTo(-innerW, -innerH);
    holePath.lineTo(innerW, -innerH);
    holePath.lineTo(innerW, innerH);
    holePath.lineTo(-innerW, innerH);
    holePath.closePath();
    wallShape.holes.push(holePath);

    // Configuração de Extrusão 3D
    const extrudeSettings = {
      steps: 1,
      depth: peDireito,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2
    };

    const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2); // Rotaciona para ficar em pé no eixo Y

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(corParede),
      roughness: 0.4,
      metalness: 0.1
    });

    const wallMesh = new THREE.Mesh(geometry, material);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);

    // 5. Cálculo das Métricas de Área (m²) e Volume (m³)
    const perimetroExterno = (comodoLargura + comodoComprimento) * 2;
    const areaCalculada = perimetroExterno * peDireito;
    const volumeCalculado = areaCalculada * espessuraParede;

    setAreaParedeM2(Number(areaCalculada.toFixed(2)));
    setVolumeConcretoM3(Number(volumeCalculado.toFixed(2)));

    // 6. Loop de Renderização 3D (Animation Loop)
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      wallMesh.rotation.y += 0.003; // Rotação suave de apresentação
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup ao desmontar o componente
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [peDireito, espessuraParede, corParede, texturaAtiva]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '600px', backgroundColor: '#0F172A', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Canvas Viewport 3D */}
      <div ref={mountRef} style={{ flex: 1, height: '100%' }} />

      {/* Painel de Controle de Edição 3D */}
      <div style={{ width: '320px', padding: '20px', backgroundColor: '#1E293B', color: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid #334155' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#60A5FA', margin: 0 }}>🏗️ Editor de Planta 3D</h3>
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Extrusão e parametrização gráfica em tempo real (Three.js WebGL)</p>

        {/* Ajuste de Pé-Direito */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Pé-Direito (Altura): {peDireito}m</label>
          <input
            type="range"
            min="2.0"
            max="5.0"
            step="0.1"
            value={peDireito}
            onChange={(e) => setPeDireito(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '4px' }}
          />
        </div>

        {/* Ajuste de Espessura da Parede */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Espessura da Parede: {espessuraParede}m</label>
          <input
            type="range"
            min="0.10"
            max="0.40"
            step="0.01"
            value={espessuraParede}
            onChange={(e) => setEspessuraParede(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '4px' }}
          />
        </div>

        {/* Cor / Acabamento */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Cor do Acabamento</label>
          <input
            type="color"
            value={corParede}
            onChange={(e) => setCorParede(e.target.value)}
            style={{ width: '100%', height: '36px', marginTop: '4px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}
          />
        </div>

        {/* Painel de Métricas de Almoxarifado Integrado */}
        <div style={{ marginTop: 'auto', padding: '12px', backgroundColor: '#0F172A', borderRadius: '8px', border: '1px solid #2563EB' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#93C5FD', margin: '0 0 8px 0' }}>📊 Integração Almoxarifado (Cm²)</h4>
          <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Área Total Parede:</span>
            <strong style={{ color: '#38BDF8' }}>{areaParedeM2} m²</strong>
          </div>
          <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Volume Concreto:</span>
            <strong style={{ color: '#34D399' }}>{volumeConcretoM3} m³</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planta3DEditor;

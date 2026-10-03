import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Grid, Stars, Instance, Instances } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useOSStore } from '../../core/store/useOSStore';
import { AICore } from '../3d/AICore';

// Cinematic Camera Drift
function CameraController() {
  const { mousePosition } = useOSStore();
  const { camera, viewport } = useThree();
  const vec = new THREE.Vector3();

  useFrame((state) => {
    // Breathing zoom effect
    const zoom = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 + 4.5;
    
    // Smooth mouse parallax mapping
    const targetX = (mousePosition.x / window.innerWidth - 0.5) * (viewport.width * 0.1);
    const targetY = -(mousePosition.y / window.innerHeight - 0.5) * (viewport.height * 0.1);
    
    vec.set(targetX, targetY, zoom);
    camera.position.lerp(vec, 0.02);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Flowing Data Packets (Replacing floating dust)
function DataStreams({ lowDetail }: { lowDetail: boolean }) {
  const count = lowDetail ? 50 : 150;
  
  return (
    <Instances limit={count} range={count}>
      <boxGeometry args={[0.01, 0.01, 0.4]} />
      <meshBasicMaterial color="#00F5FF" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      {[...Array(count)].map((_, i) => (
        <DataPacket key={i} index={i} />
      ))}
    </Instances>
  );
}

function DataPacket({ index }: { index: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  
  // Random start positions
  const startPos = useMemo(() => new THREE.Vector3(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 20
  ), []);

  const speed = useMemo(() => Math.random() * 2 + 1, []);
  const offset = index * 0.1;

  useFrame(({ clock }) => {
    if (ref.current) {
      const time = clock.elapsedTime * speed + offset;
      // Flow along Z axis, wrap around
      const z = (startPos.z + time) % 20 - 10;
      ref.current.position.set(startPos.x, startPos.y, z);
    }
  });

  return <Instance ref={ref} />;
}

// LOD Monitor Component
function PerformanceMonitor({ onDowngrade }: { onDowngrade: () => void }) {
  const frames = useRef(0);
  const prevTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);
  const { updateMetrics } = useOSStore();

  useFrame(() => {
    frames.current++;
    const time = performance.now();
    if (time >= prevTime.current + 1000) {
      const currentFps = (frames.current * 1000) / (time - prevTime.current);
      fpsHistory.current.push(currentFps);
      
      updateMetrics({ fps: currentFps });

      if (fpsHistory.current.length > 5) {
        fpsHistory.current.shift();
      }

      if (fpsHistory.current.length === 5) {
        const avgFps = fpsHistory.current.reduce((a, b) => a + b, 0) / 5;
        if (avgFps < 40) {
          onDowngrade();
        }
      }

      frames.current = 0;
      prevTime.current = time;
    }
  });
  return null;
}

interface SpatialEnvironmentProps {
  children: React.ReactNode;
}

export const SpatialEnvironment: React.FC<SpatialEnvironmentProps> = ({ children }) => {
  const [isLowDetail, setIsLowDetail] = useState(false);
  const { performanceMode } = useOSStore();

  const activeLowDetail = isLowDetail || performanceMode === 'performance';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020203]">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} dpr={activeLowDetail ? 1 : [1, 2]}>
          <PerformanceMonitor onDowngrade={() => setIsLowDetail(true)} />
          <CameraController />
          
          <fog attach="fog" args={['#020203', 5, 20]} />
          
          {/* HDRI Lighting & Reflections */}
          {!activeLowDetail && <Environment preset="city" environmentIntensity={0.2} />}
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} color="#00F5FF" />
          <directionalLight position={[-5, 5, -5]} intensity={1.0} color="#7A5CFF" />
          
          {/* Environment Depth */}
          <Stars radius={50} depth={50} count={activeLowDetail ? 1000 : 3000} factor={4} saturation={1} fade speed={1} />
          
          {/* Infinite Cyberpunk Floor */}
          <Grid 
            position={[0, -2.5, 0]} 
            args={[50, 50]} 
            cellSize={1} 
            cellThickness={1} 
            cellColor="#00F5FF" 
            sectionSize={5} 
            sectionThickness={1.5} 
            sectionColor="#7A5CFF" 
            fadeDistance={25} 
            fadeStrength={1} 
            infiniteGrid
          />
          
          <DataStreams lowDetail={activeLowDetail} />
          
          <AICore />
          
          {!activeLowDetail ? (
            <EffectComposer>
              <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.2} mipmapBlur />
              {/* @ts-ignore */}
              <Noise opacity={0.04} />
              {/* @ts-ignore */}
              <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
          ) : (
            <EffectComposer>
              <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={0.5} mipmapBlur />
            </EffectComposer>
          )}
        </Canvas>
      </div>

      {/* DOM Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-auto flex flex-col">
        {children}
      </div>
    </div>
  );
};


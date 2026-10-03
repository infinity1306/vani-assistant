import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Instance, Instances, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useOSStore } from '../../core/store/useOSStore';

// Complex procedural shader for the inner nucleus
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uStateMod;

  // 3D Simplex Noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    // Displace vertices with 3D noise for organic flow
    float noise = snoise(position * 2.0 + uTime * 0.8) * 0.15 * uStateMod;
    vec3 newPosition = position + normal * noise;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uStateMod;

  void main() {
    // Holographic scanlines
    float scanline = sin(vPosition.y * 50.0 - uTime * 5.0) * 0.1;
    
    // Fresnel effect
    vec3 viewDir = normalize(-vPosition);
    float fresnel = dot(viewDir, vNormal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    // Mix colors based on position and time
    float mixVal = sin(vPosition.x * 3.0 + uTime) * 0.5 + 0.5;
    vec3 baseColor = mix(uColor1, uColor2, mixVal);
    
    // Add intense glow where fresnel is strong
    vec3 finalColor = baseColor + (uColor2 * fresnel * 2.0 * uStateMod);
    finalColor += vec3(scanline);
    
    float alpha = clamp(fresnel * 1.5 + 0.2, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const AICore: React.FC = () => {
  const { runtimeState, mousePosition, performanceMode } = useOSStore();
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null!);
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);
  const shaderRef = useRef<THREE.ShaderMaterial>(null!);

  const isLuxury = performanceMode === 'luxury';

  // Calculate dynamic scale: 22% of viewport height
  // base size of geometry is ~2 units diameter. 
  // We want diameter = viewport.height * 0.22
  // scale = (viewport.height * 0.22) / 2
  const dynamicScale = (viewport.height * 0.22) / 2;

  // Uniform values based on state
  const stateUniforms = useMemo(() => {
    switch (runtimeState) {
      case 'LISTENING': return { color: new THREE.Color('#00F5FF'), color2: new THREE.Color('#ffffff'), mod: 2.0, speed: 2.5 };
      case 'THINKING': return { color: new THREE.Color('#B026FF'), color2: new THREE.Color('#FF00FF'), mod: 1.5, speed: 1.5 };
      case 'PROCESSING': 
      case 'EXECUTING': return { color: new THREE.Color('#00F5FF'), color2: new THREE.Color('#FF00FF'), mod: 2.5, speed: 2.0 };
      case 'SPEAKING': return { color: new THREE.Color('#00F5FF'), color2: new THREE.Color('#00FFFF'), mod: 1.8, speed: 1.2 };
      case 'ERROR': return { color: new THREE.Color('#FF3366'), color2: new THREE.Color('#FF9900'), mod: 3.0, speed: 3.0 };
      case 'SHUTTING_DOWN': return { color: new THREE.Color('#FF9900'), color2: new THREE.Color('#333333'), mod: 0.5, speed: 0.5 };
      case 'OFF': return { color: new THREE.Color('#111111'), color2: new THREE.Color('#000000'), mod: 0.0, speed: 0.0 };
      case 'STARTING': return { color: new THREE.Color('#ffffff'), color2: new THREE.Color('#00F5FF'), mod: 1.5, speed: 3.0 };
      case 'READY':
      case 'IDLE':
      default: return { color: new THREE.Color('#00F5FF'), color2: new THREE.Color('#0033FF'), mod: 1.0, speed: 1.0 };
    }
  }, [runtimeState]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: stateUniforms.color.clone() },
    uColor2: { value: stateUniforms.color2.clone() },
    uStateMod: { value: stateUniforms.mod },
  }), []);

  useFrame((_state, delta) => {
    const d = Math.min(delta, 0.1); // cap delta to prevent huge jumps

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += d * stateUniforms.speed;
      shaderRef.current.uniforms.uColor1.value.lerp(stateUniforms.color, 0.05);
      shaderRef.current.uniforms.uColor2.value.lerp(stateUniforms.color2, 0.05);
      shaderRef.current.uniforms.uStateMod.value += (stateUniforms.mod - shaderRef.current.uniforms.uStateMod.value) * 0.05;
    }

    if (groupRef.current) {
      // Mouse parallax mapped to -1 to 1 based on window size
      const targetX = (mousePosition.x / window.innerWidth - 0.5) * (viewport.width * 0.05);
      const targetY = -(mousePosition.y / window.innerHeight - 0.5) * (viewport.height * 0.05);
      
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;

      // Idle drift
      groupRef.current.position.y += Math.sin(_state.clock.elapsedTime * 0.5) * 0.005;
    }

    // Rotate Gyroscope Rings
    if (ring1Ref.current && ring2Ref.current && ring3Ref.current) {
      const speed = stateUniforms.speed;
      ring1Ref.current.rotation.x += d * 0.5 * speed;
      ring1Ref.current.rotation.y += d * 0.2 * speed;
      
      ring2Ref.current.rotation.y += d * 0.4 * speed;
      ring2Ref.current.rotation.z += d * 0.3 * speed;
      
      ring3Ref.current.rotation.x -= d * 0.3 * speed;
      ring3Ref.current.rotation.z -= d * 0.5 * speed;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={dynamicScale}>
        
        {/* Holographic Inner Nucleus */}
        <mesh>
          <icosahedronGeometry args={[0.8, 8]} />
          <shaderMaterial
            ref={shaderRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            transparent
            blending={THREE.AdditiveBlending}
            wireframe={true}
          />
        </mesh>

        {/* Dense Energy Core */}
        <mesh scale={0.7}>
          <icosahedronGeometry args={[1, 4]} />
          <meshBasicMaterial color={stateUniforms.color} transparent opacity={0.4} blending={THREE.AdditiveBlending} wireframe />
        </mesh>

        {/* Gyroscope Torus Rings */}
        <group>
          <mesh ref={ring1Ref}>
            <torusGeometry args={[1.2, 0.01, 16, 100]} />
            <meshBasicMaterial color={stateUniforms.color2} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh ref={ring2Ref} rotation={[Math.PI/4, 0, 0]}>
            <torusGeometry args={[1.3, 0.015, 16, 100]} />
            <meshBasicMaterial color={stateUniforms.color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh ref={ring3Ref} rotation={[0, Math.PI/3, 0]}>
            <torusGeometry args={[1.4, 0.008, 16, 100]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>

        {/* Outer Glass Shell (Luxury Mode) */}
        {isLuxury && (
          <mesh scale={1.55}>
            <icosahedronGeometry args={[1, 4]} />
            <MeshTransmissionMaterial
              backside
              thickness={0.5}
              roughness={0.1}
              transmission={0.95}
              ior={1.2}
              chromaticAberration={0.05}
              color="#ffffff"
            />
          </mesh>
        )}
        
        {/* Neural Orbiting Satellites */}
        {isLuxury && (
          <Instances limit={24} range={24}>
            <boxGeometry args={[0.02, 0.02, 0.08]} />
            <meshBasicMaterial color={stateUniforms.color} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
            {[...Array(24)].map((_, i) => (
              <Satellite key={i} index={i} total={24} speedMod={stateUniforms.speed} />
            ))}
          </Instances>
        )}
      </group>
    </Float>
  );
};

function Satellite({ index, total, speedMod }: { index: number; total: number; speedMod: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  
  // Distribute on a sphere surface using Fibonacci sphere or just random orbits
  const phi = Math.acos(-1 + (2 * index) / total);
  const theta = Math.sqrt(total * Math.PI) * phi;
  const radius = 1.7 + (index % 3) * 0.2; // varying radii
  
  // Random axis of rotation for this satellite
  const axis = useMemo(() => new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  ).normalize(), [phi, theta]);

  const offset = index * 10;

  useFrame(({ clock }) => {
    if (ref.current) {
      const time = clock.elapsedTime * 0.5 * speedMod + offset;
      
      // Orbit around center using quaternion
      const q = new THREE.Quaternion().setFromAxisAngle(axis, time);
      const pos = new THREE.Vector3(radius, 0, 0).applyQuaternion(q);
      
      ref.current.position.copy(pos);
      // Look at center to orient the satellite
      ref.current.lookAt(0, 0, 0);
    }
  });

  return <Instance ref={ref} />;
}


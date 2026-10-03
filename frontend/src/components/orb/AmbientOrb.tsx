import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { useAppStore } from '../../core/store/appStore';

// We use an advanced noise algorithm for the vertex displacement to make it look like "sound waves"
const vertexShader = `
uniform float uTime;
uniform float uSpeed;
uniform float uNoiseIntensity;
uniform float uAudioReact;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Classic 3D Perlin Noise
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
  vNormal = normal;
  
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vPosition = worldPosition.xyz;
  
  // Complex displacement using simplex noise + audio reactivity
  float noise1 = snoise(position * 2.0 + uTime * uSpeed * 0.5);
  float noise2 = snoise(position * 4.0 - uTime * uSpeed * 0.8);
  
  float combinedNoise = (noise1 * 0.6 + noise2 * 0.4) * uNoiseIntensity;
  
  // Audio reactivity pulses the normal vectors outwards
  vec3 newPosition = position + normal * combinedNoise * (1.0 + uAudioReact * 2.0);
  
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uTime;
uniform float uStateIntensity;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  
  // Enhanced fresnel for that "glassy holographic" look
  float fresnel = dot(viewDirection, normalize(vNormal));
  fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
  float fresnelPower = pow(fresnel, 2.5); // sharper edge
  float centerGlow = pow(1.0 - fresnel, 4.0); // inner core glow
  
  // Multi-stop color mixing
  float mixRatio = vUv.y + sin(vUv.x * 10.0 + uTime) * 0.1;
  vec3 baseColor = mix(uColor1, uColor2, smoothstep(0.0, 0.6, mixRatio));
  baseColor = mix(baseColor, uColor3, smoothstep(0.5, 1.0, mixRatio));
  
  // Add intense rim lighting and core energy
  vec3 rimLight = uColor2 * fresnelPower * 3.0 * uStateIntensity;
  vec3 coreLight = uColor1 * centerGlow * 1.5;
  
  vec3 finalColor = baseColor + rimLight + coreLight;
  
  // Make the edges slightly transparent
  float alpha = 0.85 + (fresnelPower * 0.15);
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

const OrbMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const orbState = useAppStore((state) => state.orbState);
  
  // We'll simulate audio level by randomizing this slightly during LISTENING
  const audioLevelRef = useRef(0);

  // Define target states mapped to the new Neon-Cyber aesthetics
  const targetScale = orbState === 'LISTENING' ? 1.3 : orbState === 'EXECUTING' ? 0.95 : 1.0;
  
  // IDLE: Subtle Cyan / Deep Blue
  let targetColor1 = new THREE.Color('#002b3d');
  let targetColor2 = new THREE.Color('#00F0FF'); // Electric Cyan
  let targetColor3 = new THREE.Color('#0b1021');
  let targetSpeed = 0.5;
  let targetNoise = 0.08;
  let targetIntensity = 0.5;

  if (orbState === 'THINKING') {
    // THINKING: Electric Violet & Magenta (Processing)
    targetColor1 = new THREE.Color('#FF00FF'); // Neon Magenta
    targetColor2 = new THREE.Color('#7C3AED'); // Violet
    targetColor3 = new THREE.Color('#00F0FF'); // Cyan base
    targetSpeed = 2.5;
    targetNoise = 0.15;
    targetIntensity = 1.5;
  } else if (orbState === 'EXECUTING') {
    // EXECUTING: Rapid Emerald / Teal (Success/Action)
    targetColor1 = new THREE.Color('#00FF9D'); // Mint/Emerald
    targetColor2 = new THREE.Color('#14B8A6'); // Teal
    targetColor3 = new THREE.Color('#0f2b26');
    targetSpeed = 4.0;
    targetNoise = 0.25;
    targetIntensity = 2.0;
  } else if (orbState === 'LISTENING') {
    // LISTENING: Bright Cyan & Blue (Active Input)
    targetColor1 = new THREE.Color('#00F0FF'); 
    targetColor2 = new THREE.Color('#3B82F6'); 
    targetColor3 = new THREE.Color('#7C3AED');
    targetSpeed = 1.5;
    targetNoise = 0.12;
    targetIntensity = 1.2;
  }

  // Spring physics for smooth transitions
  const { scale } = useSpring({
    scale: [targetScale, targetScale, targetScale],
    config: { mass: 1.5, tension: 250, friction: 25 },
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 1.0 },
      uNoiseIntensity: { value: 0.05 },
      uAudioReact: { value: 0.0 },
      uStateIntensity: { value: 1.0 },
      uColor1: { value: new THREE.Color('#002b3d') },
      uColor2: { value: new THREE.Color('#00F0FF') },
      uColor3: { value: new THREE.Color('#0b1021') },
    }),
    []
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      
      // Lerp uniforms towards targets
      materialRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uSpeed.value, targetSpeed, 0.08
      );
      materialRef.current.uniforms.uNoiseIntensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uNoiseIntensity.value, targetNoise, 0.08
      );
      materialRef.current.uniforms.uStateIntensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uStateIntensity.value, targetIntensity, 0.08
      );
      
      // Simulate Audio Reactivity
      if (orbState === 'LISTENING') {
        // Create a fast, jittery pseudo-random value for mic volume
        const fakeVolume = Math.max(0, Math.sin(state.clock.elapsedTime * 20) * 0.5 + Math.sin(state.clock.elapsedTime * 43) * 0.5);
        audioLevelRef.current = THREE.MathUtils.lerp(audioLevelRef.current, fakeVolume, 0.2);
      } else {
        audioLevelRef.current = THREE.MathUtils.lerp(audioLevelRef.current, 0, 0.1);
      }
      materialRef.current.uniforms.uAudioReact.value = audioLevelRef.current;

      // Color interpolation
      materialRef.current.uniforms.uColor1.value.lerp(targetColor1, 0.05);
      materialRef.current.uniforms.uColor2.value.lerp(targetColor2, 0.05);
      materialRef.current.uniforms.uColor3.value.lerp(targetColor3, 0.05);
    }
    
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.rotation.y += orbState === 'EXECUTING' ? 0.05 : 0.01;
      meshRef.current.rotation.x += orbState === 'EXECUTING' ? 0.05 : 0.01;
    }
  });

  return (
    <a.mesh ref={meshRef} scale={scale as any}>
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </a.mesh>
  );
};

export const AmbientOrb: React.FC = () => {
  return (
    <div className="w-[160px] h-[160px] relative pointer-events-none drop-shadow-[0_0_30px_rgba(0,240,255,0.2)]">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <OrbMesh />
      </Canvas>
    </div>
  );
};

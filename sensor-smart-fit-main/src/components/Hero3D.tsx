import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, PerspectiveCamera, Stars } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function TechSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.5, 2]} />
        <meshStandardMaterial
          color="#06b6d4" // Cyan-500
          emissive="#06b6d4"
          emissiveIntensity={0.2}
          wireframe
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  );
}

function InnerCore() {
    const meshRef = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.y = -state.clock.getElapsedTime() * 0.1;
      }
    });
  
    return (
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial
          color="#f97316" // Orange (Accent)
          emissive="#f97316"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }

function SceneContent() {
  const { viewport } = useThree();
  // Adjust position based on viewport width
  const isMobile = viewport.width < 10;
  const xPos = isMobile ? 0 : 2.5;
  const scale = isMobile ? 0.7 : 1;

  return (
    <group position={[xPos, 0, 0]} scale={scale}>
      <TechSphere />
      <InnerCore />
    </group>
  );
}

const Hero3D = () => {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f97316" />
        
        <Stars 
          radius={50} 
          depth={50} 
          count={1000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={0.5} 
        />
        
        <SceneContent />
      </Canvas>
    </div>
  );
};

export default Hero3D;

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HumanVisualizerProps {
  pitch: number;
  roll: number;
  yaw: number;
  exercise: string;
}

const HumanVisualizer: React.FC<HumanVisualizerProps> = ({ pitch, roll, yaw, exercise }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const humanModelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.z = 5;
    camera.position.y = 1;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Create simplified human model
    const humanModel = new THREE.Group();
    humanModelRef.current = humanModel;

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2194ce });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    humanModel.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 0.7;
    humanModel.add(head);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(0.4, 0.2, 0);
    leftArm.rotation.z = Math.PI / 2;
    humanModel.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(-0.4, 0.2, 0);
    rightArm.rotation.z = -Math.PI / 2;
    humanModel.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(0.2, -0.8, 0);
    humanModel.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(-0.2, -0.8, 0);
    humanModel.add(rightLeg);

    scene.add(humanModel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update model rotation based on sensor data
  useEffect(() => {
    if (humanModelRef.current) {
      // Convert degrees to radians
      const pitchRad = (pitch * Math.PI) / 180;
      const rollRad = (roll * Math.PI) / 180;
      const yawRad = (yaw * Math.PI) / 180;

      // Apply rotations based on exercise type
      if (exercise === 'squat') {
        humanModelRef.current.rotation.x = pitchRad;
        humanModelRef.current.rotation.z = rollRad;
      } else if (exercise === 'pushup') {
        humanModelRef.current.rotation.x = -Math.PI / 2 + pitchRad;
        humanModelRef.current.rotation.z = rollRad;
      } else if (exercise === 'bicep_curl') {
        // For bicep curls, we mainly rotate the arms
        humanModelRef.current.children.forEach((child, index) => {
          if (index === 2 || index === 3) { // Left and right arms
            child.rotation.x = pitchRad;
          }
        });
      }
    }
  }, [pitch, roll, yaw, exercise]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '300px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
      }} 
    />
  );
};

export default HumanVisualizer;
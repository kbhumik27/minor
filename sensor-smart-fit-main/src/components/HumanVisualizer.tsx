import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface HumanVisualizerProps {
  meshData?: {
    joints: {
      [key: string]: {
        position: { x: number; y: number; z: number };
        children: string[];
        name: string;
      };
    };
  };
  exercise?: string;
}

const HumanVisualizer = ({ meshData, exercise }: HumanVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const jointsRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const bonesRef = useRef<THREE.Line[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 2;
    camera.position.y = 1;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add ground plane for reference
    const gridHelper = new THREE.GridHelper(2, 20);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Store container reference for cleanup
    const container = containerRef.current;
    
    // Cleanup
    return () => {
      renderer.dispose();
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update joint positions when meshData changes
  useEffect(() => {
    if (!sceneRef.current || !meshData) return;

    const scene = sceneRef.current;

    // Clear existing joints and bones
    Object.values(jointsRef.current).forEach(mesh => scene.remove(mesh));
    bonesRef.current.forEach(line => scene.remove(line));
    jointsRef.current = {};
    bonesRef.current = [];

    // Create joint material
    const jointMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const jointGeometry = new THREE.SphereGeometry(0.03);

    // Create bone material
    const boneMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    // Create joints and bones
    Object.entries(meshData.joints).forEach(([name, data]) => {
      // Create joint mesh
      const joint = new THREE.Mesh(jointGeometry, jointMaterial);
      joint.position.set(data.position.x, data.position.y, data.position.z);
      scene.add(joint);
      jointsRef.current[name] = joint;

      // Create bones to children
      if (data.children) {
        data.children.forEach(childName => {
          if (meshData.joints[childName]) {
            const childPos = meshData.joints[childName].position;
            const points = [
              new THREE.Vector3(data.position.x, data.position.y, data.position.z),
              new THREE.Vector3(childPos.x, childPos.y, childPos.z)
            ];

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, boneMaterial);
            scene.add(line);
            bonesRef.current.push(line);
          }
        });
      }
    });
  }, [meshData]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[400px] rounded-lg overflow-hidden bg-gray-900"
      style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
    >
      {!meshData && (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          {exercise === 'Ready' ? 'Select an exercise to begin' : 'Connecting to sensor...'}
        </div>
      )}
    </div>
  );
};

export default HumanVisualizer;
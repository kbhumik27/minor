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
  const humanPartsRef = useRef<{
    body: THREE.Mesh;
    head: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftForearm: THREE.Mesh;
    rightForearm: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    leftCalf: THREE.Mesh;
    rightCalf: THREE.Mesh;
    group: THREE.Group;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a2e);

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.set(0, 1.5, 5);
    camera.lookAt(0, 1, 0);

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0x4a90e2, 0.4);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    // Add grid floor
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Create human model with proper hierarchy
    const humanGroup = new THREE.Group();
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3498db,
      shininess: 30
    });
    const jointMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xe74c3c,
      shininess: 50
    });

    // Torso (main body)
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.28, 0.8, 16);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    humanGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.8;
    humanGroup.add(head);

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
    const neck = new THREE.Mesh(neckGeometry, bodyMaterial);
    neck.position.y = 1.65;
    humanGroup.add(neck);

    // Create arm with proper pivot point
    const createArm = (side: number) => {
      // Upper arm
      const upperArmGeometry = new THREE.CylinderGeometry(0.08, 0.09, 0.5, 8);
      const upperArm = new THREE.Mesh(upperArmGeometry, bodyMaterial);
      
      // Position at shoulder
      upperArm.position.set(side * 0.35, 1.5, 0);
      
      // Shoulder joint
      const shoulderJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        jointMaterial
      );
      shoulderJoint.position.copy(upperArm.position);
      humanGroup.add(shoulderJoint);
      
      // Forearm
      const forearmGeometry = new THREE.CylinderGeometry(0.07, 0.08, 0.45, 8);
      const forearm = new THREE.Mesh(forearmGeometry, bodyMaterial);
      forearm.position.set(side * 0.35, 1.0, 0);
      
      // Elbow joint
      const elbowJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        jointMaterial
      );
      elbowJoint.position.set(side * 0.35, 1.25, 0);
      humanGroup.add(elbowJoint);
      
      // Hand
      const handGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const hand = new THREE.Mesh(handGeometry, bodyMaterial);
      hand.position.set(side * 0.35, 0.75, 0);
      humanGroup.add(hand);
      
      humanGroup.add(upperArm);
      humanGroup.add(forearm);
      
      return { upperArm, forearm };
    };

    const leftArmParts = createArm(-1);
    const rightArmParts = createArm(1);

    // Create leg with proper pivot point
    const createLeg = (side: number) => {
      // Thigh
      const thighGeometry = new THREE.CylinderGeometry(0.11, 0.1, 0.6, 8);
      const thigh = new THREE.Mesh(thighGeometry, bodyMaterial);
      thigh.position.set(side * 0.15, 0.5, 0);
      
      // Hip joint
      const hipJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        jointMaterial
      );
      hipJoint.position.set(side * 0.15, 0.8, 0);
      humanGroup.add(hipJoint);
      
      // Calf
      const calfGeometry = new THREE.CylinderGeometry(0.09, 0.08, 0.55, 8);
      const calf = new THREE.Mesh(calfGeometry, bodyMaterial);
      calf.position.set(side * 0.15, 0, 0);
      
      // Knee joint
      const kneeJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 8, 8),
        jointMaterial
      );
      kneeJoint.position.set(side * 0.15, 0.2, 0);
      humanGroup.add(kneeJoint);
      
      // Foot
      const footGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.25);
      const foot = new THREE.Mesh(footGeometry, bodyMaterial);
      foot.position.set(side * 0.15, -0.23, 0.05);
      humanGroup.add(foot);
      
      humanGroup.add(thigh);
      humanGroup.add(calf);
      
      return { thigh, calf };
    };

    const leftLegParts = createLeg(-1);
    const rightLegParts = createLeg(1);

    // Store references
    humanPartsRef.current = {
      body,
      head,
      leftArm: leftArmParts.upperArm,
      rightArm: rightArmParts.upperArm,
      leftForearm: leftArmParts.forearm,
      rightForearm: rightArmParts.forearm,
      leftLeg: leftLegParts.thigh,
      rightLeg: rightLegParts.thigh,
      leftCalf: leftLegParts.calf,
      rightCalf: rightLegParts.calf,
      group: humanGroup
    };

    scene.add(humanGroup);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update model based on sensor data
  useEffect(() => {
    if (!humanPartsRef.current) return;

    const parts = humanPartsRef.current;
    const pitchRad = (pitch * Math.PI) / 180;
    const rollRad = (roll * Math.PI) / 180;
    const yawRad = (yaw * Math.PI) / 180;

    // Reset all rotations first
    parts.body.rotation.set(0, 0, 0);
    parts.leftArm.rotation.set(0, 0, 0);
    parts.rightArm.rotation.set(0, 0, 0);
    parts.leftForearm.rotation.set(0, 0, 0);
    parts.rightForearm.rotation.set(0, 0, 0);
    parts.leftLeg.rotation.set(0, 0, 0);
    parts.rightLeg.rotation.set(0, 0, 0);
    parts.leftCalf.rotation.set(0, 0, 0);
    parts.rightCalf.rotation.set(0, 0, 0);

    if (exercise === 'squat') {
      // Squat: pitch controls squat depth (negative = down)
      const squatDepth = Math.max(-90, Math.min(0, pitch));
      const squatFactor = Math.abs(squatDepth) / 90;
      
      // Body leans slightly forward during squat
      parts.body.rotation.x = squatFactor * 0.3;
      parts.body.position.y = 1.2 - (squatFactor * 0.4);
      
      // Legs bend at hips and knees
      const hipBend = squatFactor * 0.8;
      const kneeBend = squatFactor * 1.4;
      
      parts.leftLeg.rotation.x = hipBend;
      parts.rightLeg.rotation.x = hipBend;
      parts.leftLeg.position.y = 0.5 - (squatFactor * 0.15);
      parts.rightLeg.position.y = 0.5 - (squatFactor * 0.15);
      
      parts.leftCalf.rotation.x = -kneeBend;
      parts.rightCalf.rotation.x = -kneeBend;
      parts.leftCalf.position.y = 0 - (squatFactor * 0.15);
      parts.rightCalf.position.y = 0 - (squatFactor * 0.15);
      
      // Arms forward for balance
      parts.leftArm.rotation.x = squatFactor * 1.0;
      parts.rightArm.rotation.x = squatFactor * 1.0;
      parts.leftArm.rotation.z = 0.2;
      parts.rightArm.rotation.z = -0.2;
      
      // Roll affects balance
      parts.group.rotation.z = rollRad * 0.5;
      
    } else if (exercise === 'pushup') {
      // Push-up: body is horizontal, pitch controls up/down movement
      const pushupDepth = Math.max(0, Math.min(45, pitch));
      const pushupFactor = pushupDepth / 45;
      
      // Rotate entire body to horizontal position
      parts.group.rotation.x = -Math.PI / 2 + (pushupFactor * 0.2);
      parts.group.position.y = 0.8 - (pushupFactor * 0.25);
      
      // Arms bend during pushup
      const armBend = (1 - pushupFactor) * 1.3;
      parts.leftArm.rotation.z = 0.5 + armBend;
      parts.rightArm.rotation.z = -0.5 - armBend;
      
      parts.leftForearm.rotation.z = -armBend * 0.8;
      parts.rightForearm.rotation.z = armBend * 0.8;
      
      // Keep body straight
      parts.body.rotation.x = 0;
      
      // Roll affects body alignment
      parts.group.rotation.y = rollRad * 0.3;
      
    } else if (exercise === 'bicep_curl') {
      // Bicep curl: pitch controls arm curl angle
      const curlAngle = Math.max(0, Math.min(120, pitch));
      const curlFactor = curlAngle / 120;
      
      // Right arm curls up
      parts.rightArm.rotation.z = -0.3;
      parts.rightArm.rotation.x = -0.2;
      
      // Forearm rotates up for curl
      parts.rightForearm.rotation.z = curlFactor * 2.5;
      parts.rightForearm.position.y = 1.0 + (curlFactor * 0.15);
      parts.rightForearm.position.x = 0.35 - (curlFactor * 0.05);
      
      // Left arm stays down or mirrors
      parts.leftArm.rotation.z = 0.3;
      parts.leftArm.rotation.x = -0.2;
      parts.leftForearm.rotation.z = -(curlFactor * 2.5);
      parts.leftForearm.position.y = 1.0 + (curlFactor * 0.15);
      parts.leftForearm.position.x = -0.35 + (curlFactor * 0.05);
      
      // Slight body compensation
      parts.body.rotation.x = -curlFactor * 0.1;
      
      // Roll affects side-to-side stability
      parts.body.rotation.z = rollRad * 0.5;
      
    } else {
      // Ready position - natural standing pose
      parts.group.rotation.set(0, 0, 0);
      parts.group.position.set(0, 0, 0);
      parts.body.position.y = 1.2;
      
      // Slight arm angles for natural pose
      parts.leftArm.rotation.z = 0.2;
      parts.rightArm.rotation.z = -0.2;
      
      // Apply subtle movements based on sensors
      parts.body.rotation.x = pitchRad * 0.3;
      parts.body.rotation.z = rollRad * 0.3;
      parts.group.rotation.y = yawRad * 0.5;
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
        backgroundColor: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)'
      }} 
    />
  );
};

export default HumanVisualizer;
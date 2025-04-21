import * as THREE from 'three';

// Define the extended JSX namespace specifically for R3F components
declare namespace JSX {
  interface IntrinsicElements {
    mesh: any;
    group: any;
    ambientLight: any;
    directionalLight: any;
    spotLight: any;
    pointLight: any;
    boxGeometry: any;
    cylinderGeometry: any;
    sphereGeometry: any;
    planeGeometry: any;
    meshStandardMaterial: any;
    meshBasicMaterial: any;
    meshPhongMaterial: any;
    lineBasicMaterial: any;
    gridHelper: any;
    primitive: any;
  }
}

// Fix missing exported members from react-three libraries
declare module '@react-three/fiber' {
  export const Canvas: React.FC<any>;
  export function useFrame(callback: (state: any, delta: number) => void): void;
  export function useThree(): any;
  export function useLoader(...args: any[]): any;
}

declare module '@react-three/drei' {
  export const OrbitControls: React.FC<any>;
  export const Environment: React.FC<any>;
  export const PerspectiveCamera: React.FC<any>;
  export const useGLTF: any;
  export const Text: React.FC<any>;
  export const Plane: React.FC<any>;
  export const Box: React.FC<any>;
  export const Sphere: React.FC<any>;
}

// Add the Canvas element definition
declare global {
  namespace JSX {
    interface IntrinsicElements {
      canvas: React.DetailedHTMLProps<React.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;
    }
  }
}
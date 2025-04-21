// This provides broader type support for React Three Fiber and its ecosystem
declare module '@react-three/fiber' {
  import { ReactThreeFiber } from '@react-three/fiber';
  // Extend existing namespace to ensure compatibility 
  export * from '@react-three/fiber';
}

// Add support for drei components
declare module '@react-three/drei' {
  import { ReactThreeFiber } from '@react-three/fiber';
  import { Object3D, Material, Mesh } from 'three';
  
  // Export all original exports
  export * from '@react-three/drei';
}
import { Object3D, GridHelper } from 'three';
import { ReactThreeFiber } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: ReactThreeFiber.Object3DNode<Object3D, typeof Object3D>;
      mesh: ReactThreeFiber.MeshProps;
      ambientLight: ReactThreeFiber.LightProps;
      directionalLight: ReactThreeFiber.DirectionalLightProps;
      boxGeometry: ReactThreeFiber.BufferGeometryNode;
      cylinderGeometry: ReactThreeFiber.BufferGeometryNode;
      meshStandardMaterial: ReactThreeFiber.MeshStandardMaterialProps;
      gridHelper: ReactThreeFiber.Object3DNode<GridHelper, typeof GridHelper>;
      primitive: ReactThreeFiber.PrimitiveProps;
      pointLight: ReactThreeFiber.PointLightProps;
      spotLight: ReactThreeFiber.SpotLightProps;
      sphereGeometry: ReactThreeFiber.BufferGeometryNode;
      planeGeometry: ReactThreeFiber.BufferGeometryNode;
      meshBasicMaterial: ReactThreeFiber.MeshBasicMaterialProps;
      meshPhongMaterial: ReactThreeFiber.MeshPhongMaterialProps;
      lineBasicMaterial: ReactThreeFiber.LineBasicMaterialProps;
    }
  }
}
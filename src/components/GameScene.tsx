import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import Robot from './Robot.tsx'
import { useGameStore } from '../store/gameStore'

export default function GameScene() {
  const inBattle = useGameStore((state) => state.inBattle)
  const enemyRobot = useGameStore((state) => state.enemyRobot)

  return (
    <Canvas
      camera={{ position: [0, 2, 5] }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: true,
        preserveDrawingBuffer: true
      }}
      onCreated={({ gl }: { gl: THREE.WebGLRenderer }) => {
        gl.domElement.addEventListener('webglcontextlost', ((event: WebGLContextEvent) => {
          event.preventDefault()
          console.warn('WebGL context lost. Attempting to restore...')
        }) as EventListener)
        gl.domElement.addEventListener('webglcontextrestored', () => {
          console.log('WebGL context restored')
        })
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="sunset" path={import.meta.env.VITE_CDN_URL ? '' : undefined} />
        <OrbitControls 
          enableDamping={true}
          dampingFactor={0.05}
          maxDistance={10}
          minDistance={2}
        />
        
        {/* Player Robot */}
        <group position={[-2, 0, 0]} rotation={[0, inBattle ? Math.PI / 4 : 0, 0]}>
          <Robot isPlayer={inBattle} />
        </group>

        {/* Enemy Robot */}
        {inBattle && enemyRobot && (
          <group position={[2, 0, 0]} rotation={[0, -Math.PI / 4, 0]}>
            <Robot isEnemy={true} />
          </group>
        )}

        <gridHelper args={[20, 20]} />
      </Suspense>
    </Canvas>
  )
}
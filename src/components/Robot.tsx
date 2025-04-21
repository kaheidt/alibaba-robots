import { useRef, useEffect } from 'react'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/gameStore'
import * as THREE from 'three'
import { BoxGeometry, CylinderGeometry, BufferGeometry, MeshStandardMaterial } from 'three'

interface RobotPartConfig {
  size: [number, number, number]
  color: string
  position?: [number, number, number]
  emissive?: string
  wheelCount?: number
  legCount?: number
  positions?: Array<[number, number, number]>
  parts?: Array<{
    size: [number, number, number]
    color: string
    positions: Array<[number, number, number]>
    rotation: [number, number, number]
    emissive?: string
    geometry?: 'box' | 'cylinder' | 'sphere'
  }>
}

interface PartConfigs {
  [key: string]: {
    [key: string]: RobotPartConfig
  }
}

const PART_CONFIGS: PartConfigs = {
  head: {
    Standard: { 
      size: [0.8, 0.8, 0.8], 
      color: '#666666', 
      position: [0, 2.5, 0],
      parts: [
        // Standard rectangular eyes
        { size: [0.15, 0.1, 0.1], color: '#00ff00', emissive: '#00ff00', positions: [[0.2, 2.6, 0.45]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [0.15, 0.1, 0.1], color: '#00ff00', emissive: '#00ff00', positions: [[-0.2, 2.6, 0.45]], rotation: [0, 0, 0], geometry: 'box' },
        // Straight line mouth
        { size: [0.3, 0.05, 0.1], color: '#444444', positions: [[0, 2.35, 0.45]], rotation: [0, 0, 0], geometry: 'box' }
      ]
    },
    Battle: { 
      size: [1, 0.6, 1], 
      color: '#444444', 
      position: [0, 2.6, 0],
      parts: [
        // Angry V-shaped eyes
        { size: [0.2, 0.08, 0.1], color: '#ff0000', emissive: '#ff0000', positions: [[0.2, 2.75, 0.55]], rotation: [0, 0, -0.4], geometry: 'box' },
        { size: [0.2, 0.08, 0.1], color: '#ff0000', emissive: '#ff0000', positions: [[-0.2, 2.75, 0.55]], rotation: [0, 0, 0.4], geometry: 'box' },
        // Aggressive mouth - larger jagged shape
        { size: [0.4, 0.08, 0.1], color: '#333333', positions: [[0, 2.45, 0.55]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [0.15, 0.15, 0.1], color: '#333333', positions: [[0.15, 2.35, 0.55]], rotation: [0, 0, 0.785], geometry: 'box' },
        { size: [0.15, 0.15, 0.1], color: '#333333', positions: [[-0.15, 2.35, 0.55]], rotation: [0, 0, 0.785], geometry: 'box' }
      ]
    },
    Scout: { 
      size: [0.6, 0.6, 1], 
      color: '#555555', 
      position: [0, 2.55, 0],
      parts: [
        // Large visor-style eye
        { size: [0.4, 0.15, 0.1], color: '#00ffff', emissive: '#00ffff', positions: [[0, 2.6, 0.5]], rotation: [0, 0, 0], geometry: 'box' },
        // Thin straight mouth with slight curve effect using multiple segments
        { size: [0.25, 0.03, 0.1], color: '#444444', positions: [[0, 2.35, 0.5]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [0.1, 0.03, 0.1], color: '#444444', positions: [[0.15, 2.34, 0.5]], rotation: [0, 0, 0.2], geometry: 'box' },
        { size: [0.1, 0.03, 0.1], color: '#444444', positions: [[-0.15, 2.34, 0.5]], rotation: [0, 0, -0.2], geometry: 'box' }
      ]
    }
  },
  body: {
    Light: { 
      size: [1, 1.5, 1], 
      color: '#5d5d5d', 
      position: [0, 1.5, 0],
      parts: [
        // Main sleek body
        { size: [1, 1.5, 1], color: '#5d5d5d', positions: [[0, 1.5, 0]], rotation: [0, 0, 0], geometry: 'box' },
        // Aerodynamic front panels
        { size: [.75, 0.7, 0.1], color: '#333333', positions: [[0, 1.5, 0.5]], rotation: [0, 0, 0], geometry: 'box' }
      ]
    },
    Medium: { 
      size: [1, 1.5, 1], 
      color: '#4d4d4d', 
      position: [0, 1.5, 0],
      parts: [
        // Main body with distinct armor layers
        { size: [1.1, 0.1, 1.1], color: '#3d3d3d', positions: [[0, 1.4, 0]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [1.1, 0.1, 1.1], color: '#3d3d3d', positions: [[0, 1.0, 0]], rotation: [0, 0, 0], geometry: 'box' },
        // Protruding armor plates
        { size: [0.2, 0.3, 0.2], color: '#5d5d5d', positions: [[0.5, 2.1, 0.5]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [0.2, 0.3, 0.2], color: '#5d5d5d', positions: [[-0.5, 2.1, 0.5]], rotation: [0, 0, 0], geometry: 'box' }
      ]
    },
    Heavy: { 
      size: [1, 1.5, 1], 
      color: '#2d2d2d', 
      position: [0, 1.5, 0],
      parts: [
        // Massive central body
        { size: [1, 1.5, 1], color: '#2d2d2d', positions: [[0, 1.5, 0]], rotation: [0, 0, 0], geometry: 'box' },
        // Heavy corner reinforcements with additional detail
        { size: [0.1, 1.5, 0.1], color: '#2d2d2d', positions: [[0.5, 1.5, 0.5]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [0.1, 1.5, 0.1], color: '#2d2d2d', positions: [[-0.5, 1.5, 0.5]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [0.1, 1.5, 0.1], color: '#2d2d2d', positions: [[0.5, 1.5, -0.5]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [0.1, 1.5, 0.1], color: '#2d2d2d', positions: [[-0.5, 1.5, -0.5]], rotation: [0, 0, 0], geometry: 'box' },
        // Additional armor plating
        { size: [0.5, 0.3, 0.1], color: '#1d1d1d', positions: [[0, 1.9, 0.5]], rotation: [0, 0, 0], geometry: 'box' },
        { size: [0.5, 0.3, 0.1], color: '#1d1d1d', positions: [[0, 1.1, 0.5]], rotation: [0, 0, 0], geometry: 'box' }
      ]
    }
  },
  arm: {
    // Moving arms up by 0.5 to account for new base position
    Laser: { 
      size: [0.19, 0.19, 0.7], 
      color: '#666666',
      parts: [
        { size: [0.19, 0.19, 0.7], color: '#666666', positions: [[0.65, 1.7, 0.35], [-0.65, 1.7, 0.35]], rotation: [0, 0, 0] },
        { size: [0.14, 0.14, 0.14], color: '#ff0000', emissive: '#ff0000', positions: [[0.65, 1.7, 0.7], [-0.65, 1.7, 0.7]], rotation: [0, 0, 0] }
      ]
    },
    Plasma: { 
      size: [0.19, 0.19, 0.7], 
      color: '#666666',
      parts: [
        { size: [0.19, 0.19, 0.7], color: '#666666', positions: [[0.65, 1.7, 0.35], [-0.65, 1.7, 0.35]], rotation: [0, 0, 0] },
        { size: [0.14, 0.14, 0.14], color: '#00ff00', emissive: '#00ff00', positions: [[0.65, 1.7, 0.7], [-0.65, 1.7, 0.7]], rotation: [0, 0, 0] }
      ]
    },
    Missile: { 
      size: [0.19, 0.19, 0.7], 
      color: '#666666',
      parts: [
        { size: [0.19, 0.19, 0.7], color: '#666666', positions: [[0.65, 1.7, 0.35], [-0.65, 1.7, 0.35]], rotation: [0, 0, 0] },
        { size: [0.14, 0.14, 0.14], color: '#0000ff', emissive: '#0000ff', positions: [[0.65, 1.7, 0.7], [-0.65, 1.7, 0.7]], rotation: [0, 0, 0] }
      ]
    }
  },
  leg: {
    Wheels: { 
      size: [0.3, 0.3, 0.3],
      color: '#333333',
      parts: [
        // Left front wheel - using radius, radius, height for cylinder
        { size: [0.15, 0.15, 0.12], color: '#1a1a1a', positions: [[0.6, 0.15, 0.4]], rotation: [Math.PI / 2, 0, Math.PI / 2], geometry: 'cylinder' },
        // Right front wheel
        { size: [0.15, 0.15, 0.12], color: '#1a1a1a', positions: [[-0.6, 0.15, 0.4]], rotation: [Math.PI / 2, 0, Math.PI / 2], geometry: 'cylinder' },
        // Left back wheel
        { size: [0.15, 0.15, 0.12], color: '#1a1a1a', positions: [[0.6, 0.15, -0.4]], rotation: [Math.PI / 2, 0, Math.PI / 2], geometry: 'cylinder' },
        // Right back wheel
        { size: [0.15, 0.15, 0.12], color: '#1a1a1a', positions: [[-0.6, 0.15, -0.4]], rotation: [Math.PI / 2, 0, Math.PI / 2], geometry: 'cylinder' }
      ]
    },
    Tracks: { 
      size: [0.4, 0.2, 1],
      color: '#222222',
      parts: [
        // Left track
        { size: [0.4, 0.2, 1], color: '#222222', positions: [[0.7, 0.1, 0]], rotation: [0, 0, 0] },
        // Right track
        { size: [0.4, 0.2, 1], color: '#222222', positions: [[-0.7, 0.1, 0]], rotation: [0, 0, 0] }
      ]
    },
    Legs: { 
      size: [0.2, 1, 0.2],
      color: '#444444',
      parts: [
        // Left leg
        { size: [0.2, 1, 0.2], color: '#444444', positions: [[0.6, 0.5, 0]], rotation: [0, 0, 0] },
        // Right leg
        { size: [0.2, 1, 0.2], color: '#444444', positions: [[-0.6, 0.5, 0]], rotation: [0, 0, 0] }
      ]
    }
  }
}

interface RobotPartProps {
  position: [number, number, number]
  config: RobotPartConfig & {
    rotation?: [number, number, number]
    geometry?: 'box' | 'cylinder' | 'sphere'
  }
}

interface RobotProps {
  isPlayer?: boolean
  isEnemy?: boolean
}

interface RobotPart {
  id: string
  type: string
  position?: [number, number, number]
  customColors: {
    primary: string
    secondary?: string
    accent?: string
  }
}

const RobotPart: React.FC<RobotPartProps> = ({ position, config }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  useEffect(() => {
    if (meshRef.current && config.rotation) {
      meshRef.current.rotation.set(...config.rotation)
    }
    // Cleanup
    const currentMaterial = materialRef.current
    const currentMesh = meshRef.current
    return () => {
      if (currentMaterial) {
        currentMaterial.dispose()
      }
      if (currentMesh?.geometry) {
        currentMesh.geometry.dispose()
      }
    }
  }, [config.rotation])

  return (
    <mesh ref={meshRef} position={position}>
      {config.geometry === 'cylinder' ? (
        <cylinderGeometry args={[config.size[0], config.size[1], config.size[2], 32]} />
      ) : (
        <boxGeometry args={config.size} />
      )}
      <meshStandardMaterial 
        ref={materialRef}
        color={config.color} 
        emissive={config.emissive || '#000000'} 
        emissiveIntensity={config.emissive ? 0.5 : 0}
      />
    </mesh>
  )
}

export default function Robot({ isPlayer = false, isEnemy = false }: RobotProps) {
  const ref = useRef<THREE.Group>(null)
  const robotParts = useGameStore((state) => state.robotParts)
  const currentRobot = useGameStore((state) => state.currentRobot)
  const enemyRobot = useGameStore((state) => state.enemyRobot)

  // Use appropriate parts for player/enemy/customization
  const parts = isEnemy ? (enemyRobot?.parts?.length ? enemyRobot.parts : getDefaultRobotParts()) :
                isPlayer ? (currentRobot?.parts || robotParts) :
                robotParts

  // Reset rotation when entering battle mode
  useEffect(() => {
    if (ref.current && (isPlayer || isEnemy)) {
      ref.current.rotation.y = 0 // Reset any accumulated rotation
    }
  }, [isPlayer, isEnemy])

  // Cleanup effect
  useEffect(() => {
    const currentGroup = ref.current
    return () => {
      if (currentGroup) {
        currentGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            } else if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose())
            }
          }
        })
      }
    }
  }, [])

  useFrame((_state, delta) => {
    if (ref.current && !isEnemy && !isPlayer) {
      // Only rotate in customization mode
      ref.current.rotation.y += delta * 0.3
    }
  })

  // Helper function to generate random robot parts
  function getDefaultRobotParts(): RobotPart[] {
    const headTypes = ['Standard', 'Battle', 'Scout'];
    const bodyTypes = ['Light', 'Medium', 'Heavy'];
    const armTypes = ['Laser', 'Plasma', 'Missile'];
    const legTypes = ['Wheels', 'Tracks', 'Legs'];

    // Random part selection
    const randomHead = headTypes[Math.floor(Math.random() * headTypes.length)];
    const randomBody = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
    const randomArm = armTypes[Math.floor(Math.random() * armTypes.length)];
    const randomLeg = legTypes[Math.floor(Math.random() * legTypes.length)];

    // Generate random colors
    const getRandomColor = () => {
      const colors = [
        '#ff0000', '#00ff00', '#0000ff',  // Primary colors
        '#ff00ff', '#00ffff', '#ffff00',  // Secondary colors
        '#444444', '#666666', '#888888',  // Grays
        '#8B0000', '#006400', '#00008B',  // Dark variants
        '#FF4500', '#32CD32', '#4169E1'   // Bright variants
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Create random emissive accents for certain parts
    const headAccent = getRandomColor();
    const armAccent = getRandomColor();

    return [
      { 
        id: `head-${randomHead}-default`, 
        type: 'head',
        position: [0, 2.5, 0],
        customColors: { 
          primary: '#444444', 
          secondary: '#333333', 
          accent: headAccent  // Random eye color
        } 
      },
      { 
        id: `body-${randomBody}-default`, 
        type: 'body',
        position: [0, 1.5, 0],
        customColors: { 
          primary: getRandomColor(), 
          secondary: '#1d1d1d', 
          accent: '#3d3d3d' 
        } 
      },
      { 
        id: `arm-${randomArm}-default`, 
        type: 'arm',
        position: [0, 1.7, 0],
        customColors: { 
          primary: '#666666', 
          secondary: '#666666', 
          accent: armAccent  // Random weapon glow
        } 
      },
      { 
        id: `leg-${randomLeg}-default`, 
        type: 'leg',
        position: [0, 0.1, 0],
        customColors: { 
          primary: '#222222' 
        } 
      }
    ];
  }

  return (
    <>
      {parts.map((part) => {
      const partType = part.type as keyof typeof PART_CONFIGS
      const partName = part.id.split('-')[1]
      const config = PART_CONFIGS[partType]?.[partName]
      if (config) {
        if ((partType === 'arm' || partType === 'leg' || partType === 'head' || partType === 'body') && config.parts) {
        // For legs and arms, only use primary color for all parts
        if (partType === 'leg' || partType === 'arm') {
          return (
          <>
            {config.parts.map((subPart, index) => (
            subPart.positions.map((pos) => (
              <RobotPart 
              key={`${part.id}-${index}-${pos[0]}`}
              position={pos as [number, number, number]}
              config={{
                ...subPart,
                position: undefined,
                positions: undefined,
                color: part.customColors?.primary || subPart.color
              }}
              />
            ))
            ))}
          </>
          )
        }
        // For arms and heads, use all three colors
        if (partType === 'body' || partType === 'head') {
          return (
          <>
            <RobotPart 
            key={`${part.id}-main`}
            position={config.position || part.position || [0, 0, 0]}
            config={{
              ...config,
              parts: undefined,
              color: part.customColors?.primary || config.color
            }}
            />
            {config.parts.map((subPart, index) => (
            subPart.positions.map((pos) => (
              <RobotPart 
              key={`${part.id}-${index}-${pos[0]}`}
              position={pos as [number, number, number]}
              config={{
                ...subPart,
                position: undefined,
                positions: undefined,
                color: (index === 0 && part.customColors?.secondary) || 
                  (index === 1 && part.customColors?.accent) || 
                  subPart.color,
                emissive: subPart.emissive
              }}
              />
            ))
            ))}
          </>
          )
        }
        // For body parts
        return (
          <>
          <RobotPart 
            key={`${part.id}-main`}
            position={config.position || part.position || [0, 0, 0]}
            config={{
            ...config,
            parts: undefined,
            color: part.customColors?.primary || config.color
            }}
          />
          {config.parts.map((subPart, index) => (
            subPart.positions.map((pos) => (
            <RobotPart 
              key={`${part.id}-${index}-${pos[0]}`}
              position={pos as [number, number, number]}
              config={{
              ...subPart,
              position: undefined,
              positions: undefined,
              color: (index === 0 && part.customColors?.secondary) || 
                   (index === 1 && part.customColors?.accent) || 
                   subPart.color
              }}
            />
            ))
          ))}
          </>
        )
        }
        return (
        <RobotPart 
          key={part.id}
          position={config.position || part.position || [0, 0, 0]}
          config={{
          ...config,
          color: part.customColors?.primary || config.color
          }}
        />
        )
      }
      return null
      })}
    </>     
  )
}
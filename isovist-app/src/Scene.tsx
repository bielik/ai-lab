import { useRef, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { Buildings } from './Buildings'
import { Streets } from './Streets'
import { Isovist } from './Isovist'
import { GeoJSONCollection } from './types'

interface SceneProps {
  buildingsData: GeoJSONCollection
  streetsData: GeoJSONCollection
  center: [number, number]
  viewpoint: THREE.Vector3 | null
  setViewpoint: (v: THREE.Vector3) => void
  maxRadius: number
}

export function Scene({ buildingsData, streetsData, center, viewpoint, setViewpoint, maxRadius }: SceneProps) {
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
  }, [])

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!pointerDownPos.current) return
    const dx = e.nativeEvent.clientX - pointerDownPos.current.x
    const dy = e.nativeEvent.clientY - pointerDownPos.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 5 && e.point) {
      setViewpoint(new THREE.Vector3(e.point.x, 0, e.point.z))
    }
    pointerDownPos.current = null
  }, [setViewpoint])

  return (
    <>
      {/* Lighting — soft ambient + warm directional + subtle fill */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.7} color="#ffffff" />
      <directionalLight position={[-8, 12, -6]} intensity={0.2} color="#e8eeff" />
      <hemisphereLight args={['#f0f0ff', '#d0d0e0', 0.3]} />

      {/* Contact shadows on the ground plane */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={30}
        blur={2.5}
        far={1}
        resolution={512}
      />

      {/* Camera controls */}
      <OrbitControls makeDefault />

      {/* Buildings */}
      <Buildings data={buildingsData} center={center} />

      {/* Streets */}
      <Streets data={streetsData} center={center} />

      {/* Invisible ground plane for click interaction */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Isovist */}
      {viewpoint && (
        <Isovist
          viewpoint={viewpoint}
          buildingsData={buildingsData}
          center={center}
          maxRadius={maxRadius}
        />
      )}
    </>
  )
}

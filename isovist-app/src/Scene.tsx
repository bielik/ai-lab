import { useRef, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
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
}

export function Scene({ buildingsData, streetsData, center, viewpoint, setViewpoint }: SceneProps) {
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
  }, [])

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!pointerDownPos.current) return
    const dx = e.nativeEvent.clientX - pointerDownPos.current.x
    const dy = e.nativeEvent.clientY - pointerDownPos.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Only place viewpoint if this was a click (not a drag)
    if (dist < 5 && e.point) {
      setViewpoint(new THREE.Vector3(e.point.x, 0, e.point.z))
    }
    pointerDownPos.current = null
  }, [setViewpoint])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

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
        />
      )}
    </>
  )
}

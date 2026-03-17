import { useMemo } from 'react'
import * as THREE from 'three'
import { GeoJSONCollection } from './types'

const SCALE = 1000

interface StreetsProps {
  data: GeoJSONCollection
  center: [number, number]
}

export function Streets({ data, center }: StreetsProps) {
  const geometry = useMemo(() => {
    const points: number[] = []

    for (const feature of data.features) {
      if (feature.geometry.type !== 'LineString') continue

      const coords = feature.geometry.coordinates as unknown as number[][]

      for (let i = 0; i < coords.length - 1; i++) {
        const a = coords[i]
        const b = coords[i + 1]
        points.push(
          (a[0] - center[0]) * SCALE, 0.01, -(a[1] - center[1]) * SCALE,
          (b[0] - center[0]) * SCALE, 0.01, -(b[1] - center[1]) * SCALE
        )
      }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    return geom
  }, [data, center])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#bbbbbb" />
    </lineSegments>
  )
}

import { useMemo } from 'react'
import * as THREE from 'three'
import { GeoJSONCollection } from './types'

// Coordinates are in CRS84 degrees; 1° ≈ 111 km.
// With SCALE = 1000, 1 scene unit ≈ 111 m.
// Heights in the GeoJSON are in metres, so divide by ~111 to match.
const SCALE = 1000
const HEIGHT_SCALE = SCALE / 111000 // ≈ 0.009

interface BuildingsProps {
  data: GeoJSONCollection
  center: [number, number]
}

export function Buildings({ data, center }: BuildingsProps) {
  const geometry = useMemo(() => {
    const positions: number[] = []
    const indices: number[] = []

    for (const feature of data.features) {
      if (feature.geometry.type !== 'MultiPolygon') continue

      const polys = feature.geometry.coordinates as number[][][][]

      for (const polygon of polys) {
        for (const ring of polygon) {
          if (ring.length < 3) continue

          const baseIdx = positions.length / 3

          for (const coord of ring) {
            positions.push(
              (coord[0] - center[0]) * SCALE,
              (coord[2] ?? 0) * HEIGHT_SCALE, // height in metres → scene units
              -(coord[1] - center[1]) * SCALE
            )
          }

          // Triangulate the polygon face (fan from first vertex)
          const vertCount = ring.length
          const n = (ring[0][0] === ring[vertCount - 1][0] && ring[0][1] === ring[vertCount - 1][1])
            ? vertCount - 1
            : vertCount

          for (let i = 1; i < n - 1; i++) {
            indices.push(baseIdx, baseIdx + i, baseIdx + i + 1)
          }
        }
      }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geom.setIndex(indices)
    geom.computeVertexNormals()
    return geom
  }, [data, center])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="white" side={THREE.DoubleSide} />
    </mesh>
  )
}

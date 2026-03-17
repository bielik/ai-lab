import { useMemo } from 'react'
import * as THREE from 'three'
import { GeoJSONCollection } from './types'

const SCALE = 1000
const RAY_COUNT = 360
const MAX_RADIUS = 2 // in scaled units

interface IsovistProps {
  viewpoint: THREE.Vector3
  buildingsData: GeoJSONCollection
  center: [number, number]
}

// Extract 2D building footprint edges (on the ground plane) from the 3D building data
function extractFootprintEdges(data: GeoJSONCollection, center: [number, number]): [number, number, number, number][] {
  const edges: [number, number, number, number][] = []
  const edgeSet = new Set<string>()

  for (const feature of data.features) {
    if (feature.geometry.type !== 'MultiPolygon') continue
    const polys = feature.geometry.coordinates as number[][][][]

    for (const polygon of polys) {
      for (const ring of polygon) {
        // Collect ground-level edges (z === 0) from each face
        const groundPts: [number, number][] = []
        for (const coord of ring) {
          if (Math.abs(coord[2]) < 0.01) {
            groundPts.push([
              (coord[0] - center[0]) * SCALE,
              -(coord[1] - center[1]) * SCALE
            ])
          }
        }

        for (let i = 0; i < groundPts.length - 1; i++) {
          const [x1, z1] = groundPts[i]
          const [x2, z2] = groundPts[i + 1]
          // Skip degenerate edges
          if (Math.abs(x1 - x2) < 0.0001 && Math.abs(z1 - z2) < 0.0001) continue

          // Deduplicate edges
          const key = [
            Math.round(Math.min(x1, x2) * 10000),
            Math.round(Math.min(z1, z2) * 10000),
            Math.round(Math.max(x1, x2) * 10000),
            Math.round(Math.max(z1, z2) * 10000)
          ].join(',')
          if (!edgeSet.has(key)) {
            edgeSet.add(key)
            edges.push([x1, z1, x2, z2])
          }
        }
      }
    }
  }

  return edges
}

// Ray-segment intersection in 2D (XZ plane)
function raySegmentIntersect(
  ox: number, oz: number, dx: number, dz: number,
  x1: number, z1: number, x2: number, z2: number
): number | null {
  const sx = x2 - x1
  const sz = z2 - z1

  const denom = dx * sz - dz * sx
  if (Math.abs(denom) < 1e-10) return null

  const t = ((x1 - ox) * sz - (z1 - oz) * sx) / denom
  const u = ((x1 - ox) * dz - (z1 - oz) * dx) / denom

  if (t > 0.001 && u >= 0 && u <= 1) {
    return t
  }
  return null
}

export function Isovist({ viewpoint, buildingsData, center }: IsovistProps) {
  const shape = useMemo(() => {
    const edges = extractFootprintEdges(buildingsData, center)
    const vx = viewpoint.x
    const vz = viewpoint.z
    const points: THREE.Vector3[] = []

    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = (i / RAY_COUNT) * Math.PI * 2
      const dx = Math.cos(angle)
      const dz = Math.sin(angle)

      let minDist = MAX_RADIUS

      for (const [x1, z1, x2, z2] of edges) {
        const t = raySegmentIntersect(vx, vz, dx, dz, x1, z1, x2, z2)
        if (t !== null && t < minDist) {
          minDist = t
        }
      }

      points.push(new THREE.Vector3(
        vx + dx * minDist,
        0.02, // slightly above ground
        vz + dz * minDist
      ))
    }

    // Create shape geometry
    const shapeGeom = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    // Center point
    vertices.push(vx, 0.02, vz)

    // Fan points
    for (const p of points) {
      vertices.push(p.x, p.y, p.z)
    }

    // Fan triangles
    for (let i = 1; i <= RAY_COUNT; i++) {
      const next = i === RAY_COUNT ? 1 : i + 1
      indices.push(0, i, next)
    }

    shapeGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    shapeGeom.setIndex(indices)

    return shapeGeom
  }, [viewpoint, buildingsData, center])

  return (
    <group>
      {/* Isovist polygon */}
      <mesh geometry={shape}>
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Viewpoint marker */}
      <mesh position={[viewpoint.x, 0.05, viewpoint.z]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  )
}

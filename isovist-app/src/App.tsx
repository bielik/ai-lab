import { useState, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './Scene'
import { GeoJSONCollection } from './types'

function App() {
  const [buildingsData, setBuildingsData] = useState<GeoJSONCollection | null>(null)
  const [streetsData, setStreetsData] = useState<GeoJSONCollection | null>(null)
  const [viewpoint, setViewpoint] = useState<THREE.Vector3 | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}weimar-buildings-3d.geojson`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}weimar-streets.geojson`).then(r => r.json())
    ]).then(([buildings, streets]) => {
      setBuildingsData(buildings)
      setStreetsData(streets)
      setLoading(false)
    })
  }, [])

  // Compute center of the data for coordinate normalization
  const center = useMemo<[number, number]>(() => {
    if (!streetsData) return [0, 0]

    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    for (const feature of streetsData.features) {
      const coords = feature.geometry.coordinates as unknown as number[][]
      for (const c of coords) {
        minX = Math.min(minX, c[0])
        maxX = Math.max(maxX, c[0])
        minY = Math.min(minY, c[1])
        maxY = Math.max(maxY, c[1])
      }
    }

    return [(minX + maxX) / 2, (minY + maxY) / 2]
  }, [streetsData])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">Loading Weimar data...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 12, 12], fov: 50, near: 0.01, far: 1000 }}
        style={{ background: 'white' }}
      >
        <Scene
          buildingsData={buildingsData!}
          streetsData={streetsData!}
          center={center}
          viewpoint={viewpoint}
          setViewpoint={setViewpoint}
        />
      </Canvas>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm">
        Click on the ground to place a viewpoint and compute the isovist
      </div>
    </div>
  )
}

export default App

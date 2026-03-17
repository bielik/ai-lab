import { useState, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './Scene'
import { GeoJSONCollection } from './types'

function App() {
  const [buildingsData, setBuildingsData] = useState<GeoJSONCollection | null>(null)
  const [streetsData, setStreetsData] = useState<GeoJSONCollection | null>(null)
  const [viewpoint, setViewpoint] = useState<THREE.Vector3 | null>(null)
  const [maxRadius, setMaxRadius] = useState(2)
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

  // Convert scene units to real-world metres (1 scene unit ≈ 111 m)
  const radiusMetres = Math.round(maxRadius * 111)

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">Loading Weimar data...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 12, 12], fov: 50, near: 0.01, far: 1000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: '#fafafa' }}
      >
        <Scene
          buildingsData={buildingsData!}
          streetsData={streetsData!}
          center={center}
          viewpoint={viewpoint}
          setViewpoint={setViewpoint}
          maxRadius={maxRadius}
        />
      </Canvas>

      {/* Controls panel */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-5 py-4 shadow-md border border-gray-100 w-64">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Isovist Settings</h2>

        <label className="block text-xs text-gray-500 mb-1">
          Range: {radiusMetres} m
        </label>
        <input
          type="range"
          min="0.5"
          max="6"
          step="0.1"
          value={maxRadius}
          onChange={e => setMaxRadius(parseFloat(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
          <span>55 m</span>
          <span>666 m</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-500 shadow-sm">
        Click on the ground to place a viewpoint
      </div>
    </div>
  )
}

export default App

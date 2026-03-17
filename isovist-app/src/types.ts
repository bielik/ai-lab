export interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, string>
  geometry: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
}

export interface GeoJSONCollection {
  type: 'FeatureCollection'
  name: string
  features: GeoJSONFeature[]
}

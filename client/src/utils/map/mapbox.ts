// src/utils/mapboxUtils.ts
import mapboxgl from 'mapbox-gl';
import type { GeoJSONFeature } from 'mapbox-gl';
import { sources, endpoints } from '../../config/mapbox/sources';
import { layers } from '../../config/mapbox/layers';
import type { WritableAtom } from 'nanostores';

interface IncidentProperties {
  datetime: string;
  race: string;
  sex: string;
  age: string;
  fatal: string;
  census_tract: string;
  len: number;
}

export const initializeMap = (container: HTMLDivElement, options: Object) => {
  if (!mapboxgl.accessToken) {
    mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
  }

  return new mapboxgl.Map({
    container,
    ...options,
  });
};

export const fetchGeoJSON = async (url: string): Promise<GeoJSON.FeatureCollection> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON from ${url}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GeoJSON from ${url}:`, error);
    // Return empty feature collection as fallback
    return { type: 'FeatureCollection', features: [] };
  }
};

export const setupMapSources = async (map: mapboxgl.Map) => {
  try {
    // Add sources with empty data first
    Object.entries(sources).forEach(([id, source]) => {
      if (!map.getSource(id)) {
        map.addSource(id, source);
      }
    });

    // Fetch data
    const [shootingData, censusData] = await Promise.all([
      fetchGeoJSON(endpoints.shooting),
      fetchGeoJSON(endpoints.censusBlocks),
    ]);

    // Update sources with fetched data
    (map.getSource('shooting') as mapboxgl.GeoJSONSource)?.setData(shootingData);
    (map.getSource('censusBlocks') as mapboxgl.GeoJSONSource)?.setData(censusData);

    return { shootingData, censusData };
  } catch (error) {
    console.error('Error setting up map sources:', error);
    throw error;
  }
};

type LayerKey = keyof typeof layers;

export const setupMapLayers = (map: mapboxgl.Map) => {
  try {
    // Specify the layer order with correct typing
    const layerOrder: LayerKey[] = ['heatmap', 'points', 'censusOutline', 'censusFill'];
    
    layerOrder.forEach(layerId => {
      const layer = layers[layerId];
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
      }
    });
  } catch (error) {
    console.error('Error setting up map layers:', error);
    throw error;
  }
};



export const setupMapEvents = (
  map: mapboxgl.Map,
  censusBlockStore: WritableAtom<string[]>
) => {
  // Shooting point click event
  map.on("click", "shooting-point", (e) => {
    if (!e.features?.length) return;

    const feature = e.features[0] as GeoJSONFeature;
    const coordinates = (feature.geometry as GeoJSON.Point).coordinates;

    if (!coordinates) return;

    new mapboxgl.Popup({ className: "text-black" })
      .setLngLat([coordinates[0], coordinates[1]])
      .setHTML(createPopupContent(feature.properties as IncidentProperties))
      .addTo(map);
  });

  // Census block click event
  map.on("click", "census-blocks-fill", (e) => {
    if (!e.features?.length) return;
    const blockId = e.features[0].properties?.id;
    if (blockId) {
      const currentBlocks = censusBlockStore.get();
      censusBlockStore.set(
        currentBlocks.includes(blockId)
          ? currentBlocks.filter(id => id !== blockId)
          : [...currentBlocks, blockId]
      );
    }
  });

  // Hover events
  map.on("mouseenter", "census-blocks-fill", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "census-blocks-fill", () => {
    map.getCanvas().style.cursor = "";
  });
};

export const updateShootingData = (
  map: mapboxgl.Map,
  data: GeoJSON.FeatureCollection
) => {
  const source = map.getSource('shooting') as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData(data);
  }
};

const createPopupContent = (properties: IncidentProperties): string => {
  const datetime = properties.datetime ? new Date(properties.datetime) : null;
  
  return `
    <p>
      <span>Date: ${datetime?.toLocaleDateString() || ""}</span>
      <br/>
      <span>Time: ${datetime?.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      }) || ""}</span>
      <br/>
      <span>Race: ${properties.race || ""}</span>
      <br/>
      <span>Sex: ${properties.sex || ""}</span>
      <br/>
      <span>Age: ${properties.age ? parseInt(properties.age) : ""}</span>
      <br/>
      <span>Fatal: ${properties.fatal === "1.0" ? "Yes" : "No"}</span>
      <br/>
      <span>Census Tract: ${properties.census_tract || ""}</span>
    </p>
  `;
};

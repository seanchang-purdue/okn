// src/utils/map/mapUpdates.ts
import type mapboxgl from 'mapbox-gl';

export const updateCensusSelection = (map: mapboxgl.Map, selectedBlocks: string[]) => {
  map.setPaintProperty(
    'census-blocks-fill',
    'fill-color',
    [
      'case',
      ['in', ['get', 'id'], ['literal', selectedBlocks]],
      'rgba(18, 120, 240, 0.5)', // Selected color
      'rgba(0, 0, 0, 0)', // Transparent for unselected
    ]
  );
};

export const updateCensusVisibility = (map: mapboxgl.Map, visible: boolean) => {
  const visibility = visible ? 'visible' : 'none';
  map.setLayoutProperty('census-block-outline', 'visibility', visibility);
  map.setLayoutProperty('census-blocks-fill', 'visibility', visibility);
};

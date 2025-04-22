// src/config/mapbox/layers.ts
import type {
  HeatmapLayerSpecification,
  CircleLayerSpecification,
  LineLayerSpecification,
  FillLayerSpecification,
} from "mapbox-gl";

export const layers = {
  heatmap: {
    id: "shooting-heat",
    type: "heatmap",
    source: "shooting",
    paint: {
      "heatmap-intensity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        0.6,
        9,
        1.6,
      ],
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(0,0,0,0)",
        0.4,
        "rgba(105,169,255,09)",
        0.6,
        "rgba(30,220,175,0.9)",
        0.8,
        "rgba(255,218,71,0.9)",
        0.9,
        "rgba(255,131,0,0.9)",
        1,
        "rgba(220,0,0,0.9)",
      ],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 2, 8, 5, 12],
      "heatmap-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        2,
        0.2,
        7,
        1,
        16,
        0,
      ],
    },
  } satisfies HeatmapLayerSpecification,

  points: {
    id: "shooting-point",
    type: "circle",
    source: "shooting",
    minzoom: 14,
    paint: {
      "circle-radius": {
        stops: [
          [14, 4],
          [16, 8],
          [20, 15],
        ],
      },
      "circle-color": [
        "match",
        ["get", "fatal"],
        "1.0", // When fatal is exactly "1.0"
        "rgb(220,0,0)", // red - fatal incidents
        // Default case (when fatal is not "1.0")
        "rgb(0,0,220)", // original blue - non-fatal incidents
      ],
      "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
      "circle-stroke-width": 1.5,
      "circle-opacity": {
        stops: [
          [14, 0.2],
          [16, 0.8],
          [20, 1],
        ],
      },
    },
  } satisfies CircleLayerSpecification,
  

  censusOutline: {
    id: "census-block-outline",
    type: "line",
    source: "censusBlocks",
    layout: {
      visibility: "none",
    },
    paint: {
      "line-dasharray": [2, 1],
      "line-color": "rgba(16, 132, 243, 0.5)",
      "line-width": 2,
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0, 12, 1, 15, 0],
    },
  } satisfies LineLayerSpecification,

  censusFill: {
    id: "census-blocks-fill",
    type: "fill",
    source: "censusBlocks",
    paint: {
      "fill-color": [
        "case",
        ["in", ["get", "id"], ["literal", []]],
        "rgba(16, 132, 243, 0.5)",
        "rgba(0, 0, 0, 0)",
      ],
      "fill-outline-color": "rgba(16, 132, 243, 0.5)",
    },
  } satisfies FillLayerSpecification,
};

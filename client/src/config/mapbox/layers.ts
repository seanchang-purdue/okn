// src/config/mapbox/layers.ts
import type { 
    HeatmapLayerSpecification, 
    CircleLayerSpecification, 
    LineLayerSpecification, 
    FillLayerSpecification 
} from 'mapbox-gl';

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
                0.4,
                9,
                1.5
            ],
            "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(0,0,0,0)",
                0.4,
                "rgba(105,169,255,0.8)",
                0.6,
                "rgba(30,220,175,0.8)",
                0.8,
                "rgba(255,218,71,0.8)",
                0.9,
                "rgba(255,131,0,0.8)",
                1,
                "rgba(220,0,0,0.8)"
            ],
            "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2,
                4,
                5,
                7
            ],
            "heatmap-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2,
                0,
                7,
                1,
                16,
                0
            ]
        }
    } satisfies HeatmapLayerSpecification,

    points: {
        id: "shooting-point",
        type: "circle",
        source: "shooting",
        minzoom: 14,
        paint: {
            "circle-radius": {
                stops: [
                    [14, 2],
                    [16, 5],
                    [20, 10]
                ]
            },
            "circle-color": {
                stops: [
                    [14, "rgb(25,25,112)"],     // Midnight Blue
                    [16, "rgb(0,0,139)"],       // Dark Blue
                    [17, "rgb(0,0,105)"],       // Deeper Navy
                    [18, "rgb(0,0,85)"],        // Very Deep Navy
                    [19, "rgb(0,0,65)"],        // Almost Black Blue
                    [20, "rgb(0,0,45)"]         // Nearly Black
                ]
            },
            "circle-stroke-color": "white",
            "circle-stroke-width": 1,
            "circle-opacity": {
                stops: [
                    [14, 0],
                    [16, 0.7],
                    [20, 1]
                ]
            }
        }
    } satisfies CircleLayerSpecification,

    censusOutline: {
        id: "census-block-outline",
        type: "line",
        source: "censusBlocks",
        layout: {
            visibility: "none"
        },
        paint: {
            "line-dasharray": [2, 1],
            "line-color": "rgba(16, 132, 243, 0.5)",
            "line-width": 2,
            "line-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2,
                0,
                12,
                1,
                15,
                0
            ]
        }
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
                "rgba(0, 0, 0, 0)"
            ],
            "fill-outline-color": "rgba(16, 132, 243, 0.5)"
        }
    } satisfies FillLayerSpecification
};

# server/api/handlers.py
from dataclasses import dataclass
from flask import Response, jsonify
from core.controllers import LineChartController, DemographicController
from core.types import DataStore, FlaskResponse

@dataclass
class RouteHandlers:
    """Handlers for API routes"""
    line_controller: LineChartController
    demographic_controller: DemographicController
    data_store: DataStore

    def line_chart_data(self) -> FlaskResponse:
        return self.line_controller.process_chart_data()

    def demographic_chart_data(self) -> FlaskResponse:
        return self.demographic_controller.process_chart_data()

    def heatmap_geopoints(self) -> FlaskResponse:
        return jsonify(self.data_store['heatmap_data'])

    def census_block_geopoints(self) -> FlaskResponse:
        return jsonify(self.data_store['census_block_data'])

    @staticmethod
    def health_check() -> FlaskResponse:
        return jsonify({"status": "healthy"}), 200

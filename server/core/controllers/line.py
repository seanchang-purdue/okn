# core/controllers/line.py
from flask import request
from ..types import FlaskResponse, ChartRequest
from utils.draw import plot_time_series
from .base import BaseController

class LineChartController(BaseController):
    """Controller for line chart data"""
    
    def __init__(self, data_model):
        super().__init__()
        self.data_model = data_model

    def process_chart_data(self) -> FlaskResponse:
        """Process and return line chart data"""
        try:
            body: ChartRequest = request.get_json()
            if error_response := self.validate_request_body(body):
                return error_response

            start_date = body['start_date']
            end_date = body['end_date']
            census_block = body.get('census_block')
            filters = body.get('filters', {})
            interval = body.get('interval', 'M')

            self.logger.info(
                f"Processing line chart data - Date range: {start_date} to {end_date}, "
                f"Census block: {census_block}, Interval: {interval}"
            )

            try:
                census_block = self.parse_census_block(census_block)
            except ValueError as e:
                return self.api_response(success=False, error=str(e), status_code=400)

            analysis_result = plot_time_series(
                self.data_model.data,
                start_date=start_date,
                end_date=end_date,
                census_blocks=census_block,
                feature_filters=filters,
                interval=interval
            )

            if not analysis_result:
                return self.api_response(
                    success=False,
                    error="No data found for the specified parameters",
                    status_code=404
                )

            return self.api_response(data=analysis_result)

        except Exception as e:
            self.logger.error(f"Error processing line chart data: {str(e)}", exc_info=True)
            return self.api_response(success=False, error=str(e), status_code=500)
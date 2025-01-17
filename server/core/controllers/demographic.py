# core/controllers/demographic.py
from flask import request
from ..types import FlaskResponse, DemographicRequest
from utils.draw import plot_demographic_analysis
from .base import BaseController
from typing import List, Optional, Dict, Any

class DemographicController(BaseController):
    """Controller for demographic data analysis"""
    
    def __init__(self, data_model):
        super().__init__()
        self.data_model = data_model

    def validate_demographic_features(self, features: List) -> Optional[FlaskResponse]:
        """Validate demographic features input"""
        if not features or not isinstance(features, list):
            return self.api_response(
                success=False,
                error="demographic_features must be a non-empty list",
                status_code=400
            )
        return None

    def process_chart_data(self) -> FlaskResponse:
        """Process and return demographic chart data"""
        try:
            body: DemographicRequest = request.get_json()
            if error_response := self.validate_request_body(body):
                return error_response

            demographic_features = body['demographic_features']
            start_date = body['start_date']
            end_date = body['end_date']
            census_block = body.get('census_block')
            filters = body.get('filters', {})

            self.logger.info(
                f"Processing demographic data - Features: {demographic_features}, "
                f"Date range: {start_date} to {end_date}, "
                f"Census block: {census_block}, Filters: {filters}"
            )

            if error_response := self.validate_demographic_features(demographic_features):
                return error_response

            try:
                census_block = self.parse_census_block(census_block)
            except ValueError as e:
                return self.api_response(success=False, error=str(e), status_code=400)

            analysis_results = self._process_features(
                demographic_features, census_block, start_date, end_date, filters
            )

            if not analysis_results:
                return self.api_response(
                    success=False,
                    error="No data found for the specified parameters",
                    status_code=404
                )

            return self.api_response(data=analysis_results)

        except Exception as e:
            self.logger.error(f"Error processing demographic data: {str(e)}", exc_info=True)
            return self.api_response(success=False, error=str(e), status_code=500)

    def _process_features(self, features: List[str], census_block: Any,
                         start_date: str, end_date: str, filters: Dict) -> Dict[str, Any]:
        """Process data for multiple demographic features"""
        analysis_results = {}
        
        for feature in features:
            result = plot_demographic_analysis(
                self.data_model.data,
                feature,
                census_blocks=census_block,
                start_date=start_date,
                end_date=end_date,
                feature_filters=filters
            )
            
            if result is not None:
                analysis_results[feature] = result
            else:
                self.logger.warning(f"No results for feature: {feature}")

        return analysis_results
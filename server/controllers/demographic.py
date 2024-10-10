###################################################
# Name: Demographic Controller
# Description: This controller is for sending the
# demographic data payload to the frontend.
###################################################
from flask import request, jsonify
import ast
from utils.draw import plot_demographic_analysis
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def demographic_chart(data_model):
    body = request.get_json()
    if not body:
        return jsonify({"error": "Request body is empty"}), 400

    demographic_features = body.get('demographic_features')
    start_date = body.get('start_date')
    end_date = body.get('end_date')
    census_block = body.get('census_block')
    filters = body.get('filters', {})

    logger.info(f"Received request - Features: {demographic_features}, Date range: {start_date} to {end_date}, Census block: {census_block}, Filters: {filters}")

    if not demographic_features or not isinstance(demographic_features, list):
        return jsonify({"error": "demographic_features must be a non-empty list"}), 400

    if census_block and isinstance(census_block, str):
        try:
            census_block = ast.literal_eval(census_block)
        except ValueError:
            return jsonify({"error": "Invalid format for census_block"}), 400

    try:
        analysis_results = {}
        for feature in demographic_features:
            result = plot_demographic_analysis(data_model.data, feature, census_blocks=census_block, 
                                               start_date=start_date, end_date=end_date, feature_filters=filters)
            if result is None:
                logger.warning(f"No results for feature: {feature}")
            else:
                analysis_results[feature] = result

        if not analysis_results:
            return jsonify({"error": "No data found for the specified parameters"}), 404

        return jsonify(analysis_results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
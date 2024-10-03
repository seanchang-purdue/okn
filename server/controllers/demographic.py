###################################################
# Name: Demographic Controller
# Description: This controller is for sending the
# demographic data payload to the frontend.
###################################################
from flask import request, jsonify
import ast
from utils.draw import plot_demographic_analysis

def demographic_chart(data_model):
    body = request.get_json()

    if not body:
        return jsonify({"error": "Request body is empty"}), 400

    # Get the list of demographic features from the request body
    demographic_features = body.get('demographic_features')
    if not demographic_features or not isinstance(demographic_features, list):
        return jsonify({"error": "demographic_features must be a non-empty list"}), 400

    start_date = body.get('start_date')
    end_date = body.get('end_date')
    census_block = body.get('census_block')

    if census_block and not isinstance(census_block, list):
        census_block = ast.literal_eval(census_block)

    try:
        analysis_results = {}
        for feature in demographic_features:
            result = plot_demographic_analysis(data_model.data, feature, census_blocks=census_block, start_date=start_date, end_date=end_date)
            analysis_results[feature] = result
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(analysis_results)

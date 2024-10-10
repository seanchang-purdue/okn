###################################################
# Name: Line Controller
# Description: This controller is for sending the
# line payload to the frontend.
###################################################
import logging
from flask import request, jsonify
import ast
from utils.draw import plot_time_series

def line_chart(data_model):
    body = request.get_json()
    if not body:
        return jsonify({"error": "Request body is empty"}), 400

    start_date = body.get('start_date')
    end_date = body.get('end_date')
    census_block = body.get('census_block')
    filters = body.get('filters', {})
    interval = body.get('interval', 'M')

    if census_block and isinstance(census_block, str):
        try:
            census_block = ast.literal_eval(census_block)
        except ValueError:
            return jsonify({"error": "Invalid format for census_block"}), 400

    try:
        analysis_result = plot_time_series(data_model.data, start_date=start_date, end_date=end_date, 
                                           census_blocks=census_block, feature_filters=filters, interval=interval)
        if not analysis_result:
            return jsonify({"error": "No data found for the specified parameters"}), 404
        return jsonify(analysis_result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

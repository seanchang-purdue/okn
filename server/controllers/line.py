###################################################
# Name: Line Controller
# Description: This controller is for sending the
# line payload to the frontend.
###################################################
from flask import request, jsonify
import ast
from utils.draw import plot_time_series

def line_chart(data_model):
    # Parse the request body
    body = request.get_json()

    if not body:
        return jsonify({"error": "Request body is empty"}), 400

    # Get start and end dates from the request body
    start_date = body.get('start_date')
    end_date = body.get('end_date')
    census_block = body.get('census_block')

    if census_block and not isinstance(census_block, list):
        census_block = ast.literal_eval(census_block)

    # call plot_time_series function
    try:
        analysis_result = plot_time_series(data_model.data, census_blocks=census_block, start_date=start_date, end_date=end_date)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(analysis_result)
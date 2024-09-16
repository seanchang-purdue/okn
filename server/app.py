import pandas as pd
import shutil
from utils.draw import plot_shooting_heatmap, plot_time_series, plot_demographic_analysis, create_shooting_heatmap_on_map
from flask import Flask, render_template, request
from utils.utils import build_argument_list
from models.model import DataModel
from controllers.line import *
from controllers.demographic import *
from flask_cors import CORS, cross_origin
import os
import json

app = Flask(__name__)
# Configure CORS similarly to your Go application
cors = CORS(app, resources={r"/*": {"origins": "http://localhost:4321"}})

# Init the data model
data_model = DataModel('alignment_shooting.csv')
data = data_model.data

feature_list = open('feature_list.txt', 'r').read().split('\n')

# heatmap data
heatmap_data_path = os.path.join(os.path.dirname(__file__),'data', 'full_heatmap_geopoints.json')
with open(heatmap_data_path, 'r') as file:
    heatmap_data = json.load(file)

size_k = 150

@app.route('/', methods=['GET', 'POST'])
def index():
    selected_chart = 'none'
    if request.method == 'POST':
        selected_chart = request.form['select_chart_name']

        if selected_chart == 'none':
            return render_template('index.html', selected_chart='none')

        kwargs = {}
        if selected_chart == 'heatmap':
            kwargs['arg0'] = "2023-01-01"
            kwargs['arg1'] = "2023-12-31"
            fig = plot_shooting_heatmap(data, 
                                        start_date=kwargs['arg0'], 
                                        end_date=kwargs['arg1'])
            fig.savefig('static/images/plot.png')
            fig_path = 'static/images/plot.png'
            width = 7*size_k
            height = 7*size_k
        elif selected_chart == 'heatmap-on-map':
            kwargs['arg0'] = "2023-01-01"
            kwargs['arg1'] = "2023-12-31"
            heatmap_map = create_shooting_heatmap_on_map(data,
                                                         start_date=kwargs['arg0'],
                                                         end_date=kwargs['arg1'])
            heatmap_map.save('static/heatmap_map.html')
            html_path = 'static/heatmap_map.html'
            width = 10*size_k
            height = 8*size_k
        elif selected_chart == 'time-series':
            kwargs['arg0'] = "2023-01-01"
            kwargs['arg1'] = "2023-12-31"
            fig = plot_time_series(data, 
                                   start_date=kwargs['arg0'], 
                                   end_date=kwargs['arg1'])
            fig.savefig('static/images/plot.png')
            fig_path = 'static/images/plot.png'
            width = 10*size_k
            height = 6*size_k
        elif selected_chart == 'demographic':
            kwargs['arg0'] = feature_list[0]
            kwargs['arg1'] = "count"
            kwargs['arg2'] = "2023-01-01"
            kwargs['arg3'] = "2023-12-31"
            fig = plot_demographic_analysis(data, 
                                            demographic_feature=kwargs['arg0'], 
                                            analysis_type=kwargs['arg1'],
                                            start_date=kwargs['arg2'],
                                            end_date=kwargs['arg3'])
            fig.savefig('static/images/plot.png')
            fig_path = 'static/images/plot.png'
            width = 10*size_k
            height = 6*size_k
        
        arg_list = build_argument_list(selected_chart, **kwargs)

        if selected_chart == "heatmap-on-map":
            return render_template('index.html', 
                                   selected_chart=selected_chart, 
                                   arg_list=arg_list,
                                   html_path=html_path,
                                   width=width, height=height)
        else:
            return render_template('index.html', 
                                   selected_chart=selected_chart, 
                                   arg_list=arg_list,
                                   image_path=fig_path,
                                   width=width, height=height)

    return render_template('index.html', selected_chart='none')

@app.route('/demographic-chart', methods=['GET', 'POST'])
def demographic_vis():
    if request.method == 'POST':
        arg0 = request.form['arg0_name'] # feature
        arg1 = request.form['arg1_name'] # analysis type
        arg2 = request.form['arg2_name'] # start date
        arg3 = request.form['arg3_name'] # end date
        print(arg0, arg1, arg2, arg3)
        selected_chart = 'demographic'
        arg_list = build_argument_list(selected_chart,
                                       arg0=arg0,
                                       arg1=arg1,
                                       arg2=arg2,
                                       arg3=arg3)
        
        try:
            if arg1 == 'none' or arg2 == 'none':
                raise Exception('Invalid args')
            fig = plot_demographic_analysis(data, 
                                            demographic_feature=arg0, 
                                            analysis_type=arg1,
                                            start_date=arg2,
                                            end_date=arg3)
            fig.savefig('static/images/plot.png')
            fig_path = 'static/images/plot.png'
            width = 10*size_k
            height = 6*size_k
        except:
            fig_path = 'static/images/error.png'
            width = 5*size_k
            height = 5*size_k
        return render_template('index.html', 
                               selected_chart=selected_chart, 
                               arg_list=arg_list,
                               image_path=fig_path,
                               width=width, height=height)
    return render_template('index.html', selected_chart='none',)

@app.route('/time-series-chart', methods=['GET', 'POST'])
def time_series_vis():
    if request.method == 'POST':
        arg0 = request.form['arg0_name'] # start date
        arg1 = request.form['arg1_name'] # end date
        print(arg0, arg1)
        selected_chart = 'time-series'
        arg_list = build_argument_list(selected_chart,
                                       arg0=arg0,
                                       arg1=arg1)
        try:
            fig = plot_time_series(data, arg0, arg1)
            fig.savefig('static/images/plot.png')
            fig_path = 'static/images/plot.png'
            width = 10*size_k
            height = 6*size_k
        except:
            fig_path = 'static/images/error.png'
            width = 5*size_k
            height = 5*size_k
        return render_template('index.html', 
                               selected_chart=selected_chart, 
                               arg_list=arg_list,
                               image_path=fig_path,
                               width=width, height=height)
    return render_template('index.html', selected_chart='none')

@app.route('/heatmap-chart', methods=['GET', 'POST'])
def heatmap_vis():
    if request.method == 'POST':
        arg0 = request.form['arg0_name'] # start date
        arg1 = request.form['arg1_name'] # end date
        print(arg0, arg1)
        selected_chart = 'heatmap'
        arg_list = build_argument_list(selected_chart,
                                       arg0=arg0,
                                       arg1=arg1)
        try:
            fig = plot_shooting_heatmap(data, arg0, arg1)
            fig.savefig('static/images/plot.png')
            fig_path = 'static/images/plot.png'
            width = 7*size_k
            height = 7*size_k
        except:
            fig_path = 'static/images/error.png'
            width = 5*size_k
            height = 5*size_k
        return render_template('index.html', 
                               selected_chart=selected_chart, 
                               arg_list=arg_list,
                               image_path=fig_path,
                               width=width, height=height)
    return render_template('index.html', selected_chart='none')

@app.route('/heatmap-on-map-chart', methods=['GET', 'POST'])
def heatmap_on_map_vis():
    if request.method == 'POST':
        arg0 = request.form['arg0_name'] # start date
        arg1 = request.form['arg1_name'] # end date
        print(arg0, arg1)

        selected_chart = 'heatmap-on-map'
        arg_list = build_argument_list(selected_chart,
                                       arg0=arg0,
                                       arg1=arg1)
        try:
            heatmap_map = create_shooting_heatmap_on_map(data,
                                                 start_date=arg0,
                                                 end_date=arg1)
            heatmap_map.save('static/heatmap_map.html')
            html_path = 'static/heatmap_map.html'
            width = 10*size_k
            height = 8*size_k
            return render_template('index.html', 
                                   selected_chart=selected_chart, 
                                   arg_list=arg_list,
                                   html_path=html_path,
                                   width=width, height=height)
        except:
            fig_path = 'static/images/error.png'
            width = 5*size_k
            height = 5*size_k
            return render_template('index.html', 
                                    selected_chart=selected_chart, 
                                    arg_list=arg_list,
                                    image_path=fig_path,
                                    width=width, height=height)
    return render_template('index.html', selected_chart='none')

# line chart endpoint
@app.route('/line-chart-data', methods=["POST", "OPTIONS"])
@cross_origin()
def line_chart_data():
    return line_chart(data_model)

# demographic chart endpoint
@app.route('/demographic-chart-data', methods=["POST", "OPTIONS"])
@cross_origin()
def demographic_chart_data():
    return demographic_chart(data_model)

# heatmap data endpoint
@app.route('/heatmap-geopoints', methods=["GET", "OPTIONS"])
@cross_origin(origin="http://localhost:4321", headers=['Content-Type', 'Authorization'])
def heatmap_geopoints():
    response_data = jsonify(heatmap_data)
    return response_data

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=12345, debug=True)

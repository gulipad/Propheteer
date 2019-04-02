from flask import Flask, send_from_directory, jsonify, request
import flask_excel as excel
import pandas as pd
import brain

app = Flask(__name__, template_folder='static', static_folder='static')
excel.init_excel(app)


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/static/<path:path>")
def get_assets(path):
    return send_from_directory(app.static_folder, path)


@app.route("/predict", methods=['GET','POST'])
def test():
    data_dict = request.get_dict(field_name='file')
    df = pd.DataFrame.from_dict(data_dict)
    print(df.head(10))
    test = brain.make_prediction(df)
    return jsonify({'data': test})

@app.route("/process_upload", methods=['GET','POST'])
def process():
    data_dict = request.get_dict(field_name='file')
    df = pd.DataFrame.from_dict(data_dict)
    return jsonify({'data': df.to_json(orient="records")})

@app.route("/prophet/predict", methods=['GET','POST'])
def predict():
    params = request.get_json()
    df = pd.DataFrame.from_dict(params.get('data'))
    print(df.head(10))
    prediction = brain.make_prediction(df)
    return prediction

if __name__ == '__main__':
    app.config.update(
        DEBUG=True,
        TEMPLATES_AUTO_RELOAD=True
    )
    app.run()

import pandas as pd
import matplotlib  
matplotlib.use('TkAgg')   
import matplotlib.pyplot as plt
from fbprophet import Prophet

def make_prediction(input_data):
	df = input_data
	m = Prophet(interval_width = 0.95)
	m.fit(df)
	future = m.make_future_dataframe(periods = 30)
	forecast = m.predict(future)
	return forecast.to_json(orient="records")
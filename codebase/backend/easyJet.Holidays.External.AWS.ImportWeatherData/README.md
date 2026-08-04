# ImportWeatherData lambda

Imports weather data from WWO MCA file ( https://www.worldweatheronline.com/hwd/mca.aspx ) to DynamoDb table.
Locations are mapped to regions by csv file locations.csv which looks like
id,region
1,ESMJ
2,ESMN
...
where id is loc_id from MCA file and region is easyJet region code.
# FPSSync Lambda

The function listens for the flight price updates and load it from the Flight Price Store data to DynamoDB for further export.
Design: https://easyjet.atlassian.net/wiki/spaces/FPS/pages/345216300/easyJet+Holidays+Integration+Design+V2

## Data flow is following: 
1) The lambda starts by cron (every 1 min) and connects to the FPS queue
2) If there are any messages reads them and stores in DynamoDB (overriding existing) for persistance storage and in SQS for delta update reports

All prices in all currencies go to DynamoDB but only currencies we support are pushed to the SQS

## Manual testing
Execute the lambda using the following event example:

``` xml
{
  "id": "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": "1970-01-01T00:00:00Z",
  "region": "{region}",
  "resources": [
    "arn:{partition}:events:{region}:123456789012:rule/my-schedule"
  ],
  "detail": [{
   "header":{
      "messageName":"FlightFareChanged",
      "messageVersion":"1.0",
      "messageGenerationTimestamp":"2022-03-14T15:59:39.050Z",
      "messageProducerName":"FPS-Invalidation",
      "operationType":"UPDATE"
   },
   "body":{
      "flightKey":"20220613VLCBER4518",
      "carrierCode":"EJU",
      "flightNumber":"4518",
      "available":true,
      "departure":{
         "airportCode":"VLC",
         "time":"2022-06-13T19:00"
      },
      "arrival":{
         "airportCode":"BER",
         "time":"2022-06-13T22:00"
      },
      "availableSeats":117,
      "fares":[
         {
            "channel":"DigitalWeb",
            "adults":2,
            "children":0,
            "infants":0,
            "fareTypes":[
               {
                  "fareType":"STANDARD",
                  "fareClass":"B",
                  "availableSeats":2,
                  "prices":[
                     {
                        "currency":"EUR",
                        "outboundPrice":60.99,
                        "returnPrice":60.99,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"CHF",
                        "outboundPrice":65.28,
                        "returnPrice":65.28,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"GBP",
                        "outboundPrice":53.59,
                        "returnPrice":53.59,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"CZK",
                        "outboundPrice":1609.03,
                        "returnPrice":1609.03,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"DKK",
                        "outboundPrice":476.49,
                        "returnPrice":476.49,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"HUF",
                        "outboundPrice":24481.0,
                        "returnPrice":24481.0,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"PLN",
                        "outboundPrice":306.0,
                        "returnPrice":306.0,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"SEK",
                        "outboundPrice":680.0,
                        "returnPrice":680.0,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"USD",
                        "outboundPrice":69.9,
                        "returnPrice":69.9,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"MAD",
                        "outboundPrice":681.0,
                        "returnPrice":681.0,
                        "bookingFee":0.0
                     }
                  ]
               }
            ]
         },
         {
            "channel":"DigitalWeb",
            "adults":0,
            "children":2,
            "infants":0,
            "fareTypes":[
               {
                  "fareType":"STANDARD",
                  "fareClass":"B",
                  "availableSeats":2,
                  "prices":[
                     {
                        "currency":"EUR",
                        "outboundPrice":60.99,
                        "returnPrice":60.99,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"CHF",
                        "outboundPrice":65.28,
                        "returnPrice":65.28,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"GBP",
                        "outboundPrice":53.59,
                        "returnPrice":53.59,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"CZK",
                        "outboundPrice":1609.03,
                        "returnPrice":1609.03,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"DKK",
                        "outboundPrice":476.49,
                        "returnPrice":476.49,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"HUF",
                        "outboundPrice":24481.0,
                        "returnPrice":24481.0,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"PLN",
                        "outboundPrice":306.0,
                        "returnPrice":306.0,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"SEK",
                        "outboundPrice":680.0,
                        "returnPrice":680.0,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"USD",
                        "outboundPrice":69.9,
                        "returnPrice":69.9,
                        "bookingFee":0.0
                     },
                     {
                        "currency":"MAD",
                        "outboundPrice":681.0,
                        "returnPrice":681.0,
                        "bookingFee":0.0
                     }
                  ]
               }
            ]
         }
      ]
   }
}]
}
```

Where `details` contains one or multiple messages with price updates
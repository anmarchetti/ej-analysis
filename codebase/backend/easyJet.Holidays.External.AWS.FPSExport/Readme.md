
# FPSExport Lambda

The function exports synced Flight Price Store data to Atcom FTP (or S3 for testing purposes or etc)
Design: https://conf.build.easyjet.com/display/FPS/easyJet+Holidays+Integration+Design+V2

## Run types 
The lambda starts by scheduled events in two run types:
1) Daily - every day at 00:00
2) Lambda - every 5 minutes

- Daily run
The lambda function reads DynamoDB for all records that were updated last day

- Delta run
The lambda reads all messages that were pushed to the SQS for the last 5 minutes. And clears the messages queue after read

Then generates reports for records with currencies we support in CSV format and store in FTP (or S3, toggle in the settings)


## OLZ
### Manual testing
To trigger Daily run, execute the following event

``` xml
{
  "id": "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": 2023-01-13T00:00:00Z",
  "region": "eu-west-1",
  "resources": [
    "arn:{partition}:events:{region}:123456789012:rule/HolidaysNonprodFPSExportDailyTrigger"
  ],
  "detail": {}
}
```

Make sure the `resources` trigger name is `HolidaysNonprodFPSExportDailyTrigger`
And `time` is a date + 1 for what you want to build a daily report. E.g. `"time": 2023-01-13T00:00:00Z"` mean all changes from 2023-01-12 will be included.

To trigger Delta run, execute the following event

``` xml
{
  "id": "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": 2023-01-12T00:05:00Z",
  "region": "eu-west-1",
  "resources": [
    "arn:{partition}:events:{region}:123456789012:rule/HolidaysNonprodFPSExportDeltaTrigger"
  ],
  "detail": {}
}
```

Make sure the `resources` trigger name is `HolidaysNonprodFPSExportDeltaTrigger`

## NLZ
### Manual testing
To trigger Daily run, execute the following event

``` xml
{
  "id": "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": 2023-01-13T00:00:00Z",
  "region": "eu-west-1",
  "resources": [
    "arn:{partition}:events:{region}:123456789012:rule/HolidaysDevFPSExportDailyTrigger"
  ],
  "detail": {}
}
```

Make sure the `resources` trigger name is `HolidaysDevFPSExportDailyTrigger`
And `time` is a date + 1 for what you want to build a daily report. E.g. `"time": 2023-01-13T00:00:00Z"` mean all changes from 2023-01-12 will be included.

To trigger Delta run, execute the following event

``` xml
{
  "id": "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
  "detail-type": "Scheduled Event",
  "source": "aws.events",
  "account": "123456789012",
  "time": 2023-01-12T00:05:00Z",
  "region": "eu-west-1",
  "resources": [
    "arn:{partition}:events:{region}:123456789012:rule/HolidaysDevFPSExportDeltaTrigger"
  ],
  "detail": {}
}
```

Make sure the `resources` trigger name is `HolidaysDevFPSExportDeltaTrigger`
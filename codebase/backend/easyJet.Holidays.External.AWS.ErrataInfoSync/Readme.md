  # AWS Lambda Errata Info

## Build function archive
Windows PowerShell:
```
    dotnet publish -c Release
    Compress-Archive -Path .\bin\Release\netcoreapp2.1\publish\* -DestinationPath .\Provision\v1.0.zip -Force
```

## Update function code
```
    aws lambda update-function-code  --function-name HolidaysCIErrataInfoSync  --zip-file fileb://Provision/v1.0.zip  --profile nonprod
```

## Invoke function
```
    aws lambda invoke --function-name HolidaysCIErrataInfoSync --invocation-type Event --payload '{}' response.json --profile nonprod
```

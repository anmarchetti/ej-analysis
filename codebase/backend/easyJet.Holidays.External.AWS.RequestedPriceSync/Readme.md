# Web - RequestedPriceSync lambda

## Functionality
Requested price lambda performs atcom cache searches for promo pages, finds cheapest offer for each country/region/resort
code and stores them in DynamoDb. This allows to immediately show cheapest offer price for specific promo by location
without needing to search atcom cache every time.
You can see requested price:
1. On all deals page:
   https://www.easyjet.com/en/holidays/deals
2. On promo pages for specific holiday type (listed at https://www.easyjet.com/en/holidays/Holiday-Types ):
   https://www.easyjet.com/en/holidays/all-inclusive-holidays
   https://www.easyjet.com/en/holidays/beach-holidays
   Requested price lambda runs once a day so it's possible that price displayed on promo page is outdated if cheapest
   offer is no longer available.

## Configuration
Searches to perform are configured in sitecore at "/sitecore/content/EasyJet/Holidays/Data/Requested Searches" and
retrieved from sitecore's api/RequestedSearches/Get endpoint
( https://cd.ci.holidays.easyjet.com/api/RequestedSearches/Get?marketCode=CH&sc_lang=fr-CH for CI evironment and CH market).
Other configuration data is passed to lambda as environment variables or retrieved from other sitecore endpoints.
Environment variables are configured in:
1. AWS console - find lambda instance for specific environment (for example HolidaysCIRequestedPriceSync) and go to
   Configuration -> Environment variables
2. In Octopus of RequestedPriceSync project - http://octopus.europe.easyjet.local/app#/Spaces-1/projects/requestedpricesync/variables
3. Terraform config (orchestrator\easyJet.Holidays.External.AWS.RequestedPriceSync\Infrastructure\lambda.tf)
   Variables setup in aws console are applied instantly and will override variables from octopus or terraform config.
   Variables setup in octopus are applied on next lambda redeploy and will override variables from terraform config.

## Requested searches
Pages at "/sitecore/content/EasyJet/Holidays/Data/Requested Searches" only control if specific requested search is
enabled, however actual search data comes from a page that's selected in "Promo Page - Inherited Promo Page" property.
Promo pages are configured in "/sitecore/content/EasyJet/Holidays/Home/Root" directory. It can be pretty hard to find
it by name, the easiet way to find promo page for requested search is to show raw values (View -> Raw values in sitecore
toolbar), copy guid from "Promo Page - Inherited Promo Page" property, select "/sitecore/content/EasyJet/Holidays" in
content tree and enter guid in search bar. Pay attention to sitecore item's language. For
https://cd.ci.holidays.easyjet.com/api/RequestedSearches/Get?marketCode=CH&sc_lang=fr-CH open promo page under
"/sitecore/content/EasyJet/Holidays/Data/Requested Searches/Requested Searches Swiss", change the language to
"French (Switzerland)", find the page from "Promo Page - Inherited Promo Page" property that's located under
"/sitecore/content/EasyJet/Holidays/Home/Root" and change the language to "French (Switzerland)" to see or modify
properties for the search.

## Running
It's necessary to pass SNS event as input for running requested price lambda.
If running from aws console or locally with the Mock test tool pass json with 

{
  "Records": [
    {
      "messageId": "11111111-1111-1111-1111-111111111111",
      "receiptHandle": "AQEBexampleReceiptHandle",
      "body": "{\"timestamp\":1735689600,\"market\":\"UK\",\"language\":\"en\",\"skip\":0,\"take\":100,\"isLast\":true}",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1735689600000",
        "SenderId": "local",
        "ApproximateFirstReceiveTimestamp": "1735689600000"
      },
      "messageAttributes": {},
      "md5OfBody": "9bb58f26192e4ba00f01e2e7b136bbd8",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:eu-west-1:123456789012:requested-price-sync",
      "awsRegion": "eu-west-1"
    }
  ]
}

## Deployment
Lambdas are **not** deployed automatically when there are changes to specific branch, instead you need to deploy them
manually. Go to RequestedPriceSync in TeamCity:
https://teamcity.build.easyjet.com/buildConfiguration/EasyJetHolidays_BuildLambda_BuildLambdaHolidaysWebsite_RequestedPriceSync
select appropriate branch to deploy and click "Run".
If you make changes to lambda in order for it to be deployed to production during release it needs to be added to your
team's deployment task ( example https://jira.build.easyjet.com/browse/EJH-16741 )

## Troubleshooting
Check logs in AWS console (Monitor -> Logs), run lambda locally (variables from Program.cs are used when running locally).
If there are data inconsistencies between results of lambda and website check that both lambda and website are using
the same atcom environment. Since they are setup in different places it's possible to change atcom env for holidays
website without changing it for lambdas.

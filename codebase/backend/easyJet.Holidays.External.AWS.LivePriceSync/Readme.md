# Functionality
Live price lambda performs atcom cache searches based on defined configuration, finds cheapest offer for each 
country/region/resort/giata code and stores them in DynamoDb. This allows to immediately show cheapest offer price for 
specific location without needing to search atcom cache every time.
You can see live price:
1. On destination pages for countries/regions/resorts: 
https://www.easyjet.com/en/holidays/spain 
https://www.easyjet.com/en/holidays/spain/andalucia 
https://www.easyjet.com/en/holidays/spain/seville/seville-city
2. On hotel details page when dates are not selected: 
https://www.easyjet.com/en/holidays/spain/seville/seville-city/monte-triana
Live price lambda runs once a day so it's possible that price displayed on destination page is outdated if cheapest 
offer is no longer available.

# Configuration
Searches to perform are configured in sitecore at "/sitecore/content/EasyJet/Holidays/Data/Live Price" and retrieved 
from sitecore's api/LivePrice/Get endpoint 
( https://cd.ci.holidays.easyjet.com/api/LivePrice/Get?marketCode=UK for CI evironment and UK market). 
Other configuration data is passed to lambda as environment variables or retrieved from other sitecore endpoints.
Environment variables are configured in:
1. AWS console - find lambda instance for specific environment (for example HolidaysCILivePriceSync) and go to 
Configuration -> Environment variables
2. In Octopus of LivePriceSync project - http://octopus.europe.easyjet.local/app#/Spaces-1/projects/livepricesync/variables 
3. Terraform config (orchestrator\easyJet.Holidays.External.AWS.LivePriceSync\Infrastructure\lambda.tf)
Variables setup in aws console are applied instantly and will override variables from octopus or terraform config.
Variables setup in octopus are applied on next lambda redeploy and will override variables from terraform config.

# Running
It's necessary to pass market as input for running live price lambda.
If running from aws console pass json with { "Market": "UK" }
If running locally it's setup in function.cs
Supported values are "UK", "CH", "DE" and "FR", although on most test environments only "UK" and "CH" searches for live
price are configured in sitecore.

# Deployment
Lambdas are not deployed automatically when there are changes to specific branch, instead you need to deploy them 
manually. Go to LivePriceSync in TeamCity:
https://teamcity.build.easyjet.com/buildConfiguration/EasyJetHolidays_BuildLambda_BuildLambdaHolidaysWebsite_LivePriceSync
select appropriate branch to deploy and click "Run".
If you make changes to lambda in order for it to be deployed to production during release it needs to be added to your
team's deployment task ( example https://jira.build.easyjet.com/browse/EJH-16741 )

# Troubleshooting
Check logs in AWS console (Monitor -> Logs), run lambda locally (variables from Program.cs are used when running locally).
If there are data inconsistencies between results of lambda and website check that both lambda and website are using 
the same atcom environment. Since they are setup in different places it's possible to change atcom env for holidays 
website without changing it for lambdas.
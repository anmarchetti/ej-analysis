resource "aws_dynamodb_table_item" "requested_price_ESMJ_last_minute_uk_en" {
  table_name = aws_dynamodb_table.requested_price.name
  hash_key   = aws_dynamodb_table.requested_price.hash_key
  range_key  = aws_dynamodb_table.requested_price.range_key

  depends_on = [
    aws_dynamodb_table.requested_price
  ]

  item = <<ITEM
{
  "Code": {
    "S": "ESMJ"
  },
  "SearchType": {
    "S": "All inclusive last minute|UK|en"
  },
  "Currency": {
    "S": "GBP"
  },
  "Expires": {
    "N": "1773062446"
  },
  "MarketCodeAndLanguage": {
    "S": "UK|en"
  },
  "PriceByMathFunctions": {
    "S": "{\"cheapest\":{\"Price\":956.18,\"PricePP\":478.09,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"average\":{\"Price\":1678.43,\"PricePP\":839.21,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"averageinlowerquartile\":{\"Price\":1148.53,\"PricePP\":574.26,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"highestinlowerquartile\":{\"Price\":1244.32,\"PricePP\":622.16,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"medium\":{\"Price\":1567.40,\"PricePP\":783.70,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"mostexpensive\":{\"Price\":3470.91,\"PricePP\":1735.4449271871426830188460221,\"TouristTax\":0.0,\"TouristTaxPP\":0.0}}"
  },
  "SearchCriteria": {
    "S": "{\"Range\":{\"Start\":\"2026-02-27T00:00:00+00:00\",\"End\":\"2026-05-31T00:00:00\"},\"Date\":\"2026-05-17T00:00:00+00:00\",\"DepPt\":\"SEN\",\"Id\":\"All inclusive last minute|UK|en\",\"Adults\":2,\"Children\":0,\"Infants\":0,\"Duration\":7,\"ChildAges\":[],\"ThemeTypesCodes\":[],\"Origin\":[\"LGW\",\"LTN\",\"SEN\",\"BHD\",\"BFS\",\"BHX\",\"BRS\",\"LPL\",\"MAN\",\"NCL\",\"EDI\",\"GLA\",\"SOU\",\"LBA\"],\"Destinations\":[\"HRIR\",\"HRSP\",\"CY\",\"EGHR\",\"EGSS\",\"GRCF\",\"GRCR\",\"GRHA\",\"GRKF\",\"GRKG\",\"GRRH\",\"GRSK\",\"GRZA\",\"ITSA\",\"ITSI\",\"MT\",\"ME\",\"MAAG\",\"MAMA\",\"PTAL\",\"PTMD\",\"CIV\",\"ESCD\",\"ESDO\",\"ESBV\",\"ESFU\",\"ESGC\",\"ESLZ\",\"ESIB\",\"ESMJ\",\"ESMN\",\"ESTF\",\"TN\",\"TRAN\",\"TRBD\",\"TRDL\",\"TRIZ\",\"CV\"],\"AccomCodes\":null,\"Url\":\"https://www.easyjet.com/en/holidays/deals/all-inclusive-last-minute-deals\",\"StartDate\":\"2026-02-27T00:00:00+00:00\",\"EndDate\":\"2026-05-31T00:00:00\",\"InitialSearchDays\":0,\"BoardTypes\":[\"AI\",\"AI+\",\"AS\"],\"FacilityTypes\":[],\"StarRating\":[\"\"],\"TripAdvisorRating\":0.0,\"Currency\":null,\"MarketCode\":null,\"MarketLanguage\":null,\"MinPPPrice\":0.0,\"MaxPPPrice\":0.0,\"MinTotalPrice\":0.0,\"MaxTotalPrice\":0.0,\"DiscountPercentsMin\":0.0,\"DiscountPercentsMax\":0.0,\"DiscountAmountMin\":0.0,\"DiscountAmountMax\":0.0,\"DiscountOnly\":false,\"IsFlexibleDatesRange\":true,\"FreeForKidsOnly\":false,\"MarketCodeAndLanguage\":\"|\",\"PromoCollections\":[]}"
  },
  "SearchDate": {
    "N": "1772198446"
  },
  "Transfers": {
    "S": "[{\"Type\":2,\"IconUrl\":null,\"Content\":null,\"TransferInfo\":null,\"Id\":null,\"Code\":\"JUMB55321KSS\",\"Name\":\"Shared Transfer\",\"AutoInclude\":false,\"StartDate\":null,\"SetType\":null,\"TypeCode\":null,\"Prom\":null,\"Quantity\":2,\"ServiceStates\":null,\"Paxs\":null,\"RateRule\":null,\"Method\":1,\"MCMethod\":0,\"Price\":57.66,\"Currency\":null,\"MinPax\":0,\"MaxPax\":0,\"IsHidden\":false,\"SmallSeSurcharge\":null,\"LargeSeSurcharge\":null}]"
  }
}
ITEM
}

resource "aws_dynamodb_table_item" "requested_price_ESMJ_summer_deals_uk_en" {
  table_name = aws_dynamodb_table.requested_price.name
  hash_key   = aws_dynamodb_table.requested_price.hash_key
  range_key  = aws_dynamodb_table.requested_price.range_key

  depends_on = [
    aws_dynamodb_table.requested_price
  ]

  item = <<ITEM
{
  "Code": {
    "S": "ESMJ"
  },
  "SearchType": {
    "S": "All inclusive summer deals|UK|en"
  },
  "Currency": {
    "S": "GBP"
  },
  "Expires": {
    "N": "1772961353"
  },
  "MarketCodeAndLanguage": {
    "S": "UK|en"
  },
  "PriceByMathFunctions": {
    "S": "{\"cheapest\":{\"Price\":806.95,\"PricePP\":403.48,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"average\":{\"Price\":1721.51,\"PricePP\":860.76,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"averageinlowerquartile\":{\"Price\":1155.28,\"PricePP\":577.64,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"highestinlowerquartile\":{\"Price\":1342.92,\"PricePP\":671.46,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"medium\":{\"Price\":1614.98,\"PricePP\":807.49,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"mostexpensive\":{\"Price\":4839.01,\"PricePP\":2419.4942179402052575523281982,\"TouristTax\":0.0,\"TouristTaxPP\":0.0}}"
  },
  "SearchCriteria": {
    "S": "{\"Range\":{\"Start\":\"2026-05-01T00:00:00\",\"End\":\"2026-09-30T00:00:00\"},\"Date\":\"2026-04-28T00:00:00+00:00\",\"DepPt\":\"SEN\",\"Id\":\"All inclusive summer deals|UK|en\",\"Adults\":2,\"Children\":0,\"Infants\":0,\"Duration\":7,\"ChildAges\":[],\"ThemeTypesCodes\":[],\"Origin\":[\"LGW\",\"LTN\",\"SEN\",\"STN\",\"BRS\",\"BHX\",\"BOH\",\"JER\",\"LBA\",\"LPL\",\"MAN\",\"NCL\",\"NQY\",\"SOU\",\"BHD\",\"BFS\",\"ABZ\",\"EDI\",\"GLA\",\"INV\",\"IOM\",\"LDY\"],\"Destinations\":[\"CY\",\"EG\",\"GRCF\",\"GRCR\",\"GRKG\",\"GRRH\",\"GRZA\",\"GRHA\",\"HRIR\",\"ITSI\",\"MT\",\"ME\",\"MA\",\"PTAL\",\"PTMD\",\"BIV\",\"CIV\",\"ESCB\",\"ESCD\",\"ESDO\",\"ESFU\",\"ESGC\",\"ESIB\",\"ESLZ\",\"ESMJ\",\"ESMN\",\"ESTF\",\"TN\",\"TR\",\"GRKF\",\"HR\",\"CV\",\"ITSA\",\"ITPU\"],\"AccomCodes\":null,\"Url\":\"https://www.easyjet.com/en/holidays/deals/all-inclusive-summer-deals\",\"StartDate\":\"2026-05-01T00:00:00Z\",\"EndDate\":\"2026-07-30T00:00:00Z\",\"InitialSearchDays\":0,\"BoardTypes\":[\"AI\",\"AS\",\"AI+\"],\"FacilityTypes\":[],\"StarRating\":[\"\"],\"TripAdvisorRating\":0.0,\"Currency\":null,\"MarketCode\":null,\"MarketLanguage\":null,\"MinPPPrice\":0.0,\"MaxPPPrice\":0.0,\"MinTotalPrice\":0.0,\"MaxTotalPrice\":0.0,\"DiscountPercentsMin\":0.0,\"DiscountPercentsMax\":0.0,\"DiscountAmountMin\":0.0,\"DiscountAmountMax\":0.0,\"DiscountOnly\":false,\"IsFlexibleDatesRange\":true,\"FreeForKidsOnly\":false,\"MarketCodeAndLanguage\":\"|\",\"PromoCollections\":[]}"
  },
  "SearchDate": {
    "N": "1772097353"
  },
  "Transfers": {
    "S": "[{\"Type\":2,\"IconUrl\":null,\"Content\":null,\"TransferInfo\":null,\"Id\":null,\"Code\":\"JUMB55308KSS\",\"Name\":\"Shared Transfer\",\"AutoInclude\":false,\"StartDate\":null,\"SetType\":null,\"TypeCode\":null,\"Prom\":null,\"Quantity\":2,\"ServiceStates\":null,\"Paxs\":null,\"RateRule\":null,\"Method\":1,\"MCMethod\":0,\"Price\":55.70,\"Currency\":null,\"MinPax\":0,\"MaxPax\":0,\"IsHidden\":false,\"SmallSeSurcharge\":null,\"LargeSeSurcharge\":null}]"
  }
}
ITEM
}

resource "aws_dynamodb_table_item" "requested_price_ESMJ_last_minute_ch_de" {
  table_name = aws_dynamodb_table.requested_price.name
  hash_key   = aws_dynamodb_table.requested_price.hash_key
  range_key  = aws_dynamodb_table.requested_price.range_key

  depends_on = [
    aws_dynamodb_table.requested_price
  ]

  item = <<ITEM
{
  "Code": {
    "S": "ESMJ"
  },
  "SearchType": {
    "S": "All inclusive last minute|CH|de-CH"
  },
  "Currency": {
    "S": "CHF"
  },
  "Expires": {
    "N": "1773300764"
  },
  "MarketCodeAndLanguage": {
    "S": "CH|de-CH"
  },
  "PriceByMathFunctions": {
    "S": "{\"cheapest\":{\"Price\":715.74,\"PricePP\":357.87,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"average\":{\"Price\":1856.76,\"PricePP\":928.38,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"averageinlowerquartile\":{\"Price\":1204.19,\"PricePP\":602.09,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"highestinlowerquartile\":{\"Price\":1411.70,\"PricePP\":705.85,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"medium\":{\"Price\":1606.08,\"PricePP\":803.04,\"TouristTax\":0.0,\"TouristTaxPP\":0.0},\"mostexpensive\":{\"Price\":4703.10,\"PricePP\":2351.55,\"TouristTax\":0.0,\"TouristTaxPP\":0.0}}"
  },
  "SearchCriteria": {
    "S": "{\"Range\":{\"Start\":\"2026-03-02T00:00:00+00:00\",\"End\":\"2026-05-31T00:00:00\"},\"Date\":\"2026-03-29T00:00:00+00:00\",\"DepPt\":\"GVA\",\"Id\":\"All inclusive last minute|CH|de-CH\",\"Adults\":2,\"Children\":0,\"Infants\":0,\"Duration\":7,\"ChildAges\":[],\"ThemeTypesCodes\":[],\"Origin\":[\"BSL\",\"GVA\",\"ZRH\",\"LYS\"],\"Destinations\":[\"FRBO\",\"FRFR\",\"FRCO\",\"FRMO\",\"FRNA\",\"FRPA\",\"VSOF\",\"GRHA\",\"GRCF\",\"GRCR\",\"GRRH\",\"ITSA\",\"ITSI\",\"HRDB\",\"HRSP\",\"MT\",\"MAAG\",\"MAMA\",\"METI\",\"PTAL\",\"PTMD\",\"ESCB\",\"ESDO\",\"ESCD\",\"ESFU\",\"ESGC\",\"ESIB\",\"ESLZ\",\"ESMJ\",\"ESMN\",\"ESTF\",\"TNDJ\",\"TNNB\",\"TRAN\",\"CYLN\",\"EGHR\",\"EGMA\",\"EGSS\"],\"AccomCodes\":null,\"Url\":\"https://www.easyjet.com/ch-de/ferien/all-inclusive-last-minute-angebote\",\"StartDate\":\"2026-03-02T00:00:00+00:00\",\"EndDate\":\"2026-05-31T00:00:00\",\"InitialSearchDays\":0,\"BoardTypes\":[\"AI\",\"AI+\",\"AS\"],\"FacilityTypes\":[],\"StarRating\":[\"\"],\"TripAdvisorRating\":0.0,\"Currency\":null,\"MarketCode\":null,\"MarketLanguage\":null,\"MinPPPrice\":0.0,\"MaxPPPrice\":0.0,\"MinTotalPrice\":0.0,\"MaxTotalPrice\":0.0,\"DiscountPercentsMin\":0.0,\"DiscountPercentsMax\":0.0,\"DiscountAmountMin\":0.0,\"DiscountAmountMax\":0.0,\"DiscountOnly\":false,\"IsFlexibleDatesRange\":false,\"FreeForKidsOnly\":false,\"MarketCodeAndLanguage\":\"|\",\"PromoCollections\":[]}"
  },
  "SearchDate": {
    "N": "1772436764"
  },
  "Transfers": {
    "S": "[{\"Type\":1,\"IconUrl\":null,\"Content\":null,\"TransferInfo\":null,\"Id\":null,\"Code\":\"JUMB58782KPP\",\"Name\":\"Private Transfer\",\"AutoInclude\":false,\"StartDate\":null,\"SetType\":null,\"TypeCode\":null,\"Prom\":null,\"Quantity\":1,\"ServiceStates\":null,\"Paxs\":null,\"RateRule\":null,\"Method\":0,\"MCMethod\":0,\"Price\":190.22,\"Currency\":null,\"MinPax\":0,\"MaxPax\":0,\"IsHidden\":false,\"SmallSeSurcharge\":null,\"LargeSeSurcharge\":null}]"
  }
}
ITEM
}
### Imports

The code imports various utilities, interfaces, and types from different modules:

- **Utilities**:
  - `buildLivePriceCode` and `getRequestedPriceAmountText` are imported from the `frontend/utils/livePrice.utils`. These functions are likely used to generate price-related codes and format or retrieve price text for display.
  
- **Interfaces and Types**:
  - `IRequestedPrice` is imported from `models/data/IRequestedPrice`, representing the structure of a requested price.
  - `IHolidayTypesHubEventParams` is imported from `models/data/tracking/IEventWithParams`, detailing the event parameters for holiday types.
  - `IDealsDestinationsCard` and `IDealsDestinationTileFields` are imported from the local file's `interfaces`, defining the structure for deals, destinations cards, and their tiles.

### Structure

The code defines three main functions:

1. **`getDestTileRequestedPriceText`**:
   - Parameters: `fields` (IDealsDestinationTileFields), `pricesByDestCodes` (Map), `formatMoney` (function).
   - Returns: A string that either contains the formatted requested price or an empty string if conditions are not met.

2. **`getCardsRequestedPriceCodes`**:
   - Parameters: `cards` (array of IDealsDestinationsCard), `searchName` (optional string).
   - Returns: An array of strings, each representing a price code derived from the destination codes within the cards.

3. **`collectCardsTrackingInfo`**:
   - Parameters: `cards` (array of IDealsDestinationsCard), `pricesByDestCodes` (Map), `formatMoney` (function).
   - Returns: An array of `IHolidayTypesHubEventParams`, containing tracking information aggregated from the cards.

### Logic

1. **`getDestTileRequestedPriceText`**:
   - Extracts the destination code and checks if the price feature is enabled for the tile.
   - Retrieves the requested price object from a map using the destination code.
   - If a price is available and conditions are met, it formats and returns the price using `getRequestedPriceAmountText`. If not, it returns an empty string.

2. **`getCardsRequestedPriceCodes`**:
   - Iterates over each card and its tiles to check if the price feature is enabled.
   - For each enabled price, it constructs a live price code using the destination code and an optional search name, then adds it to an array of codes.

3. **`collectCardsTrackingInfo`**:
   - Iterates over each card, extracting the country, title, and tiles.
   - For each tile, it retrieves or formats the destination price text.
   - Aggregates destination names and prices into a tracking event object, appending it to an array of such events.

Each function handles specific aspects of dealing with destination tiles, cards, and tracking information, focusing on conditions around pricing and enabled features. The utility functions support the formatting and generation of price-related data, ensuring consistency and reusability across the codebase.
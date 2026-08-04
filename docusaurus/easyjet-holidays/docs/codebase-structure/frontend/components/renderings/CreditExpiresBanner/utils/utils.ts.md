## Imports

The script imports several modules and types from different locations within the project:

- `CurrencyCode` from `'code/currency'`: Represents currency codes.
- `Tokens` from `'code/tokens'`: Represents various tokens used within the system.
- `MarketStore` from `'frontend/store/base'`: Represents the base store for market-related data.
- `Tokenizer` from `'frontend/utils/tokenizer'`: Utility for replacing tokens in strings.
- `IBalanceHistory` and `IBalanceHistoryItem` from `'models/data/IBalanceHistory'`: Interfaces representing the structure of balance history data.
- `TSitecoreMultiList` from `'models/sitecore/generic/ISitecoreField'`: Type representing a multi-list field in Sitecore.
- Several components and utilities from `'frontend/components/renderings/CreditExpiresBanner/interfaces'` and `'frontend/components/renderings/HolidayCredit/utils'` related to credit expiration logic.

## Structure

The code defines three main functions:

1. **getExpiringCreditsTotalAmount**:
   - **Parameters**: An array of `IBalanceHistoryItem` and a number `settingExpiresWithinXDays`.
   - **Returns**: An array of numbers representing the total amount of soon-to-expire credits.
   - **Logic**: Iterates through each balance history item, checking if the credit is used or expired, and if it expires soon.

2. **isThereAnyExpiringCreditForOtherMarkets**:
   - **Parameters**: A balance history object `IBalanceHistory`, a `CurrencyCode` for the current currency, and a number `settingExpiresWithinXDays`.
   - **Returns**: A boolean indicating if there is any expiring credit in markets other than the current one.
   - **Logic**: Checks across different currencies in the balance history to see if any credit meets the criteria for expiring soon and is not used or expired.

3. **getSitecoreContent**:
   - **Parameters**: A `TSitecoreMultiList` of `ICreditExpiresContentFields`, a `IBalanceHistory`, a `CurrencyCode` for the current currency, a number `settingExpiresWithinXDays`, and a `formatMoney` function from `MarketStore`.
   - **Returns**: An object of type `ICreditExpiresContentFields` or `undefined`.
   - **Logic**: Determines the type of content to display based on whether credits are expiring in the current market, other markets, or both. It formats the title of the content using the total expiring credits.

## Logic

The core functionality revolves around managing and displaying information about expiring credits across different markets:

- **Credit Expiry Detection**: The functions check whether credits are expiring soon based on a configurable number of days (`settingExpiresWithinXDays`). This helps in notifying users about their credits that need attention.
  
- **Market Differentiation**: The logic differentiates between the current market and other markets, allowing for targeted notifications depending on where the expiring credits are located.
  
- **Content Customization**: Based on the detected conditions (credits expiring in the current market, other markets, or both), the content type is determined, and relevant information is displayed. The content is further customized by injecting dynamic data (like the total amount of expiring credits) using a tokenizer utility.

This combination of features ensures that users are well-informed about their credits' status across different markets, enhancing user experience and financial management on the platform.
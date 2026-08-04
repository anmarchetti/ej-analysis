## Imports

The code snippet imports several modules which are crucial for its functionality:

- `getLuggageTypes` and `ILuggageAmount` from `'frontend/utils/luggage.utils'`: These are likely utility functions and interfaces related to handling luggage data.
- `IExtraLuggageInfo` from `'models/data/IFlightExtras'`: This interface is probably used to type-check the data structure containing additional luggage information specific to flights.
- `SitecoreDictionary` from `'models/enum/SitecoreDictionary'`: This import suggests the use of an enumeration for consistent labeling or messaging within the application, which is managed by Sitecore CMS.

## Structure

The code defines an interface and a function:

### Interface: `ILuggageMetaData`
This interface outlines the structure for the luggage metadata objects. It includes:
- `luggage`: An object of type `ILuggageAmount`, which likely describes the amount and possibly other attributes of the luggage.
- `name`: A `SitecoreDictionary` type, used for storing the name or label of the luggage, which can change based on the context (singular or plural).
- `weightLabel`: Another `SitecoreDictionary` type, used to store the label related to the weight of the luggage.

### Function: `getLuggageMetaData`
This is an exported function that takes an argument `luggageInfo` of type `IExtraLuggageInfo`. It returns an array of `ILuggageMetaData` objects. The function uses the utility `getLuggageTypes` to process `luggageInfo` into an array of luggage types, and then maps over these types to create a metadata object for each type.

## Logic

The function `getLuggageMetaData` performs the following operations:

1. **Retrieve Luggage Types**: Calls `getLuggageTypes(luggageInfo)` to get an array of luggage types from the provided `luggageInfo`. Each type includes details such as the amount and type of luggage.

2. **Mapping to Metadata**: Maps over the array of luggage types to transform them into an array of `ILuggageMetaData`. For each `luggage` item in the array:
   - Determines the `name` field based on the `amount` of luggage:
     - If `amount` is greater than 1, it uses the plural form `LuggageLabelsHoldBagsPlural` from `SitecoreDictionary`.
     - Otherwise, it uses the singular form `LuggageLabelsHoldBagSingular`.
   - Fetches the `weightLabel` using a dynamic key that combines the string 'LuggageLabels' with the `type` of the luggage, accessing the corresponding value from `SitecoreDictionary`.

3. **Return Metadata Array**: The function finally returns the array of `ILuggageMetaData` objects, each enriched with appropriate labels and type details based on the input `luggageInfo`.

This function essentially formats raw luggage data into a more structured and user-friendly format, leveraging enums from Sitecore for consistent naming conventions across the application.
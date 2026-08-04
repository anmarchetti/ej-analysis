## Imports

The code imports two TypeScript interfaces, `IExtraLuggageContent` and `ILuggageInfoItem`, from a module located at `'models/data/IFlightExtras'`. These interfaces are used to define the shape of the data related to flight extras, particularly focusing on luggage information.

```javascript
import { IExtraLuggageContent, ILuggageInfoItem } from 'models/data/IFlightExtras';
```

## Structure

### Interfaces

- **`IGetLuggageInfoItemsProps`**: Defines the properties expected by the `getLuggageInfoItems` function. These include arrays and records for luggage information, labels for various items, and a count of infants.

- **`ILuggageLine`**: Represents a single line of luggage information, containing a `dataTid` identifier and a `text` description.

### Functions

- **`getHoldLuggageTid(text: string | undefined): string`**: A helper function that generates a data tracking identifier (`dataTid`) for hold luggage items based on the weight (extracted from the text).

- **`getLuggageInfoItems(props: IGetLuggageInfoItemsProps): ILuggageLine[]`**: The main function that constructs an array of `ILuggageLine` items based on the provided luggage information and labels.

## Logic

### Helper Function: `getHoldLuggageTid`

This function takes an optional string `text` and attempts to extract a numerical value (assumed to be the weight in kilograms). It constructs a `dataTid` string by appending this number to `'hold-luggage-'`. If no number is found, it returns `'hold-luggage'`.

### Main Function: `getLuggageInfoItems`

1. **Initialization**: Extracts all properties from the input argument. Initializes an empty array `luggageItems` to store the results.

2. **Infant Prams**: If there are infants (indicated by `infantsNumber`), adds an entry for the prams, using the provided `pramLabel`.

3. **Luxury Internal Flight Bags**: If a `luxuryInternalFlightBagsLabel` is provided, adds this label with a specific `dataTid` and returns immediately, ignoring other potential luggage items.

4. **Default Bags**: If there are any `defaultBagsOneDirection`, adds the first bag's name multiplied by the number of such bags.

5. **Extra Luggage**: Iterates over `extraLuggageFullInfo` (expected to be an array with luggage items as the first element) and adds each item with a quantity and name, constructing the `dataTid` using `getHoldLuggageTid`.

6. **Sport Equipment**: If there are sport equipment items, calculates the total number and constructs a descriptive string that includes all items and their quantities. Adds this information with a `dataTid` of `'sport-equipment'`.

The function finally returns the `luggageItems` array, which now contains all the formatted luggage information lines.
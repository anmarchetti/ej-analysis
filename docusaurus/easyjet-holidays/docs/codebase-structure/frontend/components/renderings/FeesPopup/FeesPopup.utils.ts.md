## Imports

The script imports several utility functions and a TypeScript interface from various modules:

1. **Utility Functions**:
   - `getIsTouristTaxDisplayed`: Determines if the tourist tax should be displayed based on certain conditions.
   - `getTouristTaxFieldsFromOffer`: Extracts tourist tax related fields from an offer object.
   - `getTouristTaxPrice`: Calculates the tourist tax price from the extracted fields.

2. **Interface**:
   - `IOffer`: Imported from `models/data/IOffer`, likely represents the structure of an offer object in the application context.

## Structure

The code defines two TypeScript interfaces and one main function:

1. **Interfaces**:
   - `IGetTouristTaxInfoArgs`: Describes the shape of the arguments passed to the `getTouristTaxInfo` function. It includes:
     - `isTouristTaxEnabled`: A boolean indicating if the tourist tax feature is enabled.
     - `offer`: An object that adheres to the `IOffer` interface.
   - `IGetTouristTaxInfoData`: Describes the expected structure of the data returned by the `getTouristTaxInfo` function. It includes:
     - `isTouristTaxDisplayed`: A boolean indicating whether the tourist tax is to be displayed.
     - `touristTax`: A number representing the calculated tourist tax amount.

2. **Function**:
   - `getTouristTaxInfo`: A function that takes an object of type `IGetTouristTaxInfoArgs` and returns an object of type `IGetTouristTaxInfoData`.

## Logic

The function `getTouristTaxInfo` operates as follows:

1. **Check if Tourist Tax is Enabled**:
   - If the `isTouristTaxEnabled` property in the argument object is false, the function immediately returns an object indicating that the tourist tax should not be displayed and sets the tax amount to 0.

2. **Extract Tourist Tax Fields**:
   - If tourist tax is enabled, the function extracts tourist tax related data from the `offer` object using the `getTouristTaxFieldsFromOffer` function. This function returns an object with at least a `touristTax` property.

3. **Determine Display Status**:
   - The function then determines whether the tourist tax should be displayed using the `getIsTouristTaxDisplayed` function. This decision is based on the enabled status and the value of the `touristTax` extracted in the previous step.

4. **Calculate Tourist Tax Price**:
   - The tourist tax amount is calculated using the `getTouristTaxPrice` function, which takes the raw tourist tax value as its argument.

5. **Return Result**:
   - Finally, the function returns an object with the calculated tourist tax amount and its display status.
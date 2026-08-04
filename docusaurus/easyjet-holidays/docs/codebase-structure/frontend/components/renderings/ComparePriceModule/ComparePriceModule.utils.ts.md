## Imports

The code snippet imports dependencies and type definitions from other modules:

- `NewOfferState`: An enum or constant imported from `frontend/store/base` which likely defines possible states of a new offer such as `Accepted`, `Error`, etc.
- `IComparePriceModuleFields`: A TypeScript interface imported from `./components/ComparePriceContent/ComparePriceContent.utils` which defines the structure for the fields used in the `IInfoPopupProps` interface.

## Structure

### Interfaces

- `IInfoPopupProps`: This interface defines the structure for the props expected by the `getInfoPopupProps` function. It includes:
  - `fields`: An object of type `IComparePriceModuleFields`.
  - `isLoading`: A boolean indicating if a loading process is ongoing.
  - `isLoadingError`: A boolean indicating if there is an error during loading.
  - `newOfferState`: A state of type `NewOfferState`.
  - `setIsLoadingError`: A function to update the `isLoadingError` state.
  - `setNewOfferState`: A function to update the `newOfferState`.

### Function

- `getInfoPopupProps`: A function that takes an object of type `IInfoPopupProps` and uses destructuring to access and utilize the properties. It constructs and returns an object that defines the configuration for a popup depending on the states `isLoading`, `isLoadingError`, and `newOfferState`.

## Logic

The function `getInfoPopupProps` decides the popup's behavior and appearance based on the input properties:

1. **Initialization of `data`**:
   - A default configuration object for the popup is created, primarily configured for an error state but with `shouldShow` set to `false`.

2. **State Conditions**:
   - **Accepted Offer State**:
     - If the `isLoading` is `false` and `newOfferState` is `Accepted`, it configures the popup to show a confirmation message with specific titles and subtitles pulled from `fields`.
   - **Error in New Offer State**:
     - Similar to the accepted state, but for when `newOfferState` is `Error`, setting the popup to show an error message.
   - **Loading Error**:
     - If `isLoadingError` is `true`, it modifies the default `data` object to show the popup.
   
3. **Return**:
   - The function returns the configured data object based on the conditions met by the input properties. If no specific conditions are met, it returns the initial `data` object with `shouldShow` set to `false`.

This approach allows the popup's configuration to be dynamically adjusted based on the application's state, particularly in response to offer handling processes.
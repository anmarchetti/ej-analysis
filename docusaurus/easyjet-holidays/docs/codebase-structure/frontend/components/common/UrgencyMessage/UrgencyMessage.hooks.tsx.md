## Imports

The code snippet begins by importing various modules and utilities that are essential for its operation:

- `useStore`: A custom React hook from `frontend/hooks/useStore` used for accessing the application's store.
- `TStores`: A type definition from `frontend/store/IStores` representing the structure of the stores used in the application.
- `getRoomsUrgencyMessage`: A utility function from `frontend/utils/urgencyMessage.utils` that generates a message based on room availability and other parameters.
- `SitecoreDictionary`: An enumeration from `models/enum/SitecoreDictionary` that provides dictionary keys for fetching specific phrases or settings.

## Structure

The code defines an interface and a function:

### Interface: `IUseUrgencyMessage`
This interface defines the shape of the input object for the `useUrgencyMessageText` function. It includes one property:
- `avail`: A number or undefined, representing the availability of something (likely rooms).

### Function: `useUrgencyMessageText`
This function is a custom React hook that takes an object of type `IUseUrgencyMessage` as an argument and returns an object containing two strings:
- `urgencyMessageText`: A string containing the urgency message.
- `urgencyMessageTooltipText`: A string containing the tooltip text for the urgency message.

## Logic

The function `useUrgencyMessageText` employs several steps to compute the return values:

1. **Store Access**: It uses the `useStore` hook to extract specific methods from the store:
   - `getPhrase`: A method to fetch phrases based on dictionary keys.
   - `getSetting`: A method to fetch settings.
   - `isHotelDetailsBookPage`: A boolean indicating whether the current page is a hotel details booking page.

2. **Urgency Message Calculation**:
   - The `urgencyMessageText` is calculated by calling `getRoomsUrgencyMessage`, which likely uses the `avail` parameter along with `getPhrase` and `getSetting` to determine the appropriate message based on room availability and other settings.

3. **Tooltip Text Determination**:
   - The `urgencyMessageTooltipText` is determined based on whether the current page is the hotel details booking page or not. It uses the `getPhrase` method with the appropriate key from `SitecoreDictionary` to fetch the correct tooltip text.

By employing these methods and logic, the function effectively provides dynamic text content based on the application's state and the specific page context, enhancing the user interface with relevant information and interactions.
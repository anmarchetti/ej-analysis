## Imports

The code snippet imports several JavaScript modules and TypeScript types to be used within the `useChangeFeeInfo` hook:

- `useStore`: A custom React hook from `frontend/hooks/useStore`. This hook is typically used for accessing state management stores.
- `IHolidaysStores`: A TypeScript interface from `frontend/store/holidays`. This interface likely defines the structure of the stores related to holiday booking functionalities.
- `IChangeFeeInfoFields`: A TypeScript interface from `frontend/components/renderings/ChangeFeeInfo/ChangeFeeInfo`. This interface defines the structure of the fields expected by the `ChangeFeeInfo` component.

## Structure

The `useChangeFeeInfo` function is a custom React hook that takes an optional parameter `fields` of type `Nullable<IChangeFeeInfoFields>` and returns an object containing two properties:
- `feePP`: A number representing the fee per person.
- `isShown`: A boolean indicating whether the fee information should be displayed.

### Function Details:

- **Parameters**:
  - `fields`: An optional parameter that may contain specific fee information related to hotel amendments.
  
- **Return Value**:
  - An object with properties `feePP` and `isShown`.

## Logic

1. **Store Extraction**:
   - The hook utilizes the `useStore` hook to extract specific pieces of data from various stores:
     - `amendFlightFeePP`: Fee per person for flight amendments.
     - `amendDatesFeePP`: Fee per person for date amendments.
     - `amendRoomAndBoardFeePP`: Fee per person for room and board amendments.
     - `isAmendHotelPage`: A boolean indicating if the current page is for amending hotel bookings.
     - `amendHotelFeePP`: Fee per person for hotel amendments.

2. **Hotel Change Fee Calculation**:
   - `changeFeeForHotels` is calculated based on whether the current page is for hotel amendments (`isAmendHotelPage`) and if the `fields` object has a valid `FeeValue`. If both conditions are met, the value provided in `fields.FeeValue.value` is used; otherwise, it defaults to `0`.

3. **Aggregated Fee Calculation**:
   - `changeFeeFromFlow` aggregates various fees (flight, dates, room and board, hotel) along with the `changeFeeForHotels`. It ensures that if any of these values is not present (i.e., evaluates to `false` or `0`), it defaults to `0`.

4. **Output**:
   - The hook returns an object with two properties:
     - `isShown`: This is a boolean value that is `true` if `changeFeeFromFlow` is non-zero, indicating that there is a fee to be shown.
     - `feePP`: This is the aggregated fee per person.

This hook is useful for components that need to display or use fee information based on the user's current amendment selections and the specific page context within a holiday booking application.
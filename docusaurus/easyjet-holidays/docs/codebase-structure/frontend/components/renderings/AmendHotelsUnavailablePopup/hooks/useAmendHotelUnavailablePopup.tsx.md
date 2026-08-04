## Imports

The code begins with the import of the `useStore` hook from the `frontend/hooks/useStore` path. This hook is presumably used to access the application's state management. Additionally, the `IHolidaysStores` interface is imported from `frontend/store/holidays`, which likely defines the structure of the store related to holiday functionalities.

```javascript
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
```

## Structure

The `useAmendHotelUnavailablePopup` is a custom hook that returns an object containing several properties and methods related to the UI state of a popup in a hotel booking context:

- `isLoading`: A boolean indicating if any related data is currently loading.
- `isShown`: A boolean that determines if the popup should be shown, based on whether there is an availability error.
- `onClose`: A function to close the popup and reset the error state.
- `onConfirm`: An asynchronous function that handles the confirmation action, which may involve navigation or date amendment depending on the current page context.

The hook utilizes the `useStore` to extract multiple state and actions from the global store, which are relevant to the popup's behavior:

- `setIsNoAvailabilityError`
- `isNoAvailabilityError`
- `onAmendDatesButtonClick`
- `isInitialDatesLoading`
- `isAmendPaymentPage`
- `isAmendHotelSummaryPage`
- `redirectToAmendHotelPage`
- `isRedirectionLoading`
- `isAmendHotelPage`

These extracted values and functions are used to determine the behavior of the `onClose` and `onConfirm` methods and to compute the values of `isLoading` and `isShown`.

## Logic

### onClose Method
The `onClose` method is straightforward; it simply sets the `isNoAvailabilityError` to `false`, effectively resetting the error state related to hotel availability.

```javascript
const onClose = (): void => {
    setIsNoAvailabilityError(false);
};
```

### onConfirm Method
The `onConfirm` method contains more complex logic. It first checks if the current page is the Amend Hotel Page. If not, it determines whether the current page is either the Amend Payment Page or the Amend Hotel Summary Page. Based on this check, it decides which action to execute:

- If on one of the "edge" pages (`isAmendPaymentPage` or `isAmendHotelSummaryPage`), it executes `redirectToAmendHotelPage`.
- Otherwise, it calls `onAmendDatesButtonClick`.

This method is asynchronous and awaits the completion of the selected action before calling `onClose` to reset the popup state.

```javascript
const onConfirm = async (): Promise<void> => {
    if (!isAmendHotelPage) {
        const isEdgePage = isAmendPaymentPage || isAmendHotelSummaryPage;
        const handler = isEdgePage ? redirectToAmendHotelPage : onAmendDatesButtonClick;

        await handler();
    }

    onClose();
};
```

### Return Structure
Finally, the hook returns an object containing the `onClose` and `onConfirm` methods, along with the `isLoading` and `isShown` properties, which are derived from the state values obtained from the store.

```javascript
return {
    onClose,
    onConfirm,
    isLoading: isRedirectionLoading || isInitialDatesLoading,
    isShown: isNoAvailabilityError,
};
```

This structure and logic make the `useAmendHotelUnavailablePopup` hook a central part of managing the state and behavior of a popup related to hotel booking amendments in scenarios where there is no availability.
### Imports

The `useBoardStore` function utilizes several imports from different modules:

- **Hooks and Stores:**
  - `useStore`: A custom hook from `frontend/hooks/useStore` for accessing the application's store.
  - `isHolidayStore`: A selector from `frontend/store/holidays` to determine if the current store is related to holidays.
  - `useRoomAndBoardLocalStore`: A custom hook from `frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore` for managing local state related to room and board options.

- **Type Definitions:**
  - `TStores`: A type from `frontend/store/IStores` representing the structure of the application's stores.
  - `IAmendHotelOffer`, `IBookingInfo`, `IOfferWithoutAltBoards`: Interfaces from `models/data/bookingAmendment/AmendHotel` and `models/data` defining the structure of various offer and booking related data.
  - `IBoardType`, `IAltBoard`: Interfaces from `models/data/IHotel` defining the structure of board type data.

### Structure

The `useBoardStore` function is defined to handle and return properties related to board types and offers, based on whether the context is post-booking or during the booking flow. The function signature is as follows:

```javascript
const useBoardStore = (isPostBooking: boolean): IBoardStoreProps
```

Where `IBoardStoreProps` is an interface that includes:

- `allBoardTypes`: An array of `IBoardType` or `IAltBoard`.
- `offer`: A nullable type that can be `IAmendHotelOffer`, `IBookingInfo`, or `IOfferWithoutAltBoards`.
- `selectedBoardType`: A nullable type that can be `IBoardType` or `IAltBoard`.
- `changeBoardCodeError`: An optional function.
- `failedToLoadData`: A boolean indicating if data loading failed.

### Logic

The `useBoardStore` function operates based on the `isPostBooking` boolean parameter:

1. **Store Extraction:**
   - Utilizes `useStore` to extract properties from different parts of the store depending on the context (`postBookingProps` for post-booking and `bookFlowProps` for booking flow).

2. **Local Store Management:**
   - Uses `useRoomAndBoardLocalStore` to manage and retrieve local state related to room and board options (`chosenBoard`, `allBoardTypes`, `chosenOffer`).

3. **Conditional Return:**
   - If `isPostBooking` is `true`, the function checks if an `offer` exists in the local store and returns `localStoreProps` if available; otherwise, it defaults to `postBookingProps`.
   - If `isPostBooking` is `false`, it simply returns `bookFlowProps`.

This setup allows the function to adaptively provide relevant data based on the user's stage in the booking or post-booking process, ensuring that the UI can react and display appropriate options dynamically.
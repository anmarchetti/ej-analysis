## Imports

The `StickyHeader` component utilizes several imports, categorized into different types:

1. **React and Utilities:**
   - `FunctionComponent` from `react` for defining functional components.
   - `classNames` from `classnames` to conditionally join class names together.

2. **Hooks and Store:**
   - `useStore` from `frontend/hooks/useStore` to access the Redux store.

3. **Types:**
   - `IHolidaysStores` from `frontend/store/holidays` for typing the store used in the component.
   - `IAmendHotelOffer` from `models/data/bookingAmendment/AmendHotel` for typing the amendment offer.

4. **Components and Utils:**
   - `StickyBox` from `frontend/components/common/StickyBox` for making an element stick within the viewport.
   - `getHotelChangeInfo` from `frontend/components/renderings/AmendHotel/AmendHotel.utils` to compute details from booking or amendment data.
   - `ComponentWrapper` from `frontend/components/renderings/static/ComponentWrapper` for consistent styling across components.

5. **Sub-components:**
   - Various detailed components like `BoardDetails`, `DatesDetails`, `HotelConfirmationCTA`, etc., each responsible for rendering specific aspects of the hotel booking UI.

6. **Styles:**
   - SCSS module `styles` from `./StickyHeader.module.scss` for scoped CSS styling of the component.

## Structure

The `StickyHeader` component is structured as follows:

- **Props:**
  - `dataTid`: A string for test identification.
  - `amendOffer`: Optional `IAmendHotelOffer` object containing details of an amendment offer.
  - `tooltipLabel`: Optional string for tooltips.

- **Rendering Logic:**
  - The component first retrieves the current booking from the store.
  - It then calculates various booking details using the `getHotelChangeInfo` utility function.
  - The main JSX structure includes a `StickyBox` that conditionally renders various sub-components based on the booking data:
    - `HotelDetails`, `RatingsDetails`, `DatesDetails`, `RoomDetails`, `BoardDetails`, and `TransferDetails` are organized into columns.
    - If a new hotel has been selected (`hasSelectedNewHotel`), additional sections for total price and a confirmation call-to-action button are displayed.

## Logic

- **Data Fetching:**
  - The component uses the `useStore` hook to access the Redux store and fetch the current booking data.

- **Conditional Rendering:**
  - If no booking data is available, the component returns `null`, rendering nothing.
  - Based on the presence of an amendment offer (`amendOffer`), the component decides whether to display the original booking information or the amended details.

- **Utility Functions:**
  - `getHotelChangeInfo` is used to extract and compute necessary details from the booking or amendment data, such as dates, room types, and other hotel-specific details.

- **Dynamic Class Handling:**
  - `classNames` is used to dynamically handle CSS classes for various elements, allowing conditional styling based on the component's state or props.

- **Composition:**
  - The component heavily utilizes smaller sub-components to manage the complexity of the UI, each responsible for rendering specific pieces of data, thereby adhering to the principle of single responsibility and making the main component cleaner and easier to maintain.
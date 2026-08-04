## Imports

In the `BookingPriceBox` component, several resources are imported to facilitate its functionality:

- **React and FC (Functional Component)**: These are imported from the `react` library. `FC` is used for typing the functional component.
- **useStore**: A custom hook from `frontend/hooks/useStore` for accessing the Redux store.
- **IHolidaysStores**: A TypeScript interface from `frontend/store/holidays` defining the shape of the store related to holidays.
- **IBookingInfo**: A TypeScript interface from `models/data/IBookingInfo` that details the booking information structure.
- **SitecoreDictionary**: An enumeration from `models/enum/SitecoreDictionary` which holds key-value pairs for string constants.
- **SvgWarningFilled**: A React component representing a warning icon, imported from `frontend/components/icons-new/WarningFilled`.
- **PillsBlock**: A React component from `frontend/components/renderings/ViewBookings/components/PillsBlock` used to display a group of information pills.
- **usePreparedBookingPriceBoxData**: A custom hook from the same directory as this component, which prepares data specifically for this component.
- **styles**: The specific SCSS module for styling this component, loaded from `./BookingPriceBox.module.scss`.

## Structure

The `BookingPriceBox` component is structured as follows:

- **Props**: The component accepts props of type `IBookingPriceBoxProps`, which includes:
  - `booking`: An object conforming to the `IBookingInfo` interface.
  - `isUpcoming`: A boolean indicating if the booking is upcoming.

- **Functional Component Definition**: `BookingPriceBox` is defined as a functional component using React's `FC` type, taking `IBookingPriceBoxProps` as its prop type.

- **Rendering Logic**:
  - The component utilizes the `useStore` hook to extract the `getPhrase` function from the `layoutStore`.
  - It uses the `usePreparedBookingPriceBoxData` custom hook to prepare necessary data based on the `booking` and `isUpcoming` props.
  - Conditional rendering is employed to return `null` if `isNullable` is true, meaning there's no relevant data to display.
  - The `PillsBlock` component is used to render the booking details, and a conditional section is included to display a cancellation warning message if `isCancelWarningDisplayed` is true.

## Logic

The core logic of the `BookingPriceBox` component revolves around data preparation and conditional rendering:

- **Data Preparation**: The `usePreparedBookingPriceBoxData` hook is used to determine:
  - `isNullable`: A flag indicating if there's no relevant data to display.
  - `pillsProps`: Props for the `PillsBlock` component, which include details derived from the booking data.
  - `isCancelWarningDisplayed`: A boolean that determines whether to show a warning about possible cancellation.

- **Conditional Rendering**:
  - If `isNullable` is `true`, the component renders nothing (`return null`).
  - Otherwise, it renders the `PillsBlock` with the prepared `pillsProps`.
  - Inside the `PillsBlock`, if `isCancelWarningDisplayed` is `true`, a warning message (using `SvgWarningFilled` and a message fetched with `getPhrase`) is displayed.

This setup ensures that the component remains highly modular and responsive to the incoming props, adapting its display based on the booking details and context (upcoming or past booking).
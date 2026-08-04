## Imports

The `BookingCardOptions` component relies on several imports from both external libraries and internal modules:

- **React and Classnames**: 
  - `FC` (Function Component) is imported from `react` to type the component.
  - `classNames` is a utility function from the `classnames` package, used to conditionally apply CSS class names.

- **Type and Component Imports**:
  - `IBookingInfo` is an interface representing the booking information, imported from `models/data/IBookingInfo`.
  - `BookingCanceledStatusInfo` and `OfferKeySellingPoints` are React components used to display specific parts of the booking options UI.

- **Utility Functions and Styles**:
  - `usePreparedBookingOptionsData` is a custom React hook imported from `./BookingCardOptions.utils`, used to prepare data for rendering.
  - `styles` imports specific SCSS module styles from `./BookingCardOptions.module.scss` for styling the component.

## Structure

The `BookingCardOptions` component is structured as follows:

- **Component Definition**:
  - Defined as a functional component `BookingCardOptions` using the `FC` type from React, with `IBookingCardOptionsProps` as its props type.

- **Props Interface (`IBookingCardOptionsProps`)**:
  - Contains a single property `booking` of type `IBookingInfo`.

- **JSX Structure**:
  - The component returns a `div` element with a class name derived from the SCSS module.
  - Inside the main `div`, conditional rendering is used to display `BookingCanceledStatusInfo` if the booking is canceled.
  - Another `div` wraps the `OfferKeySellingPoints` component, with its class names conditionally set using the `classNames` function.

## Logic

- **Data Handling**:
  - The `usePreparedBookingOptionsData` hook is used to extract and prepare data from the `booking` prop. It returns an object containing `isCanceled` (a boolean indicating if the booking is canceled) and `optionsProps` (props for the `OfferKeySellingPoints` component).

- **Conditional Rendering**:
  - The component conditionally renders the `BookingCanceledStatusInfo` component if `isCanceled` is `true`. This component also receives a prop `displayOnMobile`, indicating it should be visible on mobile devices.

- **Dynamic Class Names**:
  - The `classNames` function is used to dynamically add the `hotel-card-txt--canceled` class to the `div` containing the `OfferKeySellingPoints` based on the `isCanceled` state.

This structure and logic ensure that the component is both flexible and efficient in handling different states of booking data, while also maintaining a clear separation of concerns between styling, data handling, and UI structure.
## Imports

The component imports several modules and components necessary for its operation:

- **React and FC**: Imports the React library and the `FC` (Function Component) type from React for type-checking the component.
- **classNames**: A utility function to conditionally join class names together.
- **observer**: A function from `mobx-react` used to wrap the component, making it reactive to MobX state changes.
- **useTabletViewport**: A custom React hook from `frontend/hooks/useMediaQuery` used to determine if the viewport is of tablet size.
- **useStore**: A custom hook for accessing MobX stores.
- **TStores and ICabinBagsFields**: TypeScript types/interfaces for type-checking the stores and component props.
- **SitecoreDictionary**: An enumeration from `models/enum` to manage dictionary keys.
- **JSSImage, ReadMoreButton, RichTextDictionary, CabinBagsPricePanel**: Custom React components used within this component.
- **styles**: The CSS module for styling the component.

## Structure

The `CabinBagsDropdown` component is structured as follows:

- **Props**: The component accepts `ICabinBagsDropdownProps` which includes:
  - `fields`: An object of type `ICabinBagsFields` containing various field definitions and data.
  - `isExpanded`: A boolean indicating if the dropdown is expanded.
  - `onExpandChange`: A function to toggle the `isExpanded` state.

- **State Management and Hooks**:
  - Uses `useStore` to extract necessary states from the MobX store.
  - Uses `useTabletViewport` to determine if the current device has a tablet viewport.
  
- **Rendering**:
  - The component conditionally applies CSS classes based on the `isExpanded` and `isPostBookingPages` states.
  - It conditionally renders UI elements such as the `ReadMoreButton` and different icons/text based on the state and props.
  - It maps over `passengersByQueue` to render a list of `CabinBagsPricePanel` components.

## Logic

- **Read More Button Click**:
  - The `onReadMoreButtonClick` function toggles the `isExpanded` state by invoking `onExpandChange` with the negation of `isExpanded`.

- **Conditional Rendering**:
  - The component uses the `classNames` function extensively to conditionally apply styles based on the state such as `isExpanded`, `isPostBookingPages`, and whether the device is a tablet.
  - It uses conditional rendering to decide whether to show or hide certain elements like the `ReadMoreButton` and parts of the dropdown content.

- **Dynamic Text and Icons**:
  - Text for the `ReadMoreButton` and icons are dynamically chosen based on the `isLuxuryPackage` state and the `fields` prop.
  - Uses the `RichTextDictionary` component for localized text based on keys from `SitecoreDictionary`.

This component is wrapped with `observer` from MobX, making it reactive to changes in the MobX state tree that affect the rendered output.
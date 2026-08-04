### Imports

The `CabinBagsBanners` component uses several imports from external libraries and internal modules:

- **React and MobX**: 
  - `FunctionComponent` from `react` for typing the functional component.
  - `observer` from `mobx-react` to make the component reactive to MobX state changes.

- **Utilities and Helpers**:
  - `classNames` for dynamically setting CSS class names.
  - `useStore` custom hook for accessing MobX stores.

- **Type Definitions**:
  - `TStores` from `frontend/store/IStores` for typing the stores used in the `useStore` hook.
  - `ICabinBagsFields` from `models/data/ICabinBagsFields` for typing the `fields` prop of the component.

- **Enums**:
  - `EventLabels` from `models/enum/tracking/GenericEventParams` for using predefined event label constants.

- **Components**:
  - `InfoBlock`, `IInfoBlockProps` from `frontend/components/common/InfoBlock/InfoBlock` for displaying various informational banners.

- **Styles**:
  - Styles specific to the component are imported from `./CabinBagsBanners.module.scss`.

### Structure

The `CabinBagsBanners` component is a functional component typed with `FunctionComponent` using TypeScript. It accepts props of type `ICabinBagsBannersProps`, which includes:

- `fields`: An object containing various sub-fields and content related to cabin bags.
- `hasPrice`: A boolean indicating if a price is associated with the cabin bags.

The component uses the `useStore` custom hook to extract necessary state and actions from various MobX stores:

- States like `isFlightExtrasFailed`, `cabinBagsCategoriesExist`, and actions like `setHoldLuggagePopupOpened` are destructured from the stores.

The component conditionally renders different `InfoBlock` components based on various state conditions and the provided `fields` prop.

### Logic

**Condition Handling**:
- The component first checks if the `fields` prop is not provided and returns `null` if so.
- It handles multiple conditions to determine which type of `InfoBlock` to render:
  - Out-of-sync state for bookings.
  - Whether the booking page is being viewed.
  - Availability of cabin bags and extra luggage options.
  - Internal or external status of the flight.
  - Failure in fetching flight extras or absence of cabin bags categories.
  - Full or almost full status of low-cost bags (LCB).

**Dynamic Content Rendering**:
- Based on the conditions, different sets of data (`Title`, `Subtitle`, `Link`, `ButtonLabel`) are pulled from the `fields` object and passed to the `InfoBlock`.
- Certain conditions also involve interaction, such as opening a pop-up for hold luggage when certain banners are clicked.

**Event Tracking**:
- Various user interactions and state conditions trigger calls to `trackLCBBanners` with specific event labels, such as clicking on a full capacity banner or when the capacity is almost full.

**Utility Functions**:
- `openHLPopup` is a utility function defined to handle the opening of the hold luggage popup and ensure the target element is scrolled into view.

**Reactivity**:
- The component is wrapped with `observer` from `mobx-react`, making it reactive to changes in MobX state used within the component, ensuring it re-renders when necessary state changes occur.
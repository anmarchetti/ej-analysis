## Imports

The `AmendRoomAndBoardHeader` component utilizes several imports from different modules:

- **MobX React**: `observer` from `mobx-react` is used to make the component reactive to MobX state changes.
- **Endpoints and Hooks**: `cmsUrls` for accessing media URLs and `useStore` for accessing MobX stores.
- **Store and Utility Functions**:
  - `IHolidaysStores` interface from `frontend/store/holidays` to type the store used.
  - Utility functions like `getAmendmentRoundedPrice`, `getRoomName`, and `roomTitleNormalize` from `frontend/utils` to handle specific data transformations.
- **Sitecore Models**: `ISitecoreField` interface from `models/sitecore/generic/ISitecoreField` to handle Sitecore field typings.
- **Components**:
  - `AmendPageStickyHeader` and `ImageWithFilter` from `frontend/components/common` for displaying UI elements.
  - `SVGHotelBedFilled` from `frontend/components/icons-new` for rendering a specific SVG icon.
- **Styles**: Importing CSS module styles from `./AmendRoomAndBoardHeader.module.scss` for component-specific styling.

## Structure

The `AmendRoomAndBoardHeader` component is a functional component that accepts `IAmendRoomAndBoardHeaderProps` as props. The props include:

- `additionalCostLabel`: Label for additional cost.
- `refundAmountLabel`: Label for refund amount.
- `priceTooltipContent`: Optional tooltip content for price, typed with `ISitecoreField<string>`.

The component uses the `useStore` hook to extract necessary state and actions from the MobX store, specifically targeting the `amendRoomAndBoardStore` and related properties from other stores.

Within the component, there are conditions to check if necessary data (`chosenRoom`, `chosenBoard`, `chosenRoomVariant`) is available. If any of these are missing, the component renders `null`.

## Logic

1. **Store Data Extraction**:
   - Uses `useStore` to map store data to local constants, simplifying access to the room and board amendment options and loading states.
   - Conditions check the presence of `chosenRoom`, `chosenBoard`, and `chosenRoomVariant` to ensure the component has data to render.

2. **Conditional Rendering**:
   - If the required data is not present, the component returns `null`, preventing any unhandled errors or incomplete renders.

3. **Data Handling and UI Logic**:
   - Determines whether to show additional cost or refund based on the `fullAmendmentCharges` value.
   - Uses utility functions to normalize and format room and board titles and prices.
   - Disables interaction elements (`AmendPageStickyHeader`'s confirm button) based on whether the original variant is chosen or if the options are still loading.

4. **Component Composition**:
   - Renders an `AmendPageStickyHeader` with props controlling its behavior based on the amendment state.
   - Inside the header, displays icons and titles for the chosen room and board using `ImageWithFilter` and `SVGHotelBedFilled`, applying filters and normalization as needed.

This component effectively combines data handling, conditional rendering, and a clear structure to provide a UI for amending room and board options in a booking system, reacting to state changes via MobX observables.
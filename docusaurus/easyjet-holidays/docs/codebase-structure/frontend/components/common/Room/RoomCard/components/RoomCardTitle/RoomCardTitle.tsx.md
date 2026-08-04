## Imports

The `RoomCardTitle` component uses several JavaScript and TypeScript modules to function properly. Below is a detailed breakdown of these imports:

- **React Import:**
  - `FunctionComponent` from `react`: This is used to type the component as a React functional component.

- **Hooks and Utilities:**
  - `useStore` from `frontend/hooks/useStore`: Custom hook for accessing the Redux store.
  - `getRoomName` from `frontend/utils/offer.utils`: Utility function to retrieve the room name based on the room type.
  - `roomTitleNormalize` from `frontend/utils/string.utils`: Utility function to normalize the room title.

- **Models and Types:**
  - `IUnit` from `models/data/IOffer`: Interface representing the structure of a unit (room).
  - `MarketCode` from `models/data/MarketSettings`: Enum containing market codes.
  - `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Enum used for accessing string literals related to Sitecore items.

- **Components:**
  - `FreeForKidsPill` from `frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill`: React component displayed if the room offers free places for kids.
  - `UrgencyMessage` from `frontend/components/common/UrgencyMessage/UrgencyMessage`: Component showing an urgency message.
  - `useUrgencyMessageText` from `frontend/components/common/UrgencyMessage/UrgencyMessage.hooks`: Hook to derive texts for the `UrgencyMessage` component.

- **Styles:**
  - `styles` from `./RoomCardTitle.module.scss`: Module CSS for styling the `RoomCardTitle` component.

## Structure

The `RoomCardTitle` component is structured as follows:

- **Props:**
  - `IRoomCardTitleProps`: Interface defining the props the component accepts, which includes:
    - `room`: The room data.
    - `countryCode`: Optional country code.
    - `freeChildPlaceTooltip`: Optional tooltip text for the free child place pill.
    - `withIncludedSubtitle`: Boolean to determine if a subtitle should be shown.

- **Component Definition:**
  - `RoomCardTitle` is a functional component typed with `FunctionComponent<IRoomCardTitleProps>`.
  - Inside, it utilizes the `useStore` hook to fetch phrases and market codes from the store, and the `useUrgencyMessageText` hook to get text for the urgency message based on room availability.

- **JSX Structure:**
  - The component returns a div containing:
    - A title paragraph.
    - A div for pills, which conditionally includes `UrgencyMessage` and `FreeForKidsPill` based on certain conditions.
    - An optional subtitle paragraph if `withIncludedSubtitle` is true.

## Logic

The logic of the `RoomCardTitle` component can be summarized as follows:

- **Store and Market Logic:**
  - Uses `useStore` to extract `getPhrase` for fetching localized strings and `marketCode` to check the current market.

- **Room and Title Management:**
  - `roomName` is derived from the `room.roomType` using `getRoomName`.
  - `titleText` is then normalized using `roomTitleNormalize`.

- **Conditional Rendering:**
  - `isUKMarket`: Determines if the current market code matches the UK. If true, an urgency message is displayed.
  - `isShowFreeForKidsPill`: Checks if the room is marked as free for kids and if both `freeChildPlaceTooltip` and `countryCode` are provided. If true, a `FreeForKidsPill` is displayed.

- **Accessibility and Testing:**
  - Uses `aria-label` for accessibility in titles and subtitles.
  - Data attributes like `data-tid` are used for testing purposes to easily target elements.

This component effectively combines data handling, conditional rendering, and accessibility considerations to provide a robust user interface component for displaying room titles and related information.
## Imports

The component imports several modules and hooks from external and internal sources:

- **React Imports**: Standard React hooks (`useEffect`, `useRef`, `useState`) and `FC` (Function Component) from `react`.
- **Intersection Observer Hook**: `useInView` from `react-intersection-observer` for detecting when an element is within the viewport.
- **Utility and Store Hooks**: 
  - `cmsUrls` from `code/endpoints` for media URL transformations.
  - `useStore` from `frontend/hooks/useStore` for accessing the Redux store state.
  - `scrollToElement` from `frontend/utils/ui.utils` for smooth scrolling functionality.
- **Type and Interface Imports**:
  - `DestinationType` from `models/enum/DestinationType` for typing destinations.
  - `ISitecoreComponent` from `models/sitecore/generic/ISitecoreComponent` for Sitecore component props typing.
- **Component and Helper Imports**:
  - `AlphabetNav`, `AlphabetStickySelector`, `buildAlphabeticAnchors`, `IAlphabeticAnchor` from `frontend/components/common/AlphabetIndex` for navigation and indexing functionalities.
  - `DestinationCountry`, `getCountryAnchorId` from local `components/DestinationCountry` for country-specific display and utility.

## Structure

The `DestinationsList` component is structured as follows:

- **Type Definitions**:
  - `IDestinationListItem`: Represents a basic structure for a destination item including properties like `Code`, `Id`, `Name`, `Type`, and `Url`.
  - `IDestinationListCountry`: Extends `IDestinationListItem` including a list of regions which are also of type `IDestinationListItem`.
  - `IDestinationsListFields`: Defines the structure of the props expected from Sitecore, specifically a list of countries.
  - `IDestinationsListPropsParams`: Additional parameters for the component, e.g., an icon URL.
  - `TDestinationsListProps`: Combines Sitecore component properties with custom parameters.
  
- **Component Definition**:
  - Utilizes `FC` (Functional Component) from React for type definition.
  - Uses destructured props `fields` and `params` for direct access to component data.
  
- **State Management**:
  - Local state managed by `useState` for tracking the current letter and visibility of the letter selector.
  - `useRef` for managing scroll behavior and ignoring scroll updates during certain interactions.

## Logic

The component's logic is centered around managing the display and interaction with a list of destinations sorted alphabetically:

- **Intersection Observer**: 
  - Uses `useInView` to toggle visibility of alphabetic anchors based on the component's visibility in the viewport.
  
- **Scroll Management**:
  - Custom logic to handle user scroll direction and to temporarily disable scroll event handling while programmatically scrolling to prevent unwanted triggers.
  
- **Event Handlers**:
  - `onScrollToLetter`: Scrolls to the specific DOM element associated with a given letter while temporarily disabling the scroll event listener.
  - `onHideAnchors` and `onShowAnchors`: Functions to manage the visibility of sticky letter selectors based on the component's position in the viewport.
  
- **Rendering**:
  - The component renders an alphabet navigation bar, a list of destination countries, and optionally a sticky letter selector based on the current scroll position and selected letter.
  - Uses the `AlphabetNav` and `AlphabetStickySelector` components for rendering the alphabet navigation and handling letter selection via clicks.
  
- **Effects**:
  - Two `useEffect` hooks manage adding and removing the scroll event listener and updating the visibility state based on the intersection observer.

This structure and logic ensure the component is responsive to both user interaction and scrolling, providing a dynamic and interactive alphabetical listing of destinations.
## Imports

The component imports several modules and dependencies necessary for its functionality:

- **React Hooks**: `useEffect` and `useState` from `react` for managing component lifecycle and state.
- **classNames**: A utility function for conditionally joining class names together.
- **observer**: From `mobx-react` to make the component reactive to MobX state changes.
- **useStore**: A custom hook from `frontend/hooks/useStore` to access MobX stores.
- **IOffer** and **IRecommendedHotelsFields**: TypeScript interfaces from `models/data` that define the shapes of offers and fields related to recommended hotels.
- **RecommendedType**: An enumeration from `models/enum/RecommendedType` to manage types of recommendations.
- **SitecoreDictionary**: An enumeration from `models/enum/SitecoreDictionary` for accessing dictionary keys.
- **Button** and **CarouselOfferCard**: React components from `frontend/components` that are used within this component for rendering UI elements.

## Structure

The `RecommendedHotelsGrid` component is structured as follows:

- **Props**: The component accepts several props including `fallbackImage`, `initialNumberOfHotelsDesktop`, `initialNumberOfHotelsMobile`, `offers`, `title`, `displaySponsoredLabel`, and `fields`.
- **State Management**: Uses `useState` to manage `offersToShow` and `initialItemsAmount`, which control the display of hotel offers and the initial count of items respectively.
- **Effects**: Two `useEffect` hooks are used to set up initial state based on screen size and to respond to changes in screen size.
- **Functions**:
  - `updateSettings`: A utility function to update state for `initialItemsAmount` and `offersToShow`.
  - `onToggleClick`: Handles the logic for expanding or collapsing the list of offers.
  - `onSelectOffer`: Handles the selection of an offer and triggers tracking events.
- **Conditional Rendering**: The component conditionally renders UI elements such as the toggle button based on the number of offers and the initial items amount.
- **Return**: Renders a structured layout of recommended hotels using the `CarouselOfferCard` component and a toggle button if applicable.

## Logic

1. **Initialization**:
   - Determines the number of items to show based on the screen size using the `isScreenMedium` flag from the store.
   - Sets the initial state for the number of items and the offers to show based on the total offers available and the initial number determined.

2. **Responsiveness**:
   - A separate effect listens for changes in `isScreenMedium` to adjust the displayed offers and the number of items accordingly when the screen size changes.

3. **Interaction**:
   - `onToggleClick` dynamically calculates the number of offers to show when the toggle button is clicked, either expanding to show more offers or collapsing to show the initial set.
   - `onSelectOffer` triggers when an offer is selected, performing actions like tracking and potentially navigating based on the offer details.

4. **Tracking**:
   - Various tracking functions are called throughout interactions to monitor user actions and the state of the component, such as when the component is loaded, when pagination actions occur, and when an offer is clicked.

This component effectively manages a dynamic display of hotel offers based on user interactions and responsive changes, with integrated tracking for analytics.
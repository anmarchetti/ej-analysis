## Imports

The `PriceBreakdown` component utilizes a variety of imports from both internal modules and external libraries:

- **React and Hooks**: Uses `FunctionComponent`, `useEffect`, `useRef`, and `useState` from React for managing component lifecycle, state, and references.
- **Swipeable**: From `react-swipeable` to handle swipe gestures.
- **Sitecore JSS**: Imports `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields managed by Sitecore.
- **Class Names**: Utilizes `classnames` for dynamically setting CSS class names.
- **MobX**: Uses `observer` from `mobx-react` to make the component reactive to MobX state changes.
- **Custom Hooks and Utilities**:
  - `useClickOutside` to handle clicks outside the component.
  - `useMoreThenMobileViewport` and `useMediaQuery` for responsive behavior.
  - `useStore` to access MobX stores.
  - `lockBodyScroll` and `unLockBodyScroll` from `ui.utils` to control body scroll based on component state.
- **Models and Interfaces**:
  - Currency-related enums and interfaces such as `CurrencyCode` and `SignDisplay`.
  - Various interfaces for handling data structures related to fees, taxes, and Sitecore fields.
- **Components**:
  - `HeightAnimatedContainer` and `StickyBox` for layout and sticky behavior on mobile views.
  - Sub-components like `PriceBreakdownDetails`, `PriceBreakdownItem`, `PriceBreakdownShimmer`, `PriceBreakdownStickyBar`, and `TouristTaxSummary` for detailed breakdowns and loading states.
- **Styles**: Imports SCSS module for component-specific styling.

## Structure

The `PriceBreakdown` component is structured into several key areas:

- **Component Definition**: Defined as a functional component using TypeScript for props validation.
- **State Management**: Manages state for the mobile drawer's visibility and its translateY position for animation.
- **Effects**:
  - One effect to toggle body scroll locking based on the mobile drawer's state.
  - Another effect to close the mobile drawer when viewport changes to a wider view.
- **Conditional Rendering**: Depending on the `isLoading` prop, it either shows a shimmer effect during loading or the actual content.
- **Responsive Handling**: Provides different layouts and interactions for mobile and desktop views using `isMoreThenMobileViewport`.
- **Swipe Handling**: Uses `Swipeable` to handle user gestures on mobile devices.
- **Sub-Components**: Utilizes several smaller components to organize the code better and manage specific parts of the price breakdown like details, summary, and sticky bar.

## Logic

The core logic of the `PriceBreakdown` component revolves around displaying detailed financial transactions, handling user interactions, and responsive behaviors:

- **Money Formatting**: Uses a custom `formatMoney` function from the store for formatting currency values based on the locale.
- **Mobile Drawer Control**:
  - Toggles the mobile drawer based on swipe gestures or button clicks.
  - Uses translateY state to animate the drawer's open/close transitions.
- **Tourist Tax Calculation**: Conditionally renders tourist tax information if enabled and applicable.
- **Event Handling**:
  - `useClickOutside` to close the mobile drawer when clicking outside the component area.
  - Swipe event handlers to manage the drawer's position and state based on user gestures.
- **Data Propagation**:
  - Passes necessary data to sub-components for rendering detailed breakdowns and summaries.
  - Handles conditional logic for displaying different texts and amounts based on the transaction type (refund or charge).

This component is designed to be highly responsive and interactive, providing a seamless user experience across devices while managing complex state and data interactions efficiently.
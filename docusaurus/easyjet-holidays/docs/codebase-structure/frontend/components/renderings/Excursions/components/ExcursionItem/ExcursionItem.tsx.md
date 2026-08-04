## Imports

The `ExcursionItem` component imports several libraries and helper components/modules to facilitate its functionality:

- **React and Hooks**: Utilizes React library for component structure and hooks (`useEffect`) for lifecycle events.
- **react-intersection-observer**: Imports `useInView` for detecting when the component enters the viewport.
- **@sitecore-jss/sitecore-jss-nextjs**: Imports `Text` for rendering Sitecore managed text fields.
- **classnames**: A utility to conditionally join classNames together.
- **Local Hooks and Utilities**:
  - `useStore`: A custom hook for accessing the global state store.
  - `convertToYesNoString`: A utility function to convert boolean values to "Yes" or "No" strings.
- **Models**: Interfaces from `models/data` and `models/enum` directories to type-check data related to excursions and tracking.
- **Components**:
  - `PriceLabel` and `StarRating`: Custom components to display the price and star ratings respectively.
  - `SvgPromo`: A component that renders a promotional SVG icon.
- **Styles**: Specific SCSS module for styling (`ExcursionItem.module.scss`).

## Structure

The `ExcursionItem` component is structured as follows:

- **Props**: The component accepts various props such as `descriptionMaxLines`, `fields`, `item`, `index`, `params`, and optional `className`, `isHorizontalView`, and `trackExcursion` function.
- **Store Hooks**: Uses the `useStore` hook to derive `getPhrase`, `trackEventWithParams`, and `formatMoney` methods from different stores.
- **Intersection Observer**: Utilizes the `useInView` hook to monitor when the component becomes visible in the viewport.
- **Event Handlers**:
  - `onClick`: Defines what happens when the excursion item is clicked, including tracking the event.
- **Lifecycle Effects**:
  - `useEffect`: Tracks the excursion when it first comes into view.

## Logic

- **Tracking Setup**: When the excursion item is clicked, it constructs an event parameters object and triggers a tracking event. It also conditionally adds certain properties based on the item's attributes like `likelyToSellOut`.
- **Visibility Tracking**: Uses the `inView` status from `useInView` to determine when the component is visible and triggers `trackExcursion` if provided.
- **Conditional Rendering**:
  - Renders promotional badges if `likelyToSellOut` is true.
  - Adjusts styles based on `isHorizontalView`.
  - Displays the number of reviews and differentiates the text based on the count.
  - Shows free cancellation text if applicable.
- **Dynamic Styling**:
  - Uses `classnames` to dynamically assign classes based on the component's state and props.
- **Accessibility**:
  - Includes `visually-hidden` spans to describe links for screen readers.
  - Uses `rel='noreferrer'` on links to enhance security.
## Imports

The code uses ES6 import statements to bring in various dependencies:

- `FC` from `react`: FC (Functional Component) is a type from React for defining functional components with TypeScript.
- `ButtonGroupProps` from `react-multi-carousel`: ButtonGroupProps is a TypeScript type that defines the expected props structure for the button group used in the carousel.
- `useStore` from `frontend/hooks/useStore`: A custom hook likely used for accessing the global state management (possibly using MobX or a similar state management library).
- `TStores` from `frontend/store/IStores`: A TypeScript type that defines the structure of the stores used in the state management of the application.
- `SitecoreDictionary` from `models/enum/SitecoreDictionary`: An enumeration that provides keys for translation or specific constants related to Sitecore implementation.
- `Button` from `frontend/components/common/Button`: A reusable Button component.
- `SvgChevronLeft` and `SvgChevronRight` from `frontend/components/icons-new/`: These are React components that render left and right chevron icons, respectively.

## Structure

The `ButtonGroup` component is defined as a functional component utilizing TypeScript. It accepts props of type `ButtonGroupProps` which includes `carouselState`, `next`, and `previous` properties:

- `carouselState`: An object that holds the state of the carousel including the current slide and the total number of items.
- `next`: A function to transition to the next item in the carousel.
- `previous`: A function to transition to the previous item in the carousel.

Within the component:

- A `getPhrase` function is derived from a custom hook `useStore`. This function is used to fetch phrases for accessibility labels from a store, presumably for internationalization or localization.
- The component returns a `div` element with a class `carousel-button-group`. This `div` contains two buttons (previous and next) which are conditionally rendered based on the carousel's current state.

## Logic

The component's logic primarily revolves around conditionally rendering the navigation buttons and providing accessibility support:

1. **Conditional Rendering**:
    - The "previous" button is rendered only if the `currentSlide` is not the first slide (`currentSlide !== 0`).
    - The "next" button is rendered only if the current slide is not the last slide (`totalItems !== currentSlide + 1`).

2. **Accessibility**:
    - Both buttons use the `aria-label` attribute for accessibility, which is populated by the `getPhrase` function. This function retrieves appropriate labels from the `SitecoreDictionary`, ensuring that the buttons are properly labeled for screen readers.

3. **Event Handling**:
    - The "previous" button has an `onClick` event that triggers the `previous` function passed as a prop.
    - The "next" button has an `onClick` event that triggers the `next` function passed as a prop.

This structure ensures that the carousel is both functional and accessible, adhering to good practices in web development.
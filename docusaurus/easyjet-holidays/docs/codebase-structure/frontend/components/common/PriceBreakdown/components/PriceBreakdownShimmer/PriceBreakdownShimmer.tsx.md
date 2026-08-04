### Imports

The `PriceBreakdownShimmer` component utilizes several imports:

- `FunctionComponent` from `react`: This is used to type the component as a React functional component.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `observer` from `mobx-react`: This is a higher-order component that automatically subscribes the React component to any observables that are used during rendering.
- `useMoreThenMobileViewport` from `frontend/hooks/useMediaQuery`: A custom React hook used to determine if the viewport exceeds a mobile device's width.
- `styles` from `frontend/components/common/PriceBreakdown/PriceBreakdown.module.scss`: Module CSS for styling the component using CSS modules.
- `DATA_TID_PREFIX` from `frontend/components/common/PriceBreakdown/PriceBreakdown.utils`: A constant used for setting `data-tid` attributes for test identification.

### Structure

The `PriceBreakdownShimmer` component is structured as follows:

- It is defined as a React functional component.
- It utilizes a custom hook `useMoreThenMobileViewport` to determine if the rendering should occur based on the viewport size.
- The component returns `null` if the viewport does not exceed mobile width, effectively preventing the component from rendering on smaller devices.
- If the viewport is larger than mobile, it returns a `section` element structured with nested `div` elements. Each of these elements is designed to serve as a placeholder for shimmer effects during data loading states.
- The `section` and its children use `classNames` to combine predefined styles from the imported `styles` object and additional class names like 'placeholder-shimmer'.

### Logic

The component's logic is primarily focused on conditional rendering based on the viewport size:

- **Viewport Check**: At the beginning of the component, the `useMoreThenMobileViewport` hook is called, which returns a boolean indicating whether the viewport width exceeds that of a mobile device.
- **Conditional Rendering**: Based on the boolean value from the hook, the component decides whether to render the shimmer effect or not. If the viewport is not wider than mobile, the component returns `null`, thus not rendering anything.
- **Data Attributes**: The `data-tid` attributes are dynamically generated using the `DATA_TID` constant. This helps in maintaining consistent identifiers for automated testing purposes.
- **Styling and Placeholders**: The component uses CSS modules for styling, specifically designed to handle the shimmer effect (loading placeholders). The use of `classNames` allows combining multiple class names dynamically, facilitating the addition of the 'placeholder-shimmer' class for the shimmer effect alongside other styling classes.

Overall, the `PriceBreakdownShimmer` component is designed to provide a visual placeholder during data loading states on desktop devices, enhancing the user experience by indicating that content will appear soon.
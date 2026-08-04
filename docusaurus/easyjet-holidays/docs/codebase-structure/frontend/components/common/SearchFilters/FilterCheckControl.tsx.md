## Imports

The `FilterCheckControl` component imports several modules and components to manage state, UI rendering, and functionality:

- **React and Component**: Imported from 'react' for building the component using class-based React methodology.
- **classNames**: A utility to conditionally join class names together, imported from 'classnames'.
- **inject, observer**: MobX functionalities to inject stores into the component and make it reactive to state changes, respectively.
- **sanitize**: A utility to sanitize HTML to prevent XSS attacks, imported from 'sanitize-html'.
- **cmsUrls**: An object containing endpoint URLs, specifically used here to fetch media content.
- **MarketStore**: The store that holds the market-related state, such as formatted numbers.
- **TStores, IFilterOption**: TypeScript interfaces for typing props and stores.
- **CalloutOrientation, CalloutPosition, FilterGroupCodes**: Enums to manage callout orientation, position, and filter group codes.
- **Callout, Checkbox, RadioButton**: UI components for displaying callouts, checkboxes, and radio buttons.
- **withRerender**: A higher-order component (HOC) to handle component re-rendering logic.
- **IComponentWithRerenderProps**: Interface for the props injected by the `withRerender` HOC.
- **IconInfoCircle**: A React component that renders an information circle icon.

## Structure

The `FilterCheckControl` is a class-based React component decorated with `@observer` from MobX, making it reactive to changes in observables it uses.

### Properties and Methods:

- **className**: Computed property to dynamically generate class names based on the component's props.
- **getLabel**: Method to construct the label text for the checkbox or radio button, potentially including a count of items.
- **renderTooltip**: Method that conditionally renders a tooltip if the `tooltipText` prop is provided. It uses the `Callout` component for displaying the tooltip.
- **renderCheckboxIcon**: Method to render an icon next to the checkbox if the URL is provided.
- **render**: The main render method of the component that conditionally renders a `RadioButton` or a `Checkbox` wrapped inside a callout tooltip.

### Higher-Order Component Usage:

- **withRerender**: Enhances the component to handle re-rendering logic based on certain conditions.
- **inject**: Injects necessary MobX stores (`appStore` and `marketStore`) into the component, providing methods like `getFormattedNumber` and state like `isScreenLessMedium`.

## Logic

### Conditional Rendering:

- **Checkbox vs. RadioButton**: The component decides whether to render a `Checkbox` or a `RadioButton` based on the `isRadioButton` prop.
- **Tooltip**: A tooltip is rendered if `tooltipText` is provided. The tooltip's content and positioning are managed based on the `groupCode` and other tooltip-related props.
- **Icon**: Icons next to checkboxes are conditionally rendered based on the presence of a URL and the filter group code.

### Data Handling:

- **Label Construction**: The label might include a count next to the filter name/code, which is formatted using `getFormattedNumber` from `MarketStore`. The visibility of the count is controlled by `hideLabelCount` and `hiddenZeroCount` props.
- **Tooltip Content Sanitization**: When the `groupCode` is `HotelTypes`, the tooltip content is sanitized to prevent XSS, and HTML content is set dangerously using `dangerouslySetInnerHTML`.

### Responsive and Accessibility Features:

- **Screen Size Check**: Uses `isScreenLessMedium` to determine if tooltips should be shown based on screen size.
- **Accessibility Features**: Includes roles and descriptive alt texts for better accessibility compliance.

This component efficiently handles various states and conditions to render UI elements dynamically based on the provided props and the application's state managed by MobX stores.
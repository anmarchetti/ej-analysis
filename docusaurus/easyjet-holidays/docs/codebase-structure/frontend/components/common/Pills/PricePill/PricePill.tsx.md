## Imports

The `PricePill` component imports several modules and components to function properly:

- `FC` from `react`: Used to type the functional component.
- `classNames` from `classnames`: A utility to conditionally join class names together.
- `observer` from `mobx-react`: Enhances the component to reactively update when observable data changes.
- `Tooltip`, `TooltipContent`, `TooltipTrigger` from `frontend/components/common/Tooltip`: Custom components to show tooltips.
- `styles` from `./PricePill.module.scss`: Module CSS for styling the `PricePill` component.

## Structure

The `PricePill` component is defined as a functional component using TypeScript. It accepts an `IPricePillProps` interface which specifies the expected props:

- `children`: Content inside the pill (required).
- Various boolean props to control the appearance (`isBlack`, `isGreen`, etc.).
- `className`: Optional additional CSS class for customization.
- `tooltipMessage`: Optional message to display in a tooltip.
- `isTooltipOnRight`: Boolean to position the tooltip on the right.

The component uses the `classNames` utility to conditionally apply CSS classes based on the props provided. These classes control the visual aspects of the pill, like color and size. The `className` prop allows for additional external styling.

## Logic

1. **Class Name Construction**:
   - The `className` variable is constructed using `classNames`. It starts with default classes `price-pill` and `no-print`.
   - Depending on the boolean props, additional modifier classes are added (e.g., `price-pill--small` for `isSmall`).
   - If `tooltipMessage` is provided and `isTooltipOnRight` is true, `price-pill--tooltip-right` is added.

2. **Content Rendering**:
   - `textContent` is a `<span>` element wrapping the `children`, which represents the content of the pill.
   - If `tooltipMessage` is provided, the pill renders a `Tooltip` component containing the `TooltipTrigger` and `TooltipContent` with the message. The `textContent` is shown alongside the tooltip.
   - If there is no `tooltipMessage`, only `textContent` is rendered.

3. **Component Output**:
   - The final output is a `<div>` with combined classes from `className` and `styles.pricePill`. This div contains either the tooltip and text content or just the text content, based on the presence of a `tooltipMessage`.

4. **MobX Integration**:
   - The component is wrapped with `observer` from `mobx-react`, making it reactive to changes in observables that might affect the rendering.

This structure allows the `PricePill` to be a versatile component, adaptable to various visual needs while optionally including interactive tooltips.
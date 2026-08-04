### Imports

The code begins by importing necessary modules and dependencies:

- `React` from the `react` package, which is used to create and manage the component.
- `classNames` from the `classnames` package, a utility that conditionally joins class names together, useful for dynamically setting classes based on component state or props.

### Structure

The component is defined using TypeScript, which introduces types for props to ensure type safety.

#### Interface: `ICardProps`
This interface defines the expected props for the `Card` component:

- `children?`: Optional. It can be of any type. This prop is used to pass child components or elements.
- `className?`: Optional string. This allows custom class names to be passed to the component for additional styling.
- `dataTid?`: Optional string. This is typically used for testing purposes to provide a unique identifier that can be targeted in tests.
- `pseudoBorder?`: Optional boolean. Used to determine if a pseudo border style should be applied.
- `selected?`: Optional boolean. Used to determine if the card is in a selected state.

#### Component: `Card`
A functional component that uses destructuring to extract properties from `ICardProps`. It utilizes the `classNames` function to dynamically generate a string for the `className` attribute based on the component's props:

- A base class `card`.
- An additional class from `props.className` if provided.
- Conditional classes (`card--selected` and `card--pseudo-border`) based on the boolean props `selected` and `pseudoBorder`.

The component returns a `div` element structured as follows:
- Outer `div` with dynamic `className` and `data-tid` attribute if provided.
- Inner `div` with a fixed class `card__inner row g-0` that contains the `children` elements or components.

### Logic

The main logic of the component revolves around the conditional application of CSS classes and the rendering of child elements:

1. **Class Name Construction**: The `classNames` utility is used to construct the class string dynamically. This is based on both the static classes and the conditions derived from the props.
   
2. **Conditional Rendering**: The component conditionally adds classes based on the `selected` and `pseudoBorder` props, allowing for different styles to be applied based on the component's state.

3. **Props Handling**: The component handles optional props (`className`, `dataTid`) gracefully by using them only if they are provided, avoiding any potential runtime errors related to undefined props.

This structure and logic make the `Card` component highly reusable and adaptable to different contexts where varying styles or behaviors are needed based on its state or parent component's instructions.
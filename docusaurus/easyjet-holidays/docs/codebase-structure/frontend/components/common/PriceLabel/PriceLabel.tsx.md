## Imports

The `PriceLabel` component imports several modules and utilities:

- **React Imports**: 
  - `Fragment` and `FunctionComponent` from `react` for component structuring and typing.
- **Utility and Helper Imports**:
  - `classNames` from `classnames` to conditionally join class names together.
  - `usePriceLabels` and `useStore` hooks from `frontend/hooks` for managing state and fetching necessary data.
  - `getLivePriceNumberOfNightsLabel` from `frontend/utils/livePrice.utils` to handle label text based on the number of nights.
- **Type and Style Imports**:
  - `SitecoreDictionary` type from `models/enum/SitecoreDictionary` to define the structure of dictionary props.
  - `style` from `./PriceLabel.module.scss` for styling the component using CSS modules.

## Structure

The `PriceLabel` component is structured as follows:

- **Type Definition (`IPriceLabelProps`)**:
  - Defines the props that `PriceLabel` accepts, including optional and mandatory fields like `price`, `chevronIcon`, `className`, `dataTid`, `numberOfNights`, `onClick`, `priceDictionary`, `tag`, `tooltip`, `wrapLabelAfterPrice`, `wrapLabelBeforePrice`, and `wrapPrice`.
  
- **Functional Component Definition**:
  - The component is defined as a functional component using `FunctionComponent` from React, which takes `IPriceLabelProps` as its type.
  - Inside the component, hooks and utilities are used to fetch and calculate necessary data.

- **JSX Structure**:
  - The component conditionally uses a `<span>` or `Fragment` or a custom `tag` provided as props for the outer wrapper based on the presence of certain props to handle React's limitation with `<Fragment>` not accepting props.
  - The component constructs the price related JSX dynamically based on the props such as `wrapPrice`, `wrapLabelBeforePrice`, and `wrapLabelAfterPrice`.
  - Includes optional elements like `tooltip` and `chevronIcon` if provided.

## Logic

The component's logic can be summarized in the following key functionalities:

- **Phrase Fetching**:
  - Uses the `useStore` hook to fetch phrases from the store, specifically using `layoutStore.getPhrase`.

- **Label Handling**:
  - Utilizes `usePriceLabels` to get labels (`labelBeforePrice` and `labelAfterPrice`) based on the `priceDictionary` prop.
  - Handles the scenario where the number of nights is considered to generate a label before the price using `getLivePriceNumberOfNightsLabel`.

- **Conditional Rendering and Wrapping**:
  - The `Tag` used for the outer element of the component is determined based on the presence of `tag`, `dataTid`, or `className` props. It defaults to `Fragment` if none of these are provided.
  - Props such as `data-tid` and `className` are conditionally applied to the `Tag` if it's not a `Fragment`.
  - Price and labels are optionally wrapped using the provided `wrapPrice`, `wrapLabelBeforePrice`, and `wrapLabelAfterPrice` functions to allow custom component injection around these elements.

- **Event Handling**:
  - An `onClick` handler can be provided and is attached to the outer `Tag` of the component.

This component is highly configurable and designed to be reused in different parts of an application with varying requirements for displaying price information.
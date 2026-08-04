## Imports

The `CabinBagsInfo` component imports several modules and types to handle its functionality and styling:

- **React and Classnames**: 
  - `FC` (Functional Component) from `react` for typing the component.
  - `classNames` is used to conditionally join classNames together.

- **Custom Hooks and Utilities**:
  - `useLuxuryInternalFlight` from `frontend/hooks/useLuxuryInternalFlight` determines if the current flight is a luxury internal flight.
  - `IGuestsAmount` from `frontend/utils/luggage.utils` is a type definition for the structure of guest amounts.
  - `Tokenizer` from `frontend/utils/tokenizer` is used for replacing tokens in strings.

- **Sitecore Models**:
  - `ISitecoreField` and `ISitecoreImage` from `models/sitecore/generic/ISitecoreField` are types for handling Sitecore fields and images.

- **Components**:
  - `JSSImage` from `frontend/components/common/JSSImage` for rendering images managed by Sitecore.
  - `Tooltip`, `TooltipContent`, and `TooltipTrigger` from `frontend/components/common/Tooltip` are components for showing tooltips.

- **Styling**:
  - `styles` from `./CabinBagsInfo.module.scss` for CSS modules specific to this component.

## Structure

The `CabinBagsInfo` component is structured into two main interfaces and one functional component:

- **Interfaces**:
  - `ICabinBagsInfoFields`: Defines the possible fields that can be passed from Sitecore for the component, such as labels and icons.
  - `ICabinBagsInfoProps`: Defines the props that the `CabinBagsInfo` component accepts, including the number of bags, guest amounts, and various optional flags and styling options.

- **Functional Component**:
  - `CabinBagsInfo`: This is a functional component that uses destructuring to extract properties from its props. It calculates labels based on the number of guests and whether the flight is a luxury internal one, and conditionally renders JSX based on the props and calculated values.

## Logic

The component's logic primarily revolves around conditional rendering and dynamic content based on props and hooks:

- **Flight Type Check**:
  - Uses the `useLuxuryInternalFlight` hook to determine if the flight is a luxury internal one, which affects how many bags are considered.

- **Token Replacement**:
  - Utilizes the `Tokenizer` utility to dynamically replace tokens in strings with actual numbers based on the guests' data.

- **Conditional Rendering**:
  - The component conditionally renders icons and labels based on the `hideIcon` prop and the number of bags calculated.
  - It also optionally displays a tooltip if `showSpeedyBoardingTooltip` is true and the tooltip content is available.

- **Dynamic Class Assignment**:
  - Uses `classNames` to dynamically assign CSS classes for styling based on the component's state and props, such as hiding elements when no bags are added.

The logic within the component ensures that the UI correctly reflects the state of the flight and guest data, providing users with accurate and useful information about their cabin bags.
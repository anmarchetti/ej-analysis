## Imports

The `DestinationInfoBlock` component in React utilizes a variety of imports to function properly:

- **React Essentials**: Imports `FunctionComponent`, `useCallback`, and `useState` from `react` for creating functional components and managing state and lifecycle features.
- **Sitecore JSS**: Imports `Placeholder` from `@sitecore-jss/sitecore-jss-nextjs` for rendering dynamic placeholders in a Sitecore JSS application.
- **Custom Hooks and Stores**: Utilizes `useStore` from `frontend/hooks/useStore` to access the application's store for retrieving global state.
- **Type Definitions and Enums**: 
  - Imports `TStores` from `frontend/store/IStores` for typing the store.
  - Imports enums like `TextPosition` and `TitleFontStyle` from `models/enum/CustomisableComponentsParameters` to manage text styling and positioning.
  - Imports `PlaceholderNames` for consistent referencing of placeholder names throughout the application.
- **Sitecore Models**: 
  - Imports interfaces like `ISitecoreComponent` and `ISitecoreField` for typing Sitecore components and fields.
  - Imports `TSitecoreCheckboxValue` for typing checkbox values specifically in Sitecore.
- **Components**: 
  - Imports `InspireMePopup` from `frontend/components/common/InspireMePopup/InspireMePopup` for rendering a specific popup component.
  - Imports `TextBlock` from `frontend/components/renderings/TextBlock` to display text content.
- **Styling**: Imports CSS module `styles` from `./DestinationInfoBlock.module.scss` to apply scoped styles to the component.

## Structure

The `DestinationInfoBlock` component is structured as follows:

- **Component Definition**: Defined as a functional component using TypeScript generics to enforce type safety on props, which include Sitecore component fields and parameters.
- **Interfaces**:
  - `IDestinationInfoBlocParameters`: Defines optional parameters for the component, such as `EnableSeoReadMoreText`.
  - `IDestinationInfoBlockFields`: Defines the fields expected in the component, like `Description` and `Title`.
- **State Management**: Uses the `useState` hook to manage the `needToKnowHeight` state, which stores the height of a particular HTML element.
- **Ref Callback**: Implements `useCallback` to create a `measuredRef` callback ref that updates `needToKnowHeight` based on the scroll height of the referenced element.
- **Rendering Logic**:
  - The main `div` uses the CSS class `destinationInfoBlock` for styling.
  - A nested `div` with class `wrapper` contains the main content, including a `TextBlock` and optionally a `Placeholder` and `InspireMePopup`.

## Logic

The component's logic can be summarized as follows:

- **Store Access**: Uses the `useStore` hook to determine if the current portal is a trade portal by accessing `isTradePortal` from the global store.
- **Dynamic Placeholder Rendering**: Conditionally renders a `Placeholder` component if the `NeedToKnow` placeholder has content. This placeholder uses `measuredRef` to measure and store its height.
- **Conditional Popup Display**: The `InspireMePopup` component is conditionally rendered based on the `isTradePortal` flag, ensuring it is not displayed in trade portal scenarios.
- **TextBlock Configuration**: The `TextBlock` component is rendered with specific props derived from the `fields` and `params` of the `DestinationInfoBlock` component, alongside dynamic styling and positioning configurations.
- **Height Measurement and State Update**: The height of the `NeedToKnow` placeholder is dynamically measured and stored using `useState`, allowing for responsive adjustments based on content size.

This technical documentation outlines the key functionalities and structure of the `DestinationInfoBlock` component, emphasizing its integration within a Sitecore-powered React application.
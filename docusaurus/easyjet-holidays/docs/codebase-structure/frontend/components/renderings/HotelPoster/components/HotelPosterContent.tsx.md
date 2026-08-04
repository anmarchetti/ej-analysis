## Imports

The `HotelPosterContent` component makes use of several imports:

- **React and MobX**: 
  - `{ FC }` from `'react'`: Importing FC (Function Component) type from React for type-checking the component.
  - `{ observer }` from `'mobx-react'`: Used to wrap the component to automatically track observable state changes in MobX stores.

- **Utility and Hooks**:
  - `useStore` from `'frontend/hooks/useStore'`: Custom hook for accessing MobX stores.
  - `{ Tokenizer }` from `'frontend/utils/tokenizer'`: Utility for replacing tokens in strings.

- **Components and Icons**:
  - `ErrorMessage` from `'frontend/components/common/ErrorMessage'`: A component to display error messages.
  - `IconInfoCircle` from `'frontend/components/icons/InfoCircle'`: An icon component used in the error message display.

- **Types and Layout**:
  - `{ Tokens }` from `'code/tokens'`: Enum or object containing token definitions used in token replacement.
  - `{ IHotelPosterProps }` from `'frontend/components/renderings/HotelPoster/HotelPoster'`: TypeScript interface defining the props structure for the component.
  - `HotelDetailsLayout` from `./HotelDetailsLayout`: A layout component that structures the detailed view of the hotel poster.

## Structure

The `HotelPosterContent` component is a functional component that uses TypeScript for prop type validation. It accepts `IHotelPosterProps` as props which include various fields related to hotel details and branding logos. The component structure is as follows:

- **Props**: The component accepts several props:
  - `fields`: Contains sub-fields like `RoundUpTitle` and `RoundUpDescription`.
  - `posterId`, `hasEjLogo`, `hasUMLogo`, `logoImage`, `UMLogoImage`, `posterFields`: Various identifiers and images for customizing the hotel poster.

- **Hooks**:
  - `useStore`: This hook is used to extract `totalPricePPWithTouristTax` from the MobX store.

- **Conditional Rendering**:
  - The component first checks if `fields` is not present, and if so, returns `null`.
  - It calculates whether an error message should be shown based on the total price and round-up fields.

- **Main Rendering**:
  - An error message component conditionally rendered based on certain conditions.
  - `HotelDetailsLayout` is rendered with all the necessary props passed down to it.

## Logic

- **Price Calculation**:
  - The `totalPricePPWithTouristTax` is retrieved from the store and used to determine the whole part of the price using `Math.floor`.
  - A check is performed to see if the total price is not an integer and if both `RoundUpTitle` and `RoundUpDescription` are available to decide if the rounding error message should be displayed.

- **Error Message Handling**:
  - If the conditions are met (price needs rounding and titles are available), an `ErrorMessage` component is displayed. This component uses the `Tokenizer` utility to replace a placeholder token in `RoundUpDescription` with the actual price.
  - The `IconInfoCircle` is passed to the `ErrorMessage` as an icon prop.

- **Content Layout**:
  - Regardless of the error message, the `HotelDetailsLayout` is rendered with all necessary props that control the visual presentation of the hotel details.

The component is wrapped with `observer` from MobX, which ensures that it reacts to changes in observable properties used within the component, specifically `totalPricePPWithTouristTax` from the MobX store. This makes the component reactive and efficient in updating the UI in response to state changes in the MobX store.
## Imports

The `LuggageInfo` component utilizes several imports from different sources:

- **React and Sitecore JSS**: 
  - `FC` from `react` is imported to type the component as a functional component.
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` is used to render text fields managed by Sitecore.

- **Classnames Utility**:
  - `classnames` is a utility to conditionally join classNames together, used here to handle dynamic className assignments.

- **Custom Hooks and Models**:
  - `useLuxuryInternalFlightDefaultBagsLabel` is a custom hook imported from `frontend/hooks/useLuxuryInternalFlight` to retrieve labels for luxury internal flights based on the number of guests with hold luggage.
  - `IExtraLuggageContent` and `ILuggageInfoItem` interfaces are imported from `models/data/IFlightExtras` to type the props related to luggage information.
  - `ISitecoreField` interface from `models/sitecore/generic/ISitecoreField` is used to type the Sitecore managed fields.

- **Utility Functions**:
  - `getLuggageInfoItems` is imported from `./LuggageInfo.utils` and is used to compute the list of luggage-related information items to be displayed.

- **Styling**:
  - SCSS module from `./LuggageInfo.module.scss` is imported to apply styles to the component.

## Structure

The `LuggageInfo` component is structured as follows:

- **Interfaces**:
  - `ILuggageInfoFields` defines the shape of the Sitecore fields expected in the props.
  - `ILuggageInfoProps` defines the overall properties that the component accepts.

- **Functional Component**:
  - `LuggageInfo`: A functional component that accepts `ILuggageInfoProps` as props. It uses destructuring to extract fields and other properties from the props object.

- **JSX Structure**:
  - The component returns a JSX structure wrapped in a `div` with a `data-cs-mask` attribute.
  - Inside, it conditionally renders a `Text` component for the title (if `hideTitle` is false) and iterates over `items` to render individual luggage information lines.

## Logic

- **Default Values and Destructuring**:
  - Fields like `LuggageInfoTitle`, `PramName`, and `SportEquipmentsLabel` are destructured with fallbacks to handle cases where they might be undefined.

- **Custom Hook Usage**:
  - `useLuxuryInternalFlightDefaultBagsLabel` is invoked with `guestWithHoldLuggage` to get a label based on the number of guests.

- **Data Transformation**:
  - `getLuggageInfoItems` is called with an object containing all necessary data to compute the luggage information items. This includes labels, numbers of infants, default bags, and extra luggage information.

- **Conditional Rendering**:
  - The title of the component is conditionally rendered based on the `hideTitle` prop.
  - The dynamic class name for the title is managed using the `classnames` library, combining the default style with any custom class provided via `titleClassName`.

- **Mapping Over Data**:
  - The `items` array (obtained from `getLuggageInfoItems`) is mapped to render each line of luggage information, with a unique `key` and `data-tid` for each item for tracking and testing purposes.
## Imports

In this section of the code, various modules and components are imported to be used within the `HotelConfirmationCTA` component:

- `FunctionComponent` from `react`: Used to type the functional component.
- `classNames` from `classnames`: A utility function for conditionally joining class names together.
- `useStore` from `frontend/hooks/useStore`: A custom hook for accessing the Redux store state.
- `IHolidaysStores` from `frontend/store/holidays`: An interface that defines the type structure for the holidays-related stores.
- `SitecoreDictionary` from `models/enum/SitecoreDictionary`: Enumerations for Sitecore dictionary keys to maintain consistent referencing across the application.
- `Button` from `frontend/components/common/Button`: A reusable button component.
- `styles` from `./HotelConfirmationCTA.module.scss`: Module CSS for styling the `HotelConfirmationCTA` component.

## Structure

The `HotelConfirmationCTA` component is defined as a functional component using TypeScript. It accepts props of type `IHotelConfirmationCTAProps`, which includes:

- `dataTid`: a string that likely serves as a 'data-testid' for testing purposes.
- `className`: an optional string that allows for custom styling classes to be applied.

The component structure is straightforward, consisting of a single `Button` component wrapped within the functional component definition.

## Logic

The component utilizes the `useStore` hook to extract two specific methods from the store:

- `getPhrase`: A method from `layoutStore` that is used to retrieve specific phrases or text based on keys from the Sitecore dictionary. This is used to dynamically set the button text.
- `confirmChosenHotel`: A method from `amendHotelStore` that likely triggers an action to confirm the selection of a hotel.

The `Button` component is rendered with the following props:
- `className`: Combines the default styles defined in `HotelConfirmationCTA.module.scss` with any custom classes passed via the `className` prop using the `classNames` utility.
- `dataTid`: Passed directly to the `Button` for testing purposes.
- `onClick`: Set to the `confirmChosenHotel` method, which is triggered when the button is clicked.

The button's children (the visible text) is set by calling `getPhrase` with `SitecoreDictionary.GlobalsButtonsContinue` as an argument, which fetches the appropriate phrase from the Sitecore dictionary to be displayed as the button text. This approach ensures that the text can be easily managed and localized through Sitecore.
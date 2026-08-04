## Imports
The `AmendDatesSummaryFooter` component relies on various imports to function properly:

- **classnames**: A utility function to conditionally join classNames together.
- **mobx-react**: Provides the `observer` function to enable reactive components that update automatically when observable data changes.
- **useStore**: A custom hook from `frontend/hooks/useStore` used to access MobX stores.
- **IHolidaysStores**: A TypeScript interface from `frontend/store/holidays` that defines the shape of the store object related to holiday functionalities.
- **getAmendmentRoundedPrice**: A utility function from `frontend/utils/amendBooking.utils` that processes price rounding logic.
- **ISitecoreField**: A TypeScript interface from `models/sitecore/generic/ISitecoreField` that defines a generic structure for Sitecore fields.
- **datesStyles** and **styles**: CSS modules for styling the component, imported from respective SCSS files.
- **AmendDatesSummaryContinueBtn**: A React component that represents a continue button, used within the footer component.

## Structure
The `AmendDatesSummaryFooter` component is structured as follows:

- **IAmendDatesSummaryFooterProps**: This TypeScript interface defines the props expected by the `AmendDatesSummaryFooter` component, specifically a `priceLabel` of type `ISitecoreField<string>`.
- **AmendDatesSummaryFooter Functional Component**:
  - The component uses the `useStore` hook to extract `amendmentDatesCharges` and `formatMoney` functions from the relevant stores.
  - Conditional rendering is implemented to return `null` if `amendmentDatesCharges` is undefined, indicating no data to display.
  - The price is calculated using the `getAmendmentRoundedPrice` utility function and formatted using `formatMoney`.
  - The JSX structure includes a `<div>` container with nested `<span>` elements to display the price label and the formatted price, and the `AmendDatesSummaryContinueBtn` component for navigation.

## Logic
- **Data Handling**:
  - The `useStore` hook is utilized to access MobX stores, specifically `amendDatesStore` for charge data and `marketStore` for currency formatting capabilities.
  - The component checks if `amendmentDatesCharges` is available. If not, it renders `null`, effectively hiding the component when there is no data.
- **Price Calculation**:
  - The `getAmendmentRoundedPrice` function calculates the rounded price based on the charges.
  - The `formatMoney` method from the `marketStore` is used to format the price appropriately, considering localization aspects like currency symbols and decimal places.
- **Styling and Layout**:
  - The component uses CSS modules for styling, ensuring that styles are scoped locally to the component and do not leak to other parts of the application.
  - The `classNames` utility is used to combine multiple class names dynamically, enhancing the ability to conditionally apply styles based on the component's state or props.
- **Reactivity**:
  - The component is wrapped with `observer` from `mobx-react`, which makes it reactive to changes in MobX store state, ensuring that it re-renders whenever relevant store data changes.
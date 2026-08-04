## Imports

The `PaymentOptionsFull` component imports several modules and utilities to function properly:

- `React, { FC }`: Imports React and the Function Component type (`FC`) from the React library.
- `observer`: Imported from `mobx-react` to make the React component reactive to MobX state changes.
- `Tokens`: An enumeration or constant that stores token values, imported from `code/tokens`.
- `useStore`: A custom hook for accessing MobX stores, imported from `frontend/hooks/useStore`.
- `IHolidaysStores`: Interface representing the structure of holiday-related stores, imported from `frontend/store/holidays`.
- `Tokenizer`: A utility for replacing tokens in strings, imported from `frontend/utils/tokenizer`.
- `SitecoreDictionary`: An enumeration or dictionary for Sitecore-specific strings, imported from `models/enum/SitecoreDictionary`.
- `PaymentBaseOption`: A React component that displays a payment option, imported from `frontend/components/common/PriceOptions/PaymentBaseOption/PaymentBaseOption`.
- `RichTextWithLinks`: A React component for displaying rich text with links, imported from `frontend/components/common/RichTextWithLinks`.
- `IPaymentPageFields`: Interface representing the expected fields for payment pages, imported from `frontend/components/renderings/AmendPayment/interfaces`.

## Structure

The `PaymentOptionsFull` component is defined as a functional component using React's Function Component (`FC`) type. It accepts props of type `IPaymentOptionsFullProps`, which include:

- `isSelected`: A boolean indicating if the payment option is currently selected.
- `fields`: An optional property that should conform to the `IPaymentPageFields` interface, containing various text fields related to payment options.
- `onChange`: An optional function that is called when the payment option selection changes.

Inside the component, the `useStore` hook is utilized to extract necessary data from MobX stores:

- `getPhrase`: A method for retrieving phrases based on keys.
- `totalPrice`: The total price from the `amendPaymentStore`.
- `currency`: The currency information from the `amendPaymentStore`.
- `isPayingFeesOnly`: A boolean indicating whether only fees are being paid.
- `formatMoney`: A method for formatting money values.

## Logic

The component first determines the description to be used based on whether only fees are being paid (`isPayingFeesOnly`). It then formats the total price using the `formatMoney` method.

The `Tokenizer.replaceToken` utility is used to replace a placeholder token (`Tokens.Amount`) in the description with the formatted price, which is wrapped in a `<strong>` tag with a `data-cs-mask` attribute for styling or scripting purposes.

The component renders a `PaymentBaseOption` component with various props:

- `checkboxId`: A fixed ID for the checkbox input element.
- `title`: The title for the payment option, which defaults to an empty string if not provided.
- `isSelected`: Passed through from the component's props to indicate if the option is selected.
- `onChange`: The handler for when the selection state changes.
- `price`: The total price or 0 if not provided.
- `priceDescription`: A phrase retrieved from `getPhrase` using a key from `SitecoreDictionary`.
- `currency`: The currency information.

Within the `PaymentBaseOption`, a `RichTextWithLinks` component is used to render the description with the replaced token, applying the class `credit-description` for styling.
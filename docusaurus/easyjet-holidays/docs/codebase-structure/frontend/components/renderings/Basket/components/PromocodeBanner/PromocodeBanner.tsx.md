## Imports

The `PromocodeBanner` component uses a variety of imports from different sources:

- **React and React-related imports:**
  - `React, { FC, FormEvent }` from 'react': Standard React imports for functional components and form event handling.
  - `Text` from '@sitecore-jss/sitecore-jss-nextjs': A component provided by Sitecore JSS for rendering text fields from Sitecore.

- **Custom hooks and utilities:**
  - Several hooks (`usePriceLabels`, `useStore`) and utility functions (`getDiscount`, `getDiscountPerPerson`) are imported from the `frontend` directory. These are presumably custom hooks and utilities specific to the application's front-end logic.

- **Services:**
  - `creditManagementService` from 'frontend/services/creditManagement.service': A service module for managing credit or voucher validations.

- **Store and model utilities:**
  - `isHolidayStore` from 'frontend/store/holidays': A utility to check if the current store context is related to holidays.
  - `Tokenizer` from 'frontend/utils/tokenizer': A utility for replacing tokens in strings.
  - `ApiError` from 'models/data/ApiError': A model representing API error responses.
  - Enums and interfaces from 'models/enum' and 'models/sitecore': These provide typed structures for handling data specific to Sitecore and the application.

- **Styling:**
  - `styles` from './PromocodeBanner.module.scss': Module CSS for styling the `PromocodeBanner` component.

## Structure

The `PromocodeBanner` component is a functional React component that utilizes TypeScript for prop type definitions. The component accepts `IPromocodeBannerProps` which includes optional `buttonLabel` and `text` fields, both of which are expected to be Sitecore fields.

The component's structure is primarily focused around conditional rendering and a button that triggers a promotional code application process. If certain conditions are not met (like being on the extras page or having necessary text and labels), the component renders `null`.

## Logic

The component's logic can be broken down into several key areas:

- **State and Context Management:**
  - The `useStore` hook is used extensively to manage and access various states and functionalities related to the application's store management. This includes checking if the current page is an extras page, managing promotional codes, and handling currency formatting.

- **Conditional Rendering:**
  - The component checks multiple conditions to decide if it should render or return `null`. This includes checks on whether it's the extras page, if required texts are available, and if the promotion should be displayed on the extras page.

- **Promotional Code Application:**
  - The `onApplyPromo` function handles the logic for applying a promotional code. It checks if a promotion is already being applied, prevents default form submission, handles API errors, and determines the type of voucher being applied (promo or gift). It interacts with the `creditManagementService` to validate voucher codes.

- **Discount Calculation:**
  - It calculates the discount to display using `getDiscountPerPerson` or `getDiscount`, depending on the data available. It then uses the `Tokenizer` to replace tokens in the text content with the calculated discount.

- **Event Handling:**
  - The component includes an `onClick` handler for the button that triggers the `onApplyPromo` function, managing the application of the promotional code based on user interaction.

This component is a good example of a complex interaction between React functional components, custom hooks, global state management, and asynchronous API interactions, all while maintaining a clear separation of concerns and modular code structure.
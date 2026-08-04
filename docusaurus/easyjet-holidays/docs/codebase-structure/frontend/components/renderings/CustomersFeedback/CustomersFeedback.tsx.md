## Imports

The `CustomersFeedback` component relies on several imports from various libraries and internal modules:

- **React and React Hooks**: Imports `FC` (Function Component) and `useEffect` from React to create functional components and manage side-effects, respectively.
- **React Intersection Observer**: Uses `useInView` to determine if an element is within the viewport.
- **Sitecore JSS**: Imports `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering text fields from Sitecore.
- **MobX**: Uses `observer` from `mobx-react` to make the component reactive to state changes in MobX stores.
- **Local Utilities and Hooks**:
  - `Tokens` for accessing predefined constants.
  - `useMobileViewport` to check if the current viewport matches mobile dimensions.
  - `useStore` for accessing MobX stores.
  - `isGUIDWithoutDashes` and `Tokenizer` for string manipulation.
- **Models**: Imports various types for type-checking and defining component props.
- **Components**:
  - `JSSImageNext` and `RichTextWithLinks` for rendering images and rich text.
  - `RouterLink` for navigation.
  - `CustomersFeedbackCarousel` and `StarRatingNew` as sub-components for specific UI functionalities.
- **Styles**: Imports CSS module styles from `./CustomersFeedback.module.scss`.

## Structure

The `CustomersFeedback` is a functional component that uses TypeScript for type annotations. It takes `ICustomersFeedbackFields` as props, which define the expected structure of the Sitecore fields:

- **Field Definitions**: Fields like `Title`, `SubTitle`, `Description`, `Logo`, `Link`, and `Disclaimer` are defined in the interface `ICustomersFeedbackFields`.
- **Type Definitions**: Uses `ISitecoreComponent` generic type to ensure the component props include Sitecore field types.
- **Component Logic**:
  - Uses `useInView` for lazy loading or triggering animations when the component comes into the viewport.
  - Uses custom hooks `useMobileViewport` and `useFeedbacksStore` to fetch and manage state related to feedback reviews.
  - Conditionally renders child components and elements based on the data fetched and viewport size.

## Logic

The component's logic is primarily focused on fetching and displaying customer feedback:

- **Data Fetching**:
  - On component mount, if reviews are enabled (`isFeefoEnabled`), it fetches customer reviews based on the viewport size (either mobile or desktop).
  - Uses `useEffect` to handle side-effects related to fetching data and tracking when the component enters the viewport.
- **Conditional Rendering**:
  - Returns `null` if no fields are provided, reviews are not enabled, there's an error, or there are no reviews.
  - Maps over `feedbackData.reviews` to adjust customer names using `isGUIDWithoutDashes` utility.
  - Dynamically adjusts the size of the logo based on whether the viewport is mobile or not.
- **Event Handling**:
  - `trackCTALinkClick` function to handle click events on the call-to-action link, which tracks customer feedback interactions.
- **Sub-components Usage**:
  - `CustomersFeedbackCarousel` for displaying reviews in a carousel format.
  - `StarRatingNew` for displaying a star rating based on average review scores.
- **Styling and Accessibility**:
  - Uses CSS modules for styling.
  - Includes `data-tid` attributes for testing purposes.

The component is wrapped with `withFeedbacksStore` to inject the feedback store and `observer` to make it reactive to MobX state changes.
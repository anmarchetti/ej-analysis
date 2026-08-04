### Imports

The `IframeHolidaysHeader` component imports various modules and utilities to function properly:

- **React Imports:**
  - `FC` (Function Component) and `useMemo` from `react` for creating functional components and memoizing values respectively.
  
- **Sitecore JSS:**
  - `RichText` from `@sitecore-jss/sitecore-jss-nextjs` for rendering rich text fields from Sitecore.
  
- **MobX:**
  - `observer` from `mobx-react` to make the component reactive to MobX state changes.
  
- **Local Imports:**
  - `Tokens` from `code/tokens` for accessing token definitions used in text replacements.
  - `useStore` custom hook from `frontend/hooks/useStore` for accessing MobX stores.
  - Various utilities from `frontend/utils` like `date.utils` for date formatting and `tokenizer` for replacing tokens in strings.
  - Enums and models from `models` directory to type-check data and manage constants.
  - Component-specific styles from `./IframeHolidaysHeader.module.scss`.

### Structure

The `IframeHolidaysHeader` component is structured as follows:

- **Type Definitions:**
  - `IIframeHolidaysHeaderFields` defines the expected shape of the `fields` prop, specifically for `CityBreakTitle`, `Subtitle`, and `Title`, each being an object adhering to the `ISitecoreField` interface.
  - `TIframeHolidaysHeaderProps` extends `ISitecoreComponent` with `IIframeHolidaysHeaderFields` to type the props of the component.
  
- **Functional Component:**
  - `IframeHolidaysHeader` is a functional component typed with `TIframeHolidaysHeaderProps`. It uses the `useStore` hook to derive necessary state from MobX stores and computes the subtitle based on various conditions using `useMemo`.
  
- **Conditional Rendering:**
  - The component conditionally renders based on the presence of `fields` and the type of offers (checking if all offers are city breaks).
  - Renders a `RichText` component for the title and optionally for the subtitle if it exists.

### Logic

The core functionality of `IframeHolidaysHeader` involves:

- **State Extraction:**
  - Extracts necessary pieces of state such as offers, date ranges, and guest quantities from MobX stores using the `useStore` hook.
  
- **Subtitle Computation:**
  - Uses `useMemo` to compute the subtitle only when relevant dependencies change. This involves formatting dates, calculating the difference in days (nights), and fetching appropriate labels for nights and people count based on their quantities. Tokens in the subtitle template are replaced with actual values using the `Tokenizer`.
  
- **Conditional Content Logic:**
  - Determines whether to use `CityBreakTitle` or `Title` based on whether all offers are city breaks.
  
- **Rendering:**
  - The component renders a `div` containing a `RichText` element for the title and optionally for the subtitle. It uses the `header` class from its SCSS module for styling and sets data attributes for testing purposes (`data-tid`).

The component is wrapped with `observer` from MobX, making it reactive to changes in the MobX state tree that affect the rendered output.
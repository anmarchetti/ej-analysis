## Imports

The code imports various modules and components which are grouped into React-specific, utility functions, models, components, and CSS styles:

- **React-specific**:
  - `FunctionComponent`, `useEffect`, `useState` from `react` for creating functional components and handling component lifecycle and state.
  - `observer` from `mobx-react` for making the component reactive to MobX state changes.

- **Sitecore and JSS**:
  - `Text` from `@sitecore-jss/sitecore-jss-nextjs` for rendering Sitecore managed text fields.

- **Utilities and Hooks**:
  - `classNames` for conditionally joining class names together.
  - `DATE_FORMATS` from `code/dates` for date formatting constants.
  - `useAgentLogo` and `useStore` custom hooks from `frontend/hooks` for accessing common functionality and store state.

- **Models**:
  - Various interfaces from `models` directory to type-check the data used in components such as `IPrintPreviewFields`, `ISitecoreComponent`, `ISitecoreField`, and `ISitecoreLink`.

- **Components**:
  - `Button`, `Poster`, `Tooltip`, `TooltipContent`, `TooltipTrigger` from `frontend/components/common` for UI elements.
  - `ExtrasLayout` from a local directory for a specific sub-component layout.

- **Styles**:
  - `styles` from `./ExportHolidayDetails.module.scss` for component-specific styling.

## Structure

The component structure is defined with TypeScript interfaces to ensure proper typing and to enhance code reliability and maintainability:

- **Interfaces**:
  - `IExportHolidayDetailsFields` and `IExportHolidayQuoteFields` extend from existing interfaces to include additional fields specific to the component.
  - `IHotelPosterProps` extends the `ISitecoreComponent` with additional properties like `id`.

- **Main Components**:
  - `ExportHolidayDetails` is a functional component that wraps the content in a `Poster.Root` component.
  - `ExportHolidayDetailsContent` is the main functional component that utilizes hooks for state and effects, and conditionally renders UI elements based on the data provided and state changes.

## Logic

The component logic revolves around state management, conditional rendering, and data handling:

- **State and Effects**:
  - `useEffect` is used to update `offerTimestamp` state with the current timestamp whenever the component mounts.
  - `useState` manages the `offerTimestamp` which captures the timestamp when the offer details were last updated.

- **Data Handling**:
  - `useStore` is used to extract methods and state from the MobX store, such as phrases for localization, hotel information, and selected offer details.
  - `useAgentLogo` is a hook to get the agent logo image.

- **Conditional Rendering**:
  - The component checks for the existence of necessary data like `fields`, `hotelInfo`, and `offer` to decide if the UI should render or return `null`.
  - Various checks on `accom`, `images`, and `name` to ensure all necessary data is present before rendering.

- **Dynamic Classes and Text**:
  - `classNames` is used to dynamically assign classes to the `Button` component.
  - `Text` components from Sitecore JSS are used to render text fields managed in Sitecore, ensuring that content changes in the CMS reflect immediately in the UI without code changes.

- **Error Handling**:
  - An error information object `errorInfo` is prepared and passed to `Poster.Error` for displaying error messages conditionally based on the data availability and API responses.

This detailed breakdown encapsulates the imports, structure, and logic of the `ExportHolidayDetails` component, highlighting its dependencies, architecture, and functional behavior within a React and Sitecore-powered application.
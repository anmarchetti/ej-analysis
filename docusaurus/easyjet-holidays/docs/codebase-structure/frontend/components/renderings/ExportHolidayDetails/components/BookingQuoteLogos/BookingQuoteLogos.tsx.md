### Imports

The code begins by importing necessary modules and components:

- `Fragment` and `FunctionComponent` from `react` are used for creating functional components and returning multiple elements.
- `Text` from `@sitecore-jss/sitecore-jss-nextjs` is used for rendering text fields managed by Sitecore JSS.
- `ISitecoreField` and `ISitecoreImage` interfaces from `models/sitecore/generic/ISitecoreField` define the types for Sitecore fields and images.
- `JSSImage` from `frontend/components/common/JSSImage` is a component for rendering images using Sitecore JSS.
- `IExportHolidayQuoteFields` from `frontend/components/renderings/ExportHolidayDetails/ExportHolidayDetails` represents the specific fields required from the Sitecore component.
- `styles` from `./BookingQuoteLogos.module.scss` includes CSS modules for styling the component.

### Structure

The component `BookingQuoteLogos` is defined with the following properties in the `IBookingQuoteLogosProps` interface:

- `dateText`: A `string` representing the date.
- `extraLogo`: An optional `ISitecoreField<ISitecoreImage>` for an additional logo.
- `fields`: An object of type `IExportHolidayQuoteFields` containing fields from Sitecore.
- `hasEjLogo`: A `boolean` indicating if the EasyJet logo should be displayed.
- `hasUMLogo`: A `boolean` indicating if the UM logo should be displayed.
- `logoImage`: An optional `ISitecoreField<ISitecoreImage>` for the main logo.
- `timeText`: A `string` representing the time.
- `UMLogoImage`: An optional `string` URL for the UM logo image.
- `agentName`: An optional `string` representing the name of the agent.

The component uses a functional component approach with destructured props. It includes conditional rendering based on the presence of logos and agent name.

### Logic

The component's logic is focused on rendering logos and text based on the provided props:

- The main logo (`logoImage`) is conditionally rendered based on `hasEjLogo` and whether the `logoImage` has a valid source.
- The UM logo is conditionally rendered based on `hasUMLogo` and the presence of `UMLogoImage`.
- The quote text combines `agentName`, `dateText`, and `timeText` to form a string displayed under the logos.
- The `YourHolidayQuoteLabel` from `fields` is used to display a label or title for the quote, rendered using the `Text` component.
- An additional logo can be rendered if `extraLogo` is provided and has a valid source.
- The component uses fragments (`<Fragment>`) to group the list of children without adding extra nodes to the DOM.

This structure and logic allow the component to be flexible and reusable in different parts of the application where similar display logic for booking quotes is required. The use of CSS modules ensures that styles are scoped to the component, preventing style leakage.
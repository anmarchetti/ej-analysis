## Imports

The `HeroBannerMultiMessage` component imports several modules and components to be utilized within its structure:

- **React Components and Hooks:** 
  - `FunctionComponent` from `react` is imported to type the functional component.
  
- **Type Definitions:**
  - `IHeroBannerFields` from `models/data/IHeroBannerFields` specifies the structure of the fields expected in the hero banner.
  - `ISitecoreField` and `ISitecoreLink` from `models/sitecore/generic/ISitecoreField` define the generic Sitecore field types.
  - `ISitecorePersonalizeExperimentBase` from `models/sitecore/ISitecorePersonalizeExperiment` provides the structure for personalization experiments in Sitecore.

- **Components:**
  - `CreditAnchor` from `frontend/components/common/CreditAnchor/CreditAnchor` is a component used for rendering a credit link or anchor.
  - `BoxWithRoundel` from `frontend/components/renderings/GenericHeroBanner/components/BoxWithRoundel/BoxWithRoundel` is a component used to display content within a styled box.
  - `HeroBannerImages` from `frontend/components/renderings/GenericHeroBanner/components/HeroBannerImages/HeroBannerImages` handles the rendering of images in the hero banner.

- **Styling:**
  - `styles` from `./HeroBannerMultiMessage.module.scss` imports module-specific styles.

## Structure

The `HeroBannerMultiMessage` component is structured as follows:

- **Props Definition (`IHeroBannerHeroBannerMultiMessageProps`):**
  - `experiment`: An object of type `ISitecorePersonalizeExperimentBase`.
  - `fields`: An object of type `IHeroBannerFields`.
  - `onClick`: A function to handle click events, accepting mouse or keyboard events, a Sitecore link field, and an optional position string.

- **Component Definition:**
  - The component is defined as a functional component using the `FunctionComponent` type from React, with props typed by `IHeroBannerHeroBannerMultiMessageProps`.

- **Internal Logic:**
  - The component destructures various fields from the `fields` prop to be used in different parts of the hero banner.
  - It constructs two additional sets of fields (`secondBoxFields` and `thirdBoxFields`) by modifying some of the properties from the original `fields` prop, to be passed to the `BoxWithRoundel` components.

- **JSX Structure:**
  - The main wrapper div contains two primary divs: `blocksWrapper` for the content boxes and `creditWrapper` for the credit anchor.
  - Inside `blocksWrapper`, three `BoxWithRoundel` components are rendered: one main box and two secondary boxes, each receiving specific field sets and the same `experiment` and `onClick` handler.
  - `HeroBannerImages` component is used within the first box to display primary and mobile-specific images.

## Logic

The functional logic of the `HeroBannerMultiMessage` component involves:

- **Props Manipulation:**
  - Creating modified versions of the original `fields` prop to accommodate different content for the second and third boxes in the hero banner.

- **Event Handling:**
  - The `onClick` function is passed down to each `BoxWithRoundel` component to handle user interactions.

- **Conditional Rendering:**
  - The `isMainBox` and `isSecondaryBox` props in `BoxWithRoundel` components dictate specific styling and behavior, differentiating the main content box from the secondary ones.

- **Styling Application:**
  - CSS modules are used for styling specific parts of the component, ensuring that styles are scoped locally to the component, which enhances maintainability and reduces the likelihood of style conflicts.

This component effectively demonstrates a pattern of prop manipulation and component composition in React, along with integration of Sitecore-specific data structures and handling personalization experiments.
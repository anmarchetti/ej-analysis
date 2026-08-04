## Imports

The `HotelDropdown` component utilizes several imports from various sources:

1. **React Import**:
   - `FunctionComponent` from `react` is imported to define the component's type.

2. **Sitecore JSS Import**:
   - `Text` from `@sitecore-jss/sitecore-jss-nextjs` is used for rendering text fields from Sitecore items.

3. **Model Imports**:
   - `IHotel` from `models/data/IHotel` represents the hotel data structure.
   - `ISitecoreField` and `ISitecoreImage` from `models/sitecore/generic/ISitecoreField` are used for typing the Sitecore fields and images.

4. **Component Imports**:
   - `AmendSummaryAccordion`, `HotelPreviewLink`, and `IconChevronRight` are imported from their respective paths within the `frontend/components` directory. These components are used to build parts of the UI.

5. **Styles Import**:
   - Importing SCSS module from `./HotelDropdown.module.scss` to style the component.

## Structure

The `HotelDropdown` component is structured as follows:

- **Props Definition (`IHotelDropdownProps`)**:
  - `CTALabel`: A Sitecore field for a string that represents the call-to-action label.
  - `hotel`: An object adhering to the `IHotel` interface, containing details about the hotel.
  - `icon`: A Sitecore field for an image.
  - `title`: A Sitecore field for a string that represents the title of the dropdown.
  - `previewClickHandler`: An optional function for handling click events, likely used in the preview link.

- **Component Definition**:
  - The component is defined as a functional component using TypeScript.
  - It deconstructs its props and computes the `location` string by combining the resort and location names from the `hotel` object.

- **JSX Structure**:
  - The main wrapper is `AmendSummaryAccordion`, which receives several props including an icon, a title, and additional class names.
  - Inside, an `h4` tag displays the hotel's name and a `p` tag shows the location.
  - Conditionally, if `CTALabel` is provided, the `HotelPreviewLink` component is rendered, which includes the `Text` component for the label and an `IconChevronRight` for visual enhancement.

## Logic

- **Location Computation**:
  - The component computes the `location` by concatenating the `name` of the `resort` and the `name` of the `location` from the `hotel` object.

- **Conditional Rendering**:
  - The `HotelPreviewLink` is conditionally rendered based on the presence of the `CTALabel`. This ensures that the link is only shown when there is a label available for it.

- **Data Passing**:
  - Data such as `icon`, `title.value`, and `hotel` are passed as props to child components (`AmendSummaryAccordion` and `HotelPreviewLink`) to ensure they have the necessary data to render correctly.

- **Event Handling**:
  - The `previewClickHandler` is passed to the `HotelPreviewLink` to handle click events, which allows for additional interactivity like navigating to a detailed view or performing other actions when the link is clicked.

This component effectively combines data handling, conditional logic, and structured component composition to create a functional part of a user interface.
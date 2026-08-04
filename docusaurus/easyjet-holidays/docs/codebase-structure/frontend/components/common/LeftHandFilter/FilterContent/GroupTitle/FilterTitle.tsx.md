## Imports

The `FilterTitle` component utilizes several imports:

- `FC` from `react`: Importing the `FC` type (Functional Component) from React for type-checking.
- `classNames` from `classnames`: A utility function to conditionally join class names together.
- `useStore` from `frontend/hooks/useStore`: A custom hook for accessing the Redux store.
- `IHolidaysStores` from `frontend/store/holidays/create-stores`: TypeScript interface for the structure of the holiday stores.
- `getFilterTitle` from `frontend/utils/filter.utils`: A utility function to get the title based on the filter code.
- `FilterGroupCodes` from `models/enum/FilterGroupCodes`: Enum containing codes for different filter groups.
- `IconChevronDown` and `IconChevronUp` from `frontend/components/icons`: React components for down and up chevron icons.
- `FilterTitleClear` from the current directory: A sub-component used for rendering a clear button within the filter title.
- `styles` from `./GroupTitle.module.scss`: Module CSS for styling the component.

## Structure

The `FilterTitle` component is structured as follows:

- **Props (`IFilterTitleProps`)**: Defines the properties accepted by the component:
  - `code`: Enum of type `FilterGroupCodes` identifying the filter group.
  - `countableFilters`: Object/array containing filters that can be counted or identified.
  - `isActive`: Boolean indicating if the filter group is active.
  - `isDisabled`: Boolean indicating if the filter group is disabled.
  - `name`: Enum of type `FilterGroupCodes` representing the name of the filter group.
  - `onClick`: Function to handle click events, accepting a `FilterGroupCodes` code.
  - `onRemoveAllFilterGroup`: Function to handle the removal of all filters within a group, accepting a string code.
  
- **Component Definition**: `FilterTitle` is a functional component using destructured props for easier access to each property.

## Logic

1. **Store Hook**: Uses the `useStore` custom hook to extract `getPhrase` method from `layoutStore` which is presumably used for localization or text retrieval based on keys.

2. **Class Names**:
   - `tileClassName`: Uses `classNames` to dynamically set classes based on `isDisabled` and `isActive` states.
   - `iconClassName`: Also uses `classNames` to toggle an active class on the icon based on the `isActive` state.

3. **Title Retrieval**:
   - Retrieves a title key using `getFilterTitle` utility function and then the actual phrase using `getPhrase`.

4. **Click Handling**:
   - Defines `onClickMethod` which triggers `onClick` prop function with the filter code if the component is not disabled.

5. **Rendering**:
   - Renders a button with dynamic classes and an `onClick` handler.
   - Inside the button, it displays the title and a conditional icon (`IconChevronUp` or `IconChevronDown`) based on the `isActive` state.
   - Includes the `FilterTitleClear` component for handling the removal of filters.

The component effectively combines utility functions, custom hooks, and conditional rendering to provide a dynamic, interactive filter title suitable for a filtering interface in a web application.
## Imports
The code imports various modules and services necessary for its operation:

- **MobX**: Utilizes `action`, `computed`, `makeObservable`, `observable`, and `runInAction` for state management.
- **Services**: Imports `reviewsService` from `'frontend/services/reviews.service'` to fetch reviews data.
- **Store**: Imports `HolidaysRootStore` from `'frontend/store/holidays/HolidaysRootStore'` to access related store functionalities.
- **Models**: Imports `ICustomerFeedback` and `ICustomersFeedbackResponse` interfaces from `'models/data/ICustomerFeedback'` for type definitions.
- **Enums**: Imports `SiteSettings` from `'models/enum/SiteSettings'` to use predefined settings keys.

## Structure
The structure of the code includes an enumeration, interfaces, and a class:

- **Enumeration (`FeefoPageType`)**: Defines types of pages that can display feedback, such as `Home`, `Promo`, and `Destination`.
- **Interfaces (`IFeedbackData` and `IFeedbacksInitialState`)**: 
  - `IFeedbackData` provides a structure for feedback data including average rating, count, and a list of reviews.
  - `IFeedbacksInitialState` defines the structure for the initial state of the feedback store including error status and optional feedback data.
- **Class (`FeedbacksStore`)**:
  - Contains observable properties `isError` and `feedbackData`.
  - Includes computed properties for dynamic values based on the current state and settings.
  - Provides methods to fetch reviews from the service and manipulate the store's data.

## Logic
The logic of the `FeedbacksStore` class revolves around managing the state of customer feedbacks:

- **Constructor**: Initializes the observables by calling `makeObservable(this)`.
- **Computed Properties**:
  - `pageType`: Determines the current page type based on the layout store's state.
  - `isFeefoEnabled`: Checks if Feefo is enabled in the settings.
  - `showReviews`, `showTitlesAndComments`: Determine visibility of reviews and their details based on settings.
  - `reviewsCount`: Gets the number of reviews to be displayed for desktop and mobile from settings.
- **Fetch Method (`fetchFeefoReviews`)**:
  - Asynchronously fetches reviews data using `reviewsService` based on the given count and rating setting.
  - Utilizes `runInAction` to update the store state in a MobX action for proper reactivity.
- **Data Setting (`setData`)**:
  - An action that updates the store's feedback data based on the response from the service.
  - Handles the mapping of the response to the store's data structure, ensuring fallbacks for missing data.
- **Reset Method (`resetStore`)**:
  - Resets the feedback data to its initial state, clearing all reviews and related data.

This documentation outlines the fundamental components and functionality of the `FeedbacksStore` class used for managing feedback data in a front-end application using MobX for state management and a service pattern for data fetching.
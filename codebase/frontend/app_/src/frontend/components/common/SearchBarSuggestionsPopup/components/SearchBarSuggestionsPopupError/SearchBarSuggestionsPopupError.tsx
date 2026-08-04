import React, { FC } from 'react';

import { getFieldValue } from 'frontend/utils/sitecore.utils';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface ISearchBarSuggestionsPopupErrorProps {
    errorDescription?: string;
    errorMessage?: string;
    hasBlockedPlaces?: boolean;
}

const SearchBarSuggestionsPopupError: FC<ISearchBarSuggestionsPopupErrorProps> = ({
    hasBlockedPlaces,
    errorMessage,
    errorDescription,
}) => {
    const { fields: { DisableRouteErrorTitle, NoResultFoundTitle, NoResultFoundDescription } = {} } =
        useSearchPodStore();

    const errorMessageContent = hasBlockedPlaces
        ? getFieldValue(DisableRouteErrorTitle)
        : errorMessage || getFieldValue(NoResultFoundTitle);
    const errorDescriptionContent = hasBlockedPlaces
        ? getFieldValue(NoResultFoundDescription)
        : errorDescription || getFieldValue(NoResultFoundDescription);

    return (
        <div className={'sb-popup sb-popup--error'}>
            <ErrorMessage
                message={errorMessageContent}
                description={errorDescriptionContent}
                icon={<IconInfoCircle />}
            />
        </div>
    );
};

export default SearchBarSuggestionsPopupError;

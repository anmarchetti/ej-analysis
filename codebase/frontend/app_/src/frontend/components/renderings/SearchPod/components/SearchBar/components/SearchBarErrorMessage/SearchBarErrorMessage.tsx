import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';

export interface ISearchBarErrorMessageProps {
    field: SearchBarDropdown;
    isActive: boolean;
    withDescription?: boolean;
}

const SearchBarErrorMessage: FC<ISearchBarErrorMessageProps> = ({ field, withDescription, isActive }) => {
    const { getPhrase, errorMessages, hasErrorInField } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        errorMessages: stores.searchStore.errorMessages,
        hasErrorInField: stores.searchStore.hasErrorInField,
    }));

    if (!errorMessages || !hasErrorInField(field) || !isActive) {
        return null;
    }

    const description = errorMessages.description ? getPhrase(errorMessages.description) : '';

    return (
        <ErrorMessage
            message={getPhrase(errorMessages.message)}
            icon={<SVGWarningFilled />}
            description={withDescription ? description : undefined}
        />
    );
};

export default observer(SearchBarErrorMessage);

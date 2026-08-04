import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { withRerender } from 'frontend/components/hoc';

interface IAmendDatesSummaryContinueBtnProps {
    wasRerendered?: boolean;
}

const AmendDatesSummaryContinueBtn = ({ wasRerendered }: IAmendDatesSummaryContinueBtnProps) => {
    const { getPhrase, isScreenLessMedium, confirmChosenDates } = useStore(
        ({ layoutStore, appStore, amendDatesStore }: IHolidaysStores) => ({
            getPhrase: layoutStore.getPhrase,
            isScreenLessMedium: appStore.isScreenLessMedium,
            confirmChosenDates: amendDatesStore.confirmChosenDates,
        }),
    );

    return (
        <Button
            isMedium={wasRerendered && !isScreenLessMedium}
            onClick={confirmChosenDates}
            className='summary-edit'
            dataTid='amend-dates-continue-cta'
        >
            {getPhrase(SitecoreDictionary.GlobalsButtonsConfirmChanges)}
        </Button>
    );
};

export default observer(withRerender(AmendDatesSummaryContinueBtn));

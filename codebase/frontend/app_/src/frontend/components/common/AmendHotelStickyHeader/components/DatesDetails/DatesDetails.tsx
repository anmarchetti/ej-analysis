import { FunctionComponent } from 'react';

import useStore from 'frontend/hooks/useStore';
import { useNightsLabel } from 'frontend/hooks/viewBooking.hooks';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import SvgCalendarLined from 'frontend/components/icons-new/CalendarLined';

export interface IDatesDetailsProps {
    endDate: string;
    startDate: string;
    className?: string;
    dataTid?: string;
    showOnlyDuration?: boolean;
}

const DatesDetails: FunctionComponent<IDatesDetailsProps> = ({
    className,
    dataTid = 'dates-details',
    startDate,
    endDate,
    showOnlyDuration = false,
}) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const startDateLabel = formatDateL10n(startDate, 'DD MMM');
    const endDateLabel = formatDateL10n(endDate, 'DD MMM YYYY');

    const nightsLabel = useNightsLabel(startDate, endDate, getPhrase);

    return (
        <div className={className} data-tid={dataTid}>
            <SvgCalendarLined data-tid={`${dataTid}-icon`} />
            <span data-tid={`${dataTid}-label`} data-cs-mask>
                {showOnlyDuration ? nightsLabel : `${startDateLabel} - ${endDateLabel}, ${nightsLabel}`}
            </span>
        </div>
    );
};

export default DatesDetails;

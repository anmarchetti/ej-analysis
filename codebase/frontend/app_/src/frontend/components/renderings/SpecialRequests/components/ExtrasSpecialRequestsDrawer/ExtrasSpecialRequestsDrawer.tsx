import { FC, useEffect, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IFlattenedSpecialRequest } from 'models/data/SpecialRequest';
import Drawer from 'frontend/components/common/Drawer';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SpecialRequestItem from 'frontend/components/renderings/SpecialRequests/components/SpecialRequestItem/SpecialRequestItem';
import { ISpecialRequestsFields } from 'frontend/components/renderings/SpecialRequests/SpecialRequests';

import SpecialRequestsDrawerActions from './ExtrasSpecialRequestsDrawerActions/ExtrasSpecialRequestsDrawerActions';
import ExtrasSpecialRequestsDrawerAlerts from './ExtrasSpecialRequestsDrawerAlerts/ExtrasSpecialRequestsDrawerAlerts';

import styles from './ExtrasSpecialRequestsDrawer.module.scss';

interface ISpecialRequestsDrawerProps {
    fields: ISpecialRequestsFields | undefined;
    handlePreselectedDismissal: (code: string) => void;
    isOpen: boolean;
    onClose: () => void;
    onSelectRequest: (code: string) => void;
    requests: IFlattenedSpecialRequest[];
    alerts?: { description: string; message: string }[];
}

const cloneRequests = (requests: IFlattenedSpecialRequest[]): IFlattenedSpecialRequest[] =>
    requests.map(rq => ({
        ...rq,
    }));

const ExtrasSpecialRequestsDrawer: FC<ISpecialRequestsDrawerProps> = props => {
    const {
        isOpen,
        requests,
        handlePreselectedDismissal,
        onClose,
        alerts = [],
        fields: { Description } = {},
        onSelectRequest,
    } = props;

    const { addSpecialRequests, isScreenLessMedium } = useStore(store => ({
        addSpecialRequests: store.bookingStore.addSpecialRequests,
        getPhrase: store.layoutStore.getPhrase,
        isScreenLessMedium: store.appStore.isScreenLessMedium,
    }));

    // special requests clone only for drawer
    const [drawerRequests, setDrawerRequests] = useState<IFlattenedSpecialRequest[]>([]);
    // store selected pre-selected in seperate variable to remove it from pre-selected if it's later removed from selected
    const [originalPreselected, setOriginalPreselected] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setDrawerRequests(cloneRequests(requests));
            setOriginalPreselected(requests.filter(rq => rq.isPreselected && rq.isSelected).map(rq => rq.code));
        }
    }, [isOpen]);

    const handleClose = (): void => {
        const initialCodes = drawerRequests.filter(r => r.isSelected).map(r => r.code);
        addSpecialRequests(initialCodes, true);
        onClose();
    };

    const onSave = (): void => {
        const codes = requests.filter(r => r.isSelected).map(r => r.code);

        // if new selected codes do not include originally selected pre-selected, then remove preselected from selected (needed to remove alert on drawer closing)
        originalPreselected.forEach(code => {
            if (!codes.includes(code)) {
                handlePreselectedDismissal(code);
            }
        });
        onClose();
    };

    return (
        <Drawer open={isOpen} className={styles.drawer} dataTid='extras-special-requests-drawer'>
            <div className='row'>
                <div className='col-12'>
                    <div className={styles.content}>
                        {!!Description?.value && (
                            <RichTextWithLinks
                                field={Description}
                                tag='div'
                                className={classNames({
                                    [styles.description]: true,
                                    [styles.descriptionWithAttention]: alerts.length > 0,
                                })}
                            />
                        )}

                        {alerts.length > 0 && isOpen && <ExtrasSpecialRequestsDrawerAlerts alerts={alerts} />}

                        <div className={styles.specialRequestsList}>
                            {requests.map(request => (
                                <SpecialRequestItem
                                    key={request.code}
                                    item={request}
                                    onSelect={onSelectRequest}
                                    isSolid={isScreenLessMedium}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <SpecialRequestsDrawerActions onSave={onSave} onClose={handleClose} />
            </div>
        </Drawer>
    );
};

export default ExtrasSpecialRequestsDrawer;

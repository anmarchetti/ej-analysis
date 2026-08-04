import { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useSpecialRequests from 'frontend/hooks/useSpecialRequests';
import useStore from 'frontend/hooks/useStore';
import { IContradictoryOptionsPayload } from 'models/data/SpecialRequest';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { ContradictorySpecialRequestPopup } from 'frontend/components/renderings/SpecialRequests/components/ContradictorySpecialRequestPopup/ContradictorySpecialRequestPopup';
import ExtrasSpecialRequestsDrawer from 'frontend/components/renderings/SpecialRequests/components/ExtrasSpecialRequestsDrawer/ExtrasSpecialRequestsDrawer';
import SpecialAssistance from 'frontend/components/renderings/SpecialRequests/components/SpecialAssistance/SpecialAssistance';
import SpecialRequestItem from 'frontend/components/renderings/SpecialRequests/components/SpecialRequestItem/SpecialRequestItem';
import SpecialRequestsAlerts from 'frontend/components/renderings/SpecialRequests/components/SpecialRequestsAlerts/SpecialRequestsAlerts';
import { ISpecialRequestsFields } from 'frontend/components/renderings/SpecialRequests/SpecialRequests';
import { getContradictingItems } from 'frontend/components/renderings/SpecialRequests/specialRequests.utils';

import styles from './ExtrasSpecialRequests.module.scss';

interface ISpecialRequestsProps {
    fields?: ISpecialRequestsFields | undefined;
}

const SpecialRequests: FC<ISpecialRequestsProps> = props => {
    const {
        Title,
        Description,
        AddRequestsCTA,
        EditRequestsCTA,
        SpecialRequestsTypes,
        SpecialRequestsContradictoryGroups,
        AmendRequestIcon,
    } = props.fields || {};

    const {
        isEligibleToAddSpecialRequest,
        toggleSpecialRequest,
        isSpecialRequestEnabled,
        replaceSpecialRequest,
        isScreenLessMedium,
    } = useStore(store => ({
        isEligibleToAddSpecialRequest: store.bookingStore.isEligibleToAddSpecialRequest,
        toggleSpecialRequest: store.bookingStore.toggleSpecialRequest,
        replaceSpecialRequest: store.bookingStore.replaceSpecialRequest,
        getPhrase: store.layoutStore.getPhrase,
        isSpecialRequestEnabled: store.layoutStore.isSpecialRequestEnabled,
        isScreenLessMedium: store.appStore.isScreenLessMedium,
    }));

    const { requests, alerts, handlePreselectedDismissal } = useSpecialRequests(
        SpecialRequestsTypes || [],
        SpecialRequestsContradictoryGroups,
    );

    const hasSelected = requests.some(r => r.isSelected);

    const [contradictoryOptions, setContradictoryOptions] = useState<Nullable<IContradictoryOptionsPayload>>();

    const [isRequestsDrawerOpen, setRequestsDrawerOpen] = useState(false);
    const toggleRequestDrawer = (): void => {
        setRequestsDrawerOpen(!isRequestsDrawerOpen);
    };

    const onSelectRequest = (code: string): void => {
        const contradictingItems = getContradictingItems(requests, code);

        if (contradictingItems) {
            setContradictoryOptions(contradictingItems);

            return;
        }

        handlePreselectedDismissal(code);
        toggleSpecialRequest(code);
    };

    const onContradictorySubmit = (code: string, contradictoryCode: string): void => {
        handlePreselectedDismissal(contradictoryCode);
        replaceSpecialRequest(code, contradictoryCode);
    };

    const clearContradictoryOptions = (): void => {
        setContradictoryOptions(null);
    };

    return (
        <>
            {isEligibleToAddSpecialRequest && isSpecialRequestEnabled && (
                <div className={styles.specialRequests} data-tid='extras-special-requests'>
                    <div>
                        <Text
                            field={Title}
                            tag='h3'
                            className={styles.headerTitle}
                            data-tid='extras-special-requests-title'
                        />
                        <div className={styles.content}>
                            {!!AmendRequestIcon?.value?.src && (
                                <JSSImage className={styles.image} field={AmendRequestIcon} />
                            )}
                            {!!Description?.value && (
                                <RichTextWithLinks
                                    field={Description}
                                    tag='div'
                                    className={styles.text}
                                    dataId='extras-special-requests-description'
                                />
                            )}
                        </div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardInner}>
                            <div className={styles.specialRequestsList} data-tid='extras-special-requests-list'>
                                <div className={styles.specialRequestsListContainer}>
                                    {requests.map(req => (
                                        <SpecialRequestItem
                                            key={req.code}
                                            item={req}
                                            onSelect={onSelectRequest}
                                            isClosable
                                            onlyShowSelectedOnMobile
                                        />
                                    ))}
                                </div>

                                {!isScreenLessMedium && (
                                    // for some reason, when div is removed,
                                    // a duplicate bottom wrapper
                                    // (<div className={styles.buttons}>) is rendered
                                    <div>
                                        <SpecialRequestsAlerts alerts={alerts} />
                                    </div>
                                )}

                                <div className={styles.buttons}>
                                    {!hasSelected && !!AddRequestsCTA?.value && (
                                        <Button
                                            onClick={toggleRequestDrawer}
                                            isOutlined
                                            isFullWidth
                                            className={styles.mobileBtn}
                                            data-tid='extras-special-requests-add-button'
                                        >
                                            {AddRequestsCTA?.value}
                                        </Button>
                                    )}
                                    {hasSelected && !!EditRequestsCTA?.value && (
                                        <Button
                                            onClick={toggleRequestDrawer}
                                            isOutlined
                                            isFullWidth
                                            className={styles.mobileBtn}
                                        >
                                            {EditRequestsCTA?.value}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <SpecialAssistance fields={props.fields} />

            <ExtrasSpecialRequestsDrawer
                fields={props.fields}
                isOpen={isRequestsDrawerOpen}
                requests={requests}
                onSelectRequest={onSelectRequest}
                handlePreselectedDismissal={handlePreselectedDismissal}
                onClose={toggleRequestDrawer}
                alerts={alerts}
            />

            <ContradictorySpecialRequestPopup
                contradictoryOptions={contradictoryOptions}
                onSubmit={onContradictorySubmit}
                onCancel={clearContradictoryOptions}
                fields={props.fields}
            />
        </>
    );
};

export default observer(SpecialRequests);

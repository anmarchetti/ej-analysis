import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IContradictoryOptionsPayload } from 'models/data/SpecialRequest';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import { ISpecialRequestsFields } from 'frontend/components/renderings/SpecialRequests/SpecialRequests';
import { useSRLocalStore } from 'frontend/components/renderings/SpecialRequests/stores/createLocalStore';

import styles from './ContradictorySpecialRequestPopup.module.scss';

interface IContradictorySpecialRequestPopup {
    contradictoryOptions: Nullable<IContradictoryOptionsPayload>;
    fields: Partial<Nullable<ISpecialRequestsFields>>;
    onCancel: (e?: React.MouseEvent<HTMLButtonElement>) => void;
    onSubmit: (code: string, contradictoryCode?: string) => void;
    booking?: IBookingInfo;
}

export const ContradictorySpecialRequestPopup: FC<IContradictorySpecialRequestPopup> = ({
    contradictoryOptions,
    onSubmit,
    onCancel,
    fields,
    booking,
}) => {
    const { tracking } = useSRLocalStore();
    const {
        ContradictoryPopupTitle,
        ContradictoryPopupDescription,
        ContradictoryOriginalSelectionTitle,
        ContradictoryNewSelectionTitle,
    } = fields || {};

    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    if (!contradictoryOptions) return null;

    const replaceOption = () => {
        tracking.contradictionToggleSpecialRequests(
            booking?.bookingReference || '',
            booking?.specialRequests,
            contradictoryOptions.newOption.name,
            contradictoryOptions.currentOption.name,
            'GetNew',
        );
        onSubmit(contradictoryOptions?.newOption?.code, contradictoryOptions?.currentOption?.code);
        onCancel();
    };

    const handleClose = () => {
        tracking.contradictionToggleSpecialRequests(
            booking?.bookingReference || '',
            booking?.specialRequests,
            contradictoryOptions.newOption.name,
            contradictoryOptions.currentOption.name,
            'KeepOld',
        );
        onCancel();
    };

    return (
        <Popup
            containerClass={styles.popupContainer}
            contentClass={styles.popupContent}
            bodyClass={styles.popupBody}
            onClose={onCancel}
            isInnerPopup
        >
            <div className={styles.container}>
                <div className={styles.titleWrap}>
                    {!!ContradictoryPopupTitle?.value && (
                        <Text tag='h5' className={styles.title} field={ContradictoryPopupTitle} />
                    )}
                    {!!ContradictoryPopupDescription?.value && (
                        <Text tag='p' className={styles.description} field={ContradictoryPopupDescription} />
                    )}
                </div>
                {!!ContradictoryOriginalSelectionTitle?.value && (
                    <Text tag='span' className={styles.optionTitle} field={ContradictoryOriginalSelectionTitle} />
                )}

                <div className={classNames(styles.popupOption, styles.original)}>
                    {contradictoryOptions.currentOption.name}
                </div>
                {!!ContradictoryNewSelectionTitle?.value && (
                    <Text tag='span' className={styles.optionTitle} field={ContradictoryNewSelectionTitle} />
                )}
                <div className={classNames(styles.popupOption, styles.new)}>{contradictoryOptions.newOption.name}</div>
            </div>
            <div className={styles.popupButtons}>
                <Button type='button' isTransparent onClick={handleClose}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsContradictoryKeepOriginal)}
                </Button>
                <Button onClick={replaceOption} type='button'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsContradictoryContinueWithNew)}
                </Button>
            </div>
        </Popup>
    );
};

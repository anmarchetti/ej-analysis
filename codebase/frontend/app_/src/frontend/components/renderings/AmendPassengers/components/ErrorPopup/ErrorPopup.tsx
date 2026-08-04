import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useEffectIfTruthy } from 'frontend/hooks/useEffectIfTruthy';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getTextFromHtml } from 'frontend/utils/string.utils';
import { ApiErrors } from 'models/enum/ApiErrors';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IAmendPassengersFields } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';
import { useAmendPassengersLocalStore } from 'frontend/components/renderings/AmendPassengers/stores/amendPassengerLocalStore';
import AttentionPopup from 'frontend/components/renderings/AttentionPopup/AttentionPopup';

import { getErrorPopupMeta } from './ErrorPopup.utils';

import styles from './ErrorPopup.module.scss';

export type TPassengerErrorTypes =
    | ApiErrors.ChangeLimitExeeded
    | ApiErrors.CharactersChangeLimitExeeded
    | 'LeadPassengerRestriction'
    | 'RemovePassengerRestriction'
    | 'Generic';

export interface IErrorPopupProps {
    onClose: () => void;
    error?: Nullable<
        Partial<{
            errorStatus: number;
            errorType: TPassengerErrorTypes;
        }>
    >;
    fields?: IAmendPassengersFields;
    id?: string;
}

const ErrorPopup = ({ onClose, id, fields, error }: IErrorPopupProps) => {
    const { getPhrase, charactersChangeCount } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        charactersChangeCount: stores.amendPassengerStore.amendPassengerNameCharacterCount,
    }));
    const { tracking } = useAmendPassengersLocalStore();

    const { title, icon, description } = getErrorPopupMeta(error?.errorType as TPassengerErrorTypes, fields, {
        charactersChangeCount,
    });

    useEffectIfTruthy(() => {
        tracking.onCommitPassengersNameChangeError(getTextFromHtml(description.value), error?.errorStatus || null);
    }, error);

    const isGenericError = error?.errorType === 'Generic';

    if (isGenericError) {
        return (
            <div className={styles.genericPopup}>
                <AttentionPopup
                    id={id}
                    onClose={onClose}
                    fields={{
                        Title: title,
                        Description: description,
                        Icon: icon,
                        CTA: { value: getPhrase(SitecoreDictionary.GlobalsButtonsClose) },
                    }}
                />
            </div>
        );
    }

    return (
        <Popup id={id} onClose={onClose} contentClass={styles.content} bodyClass={styles.body}>
            {icon && <JSSImage field={icon} className={styles.errorPopupIcon} />}

            {title && <Text field={title} tag='h2' className={styles.popupHeader} />}

            {description && <RichTextWithLinks field={description} className={styles.popupDescription} tag='p' />}

            <Button onClick={onClose} type='button' className={styles.button}>
                {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
            </Button>
        </Popup>
    );
};

export default observer(ErrorPopup);

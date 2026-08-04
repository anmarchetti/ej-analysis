import { FunctionComponent } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { PopupType } from 'frontend/components/renderings/AttentionPopup/AttentionPopup';

import styles from './ViewBooking.module.scss';

interface IViewBookingInventoryErrorProps {
    onClose: () => void;
    rendering: ISitecoreComponent['rendering'];
}

const ViewBookingInventoryError: FunctionComponent<IViewBookingInventoryErrorProps> = ({ rendering, onClose }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className={styles.inventoryPopup}>
            <Placeholder
                name={PlaceholderNames.AttentionPopup}
                rendering={rendering}
                onClose={onClose}
                popupType={PopupType.InventoryError}
                descriptionHandler={description =>
                    Tokenizer.replaceToken(
                        description,
                        Tokens.Number,
                        `<a class='btn-txt' href='tel:${getPhrase(
                            SitecoreDictionary.ContactUsLabelsPhone,
                        )}'>${getPhrase(SitecoreDictionary.ContactUsLabelsPhone)}</a>`,
                    )
                }
            />
        </div>
    );
};

export default ViewBookingInventoryError;

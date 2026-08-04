import { FC, useState } from 'react';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';
import { IChangeFeeInfoFields } from 'frontend/components/renderings/ChangeFeeInfo/ChangeFeeInfo';

import styles from './ChangeFeeTooltipMobile.module.scss';

export type TChangeFeeTooltipMobileProps = ISitecoreComponent<IChangeFeeInfoFields>;

export const ChangeFeeTooltipMobile: FC<TChangeFeeTooltipMobileProps> = ({ fields }) => {
    const { getPhrase, formatMoney, amendHotelFeePP } = useStore(
        ({ layoutStore, marketStore, amendHotelStore }: IHolidaysStores) => ({
            getPhrase: layoutStore.getPhrase,
            formatMoney: marketStore.formatMoney,
            amendHotelFeePP: amendHotelStore.feePP || 0,
        }),
    );
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);

    if (!fields || !amendHotelFeePP) {
        return null;
    }

    const { Description, Title, TooltipIconAriaLabelMobile } = fields;
    const pricePP = formatMoney(amendHotelFeePP, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
    });
    const marketFriendlyPricePP = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.GlobalsPriceLabelsPerPerson),
        Tokens.Price,
        pricePP,
    );
    const content = Tokenizer.replaceTokens(Description?.value, {
        [Tokens.Price]: marketFriendlyPricePP,
    });

    return (
        <>
            <button
                onClick={(): void => setIsTooltipOpen(true)}
                aria-label={TooltipIconAriaLabelMobile?.value}
                data-tid='charge-fee-popup-open'
                className={styles.iconBtn}
            >
                <SvgInfoFilled />
            </button>

            {isTooltipOpen && <div className={styles.greyOverlay} data-tid='grey-overlay' />}
            <div className={styles.tooltipPopup}>
                <HeightAnimatedContainer isOpened={isTooltipOpen}>
                    <div data-tid='tooltip-popup' className={styles.body}>
                        <Text tag='h6' field={Title} className={styles.title} />
                        <RichText
                            data-tid='tooltip-popup-description'
                            field={{ ...Description, value: content }}
                            tag='p'
                            className={styles.content}
                        />
                        <Button
                            className={styles.closeBtn}
                            onClick={(): void => {
                                setIsTooltipOpen(false);
                            }}
                            dataTid='charge-fee-popup-close-btn'
                        >
                            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                        </Button>
                    </div>
                </HeightAnimatedContainer>
            </div>
        </>
    );
};

export default ChangeFeeTooltipMobile;

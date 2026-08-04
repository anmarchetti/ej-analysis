import { FC } from 'react';

import { CurrencyCode, FORMATTING_NUMBERS_LANG_MAP } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { TAmendTaxesAndFees } from 'models/data/IAmendTaxAndFeeItem';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import { buildAmountToken, buildRateToken } from './TouristTaxSummary.utils';

import styles from './TouristTaxSummary.module.scss';

export interface ITouristTaxSummaryProps {
    currency: CurrencyCode;
    newTaxesAndFees: TAmendTaxesAndFees;
    newTouristTaxConverted: number;
    prevTouristTax: number;
    newTaxLabel?: string;
    newTaxPopupContent?: string;
    newTaxPopupTitle?: string;
    prevTaxLabel?: string;
}

const TouristTaxSummary: FC<ITouristTaxSummaryProps> = ({
    currency,
    newTaxesAndFees,
    newTouristTaxConverted,
    prevTouristTax,
    newTaxLabel,
    newTaxPopupContent,
    newTaxPopupTitle,
    prevTaxLabel,
}) => {
    const { formatMoney, lang } = useStore(({ marketStore, layoutStore }: IHolidaysStores) => ({
        formatMoney: marketStore.formatMoney,
        lang: layoutStore.lang,
    }));

    const locale = FORMATTING_NUMBERS_LANG_MAP[lang] || FORMATTING_NUMBERS_LANG_MAP.en;

    const tooltipText = Tokenizer.replaceTokens(newTaxPopupContent ?? null, {
        [Tokens.Amount]: buildAmountToken(newTaxesAndFees, locale),
        [Tokens.Rate]: buildRateToken(newTaxesAndFees, locale),
    });

    const tooltipContent = (
        <div className={styles.tooltipContent} aria-label={`${newTaxPopupTitle} ${tooltipText}`}>
            {!!newTaxPopupTitle && (
                <RichTextWithLinks className={styles.tooltipTitle} field={{ value: newTaxPopupTitle }} />
            )}
            {!!tooltipText && <RichTextWithLinks tag='span' field={{ value: tooltipText }} />}
        </div>
    );

    return (
        <div className={styles.touristTaxSummary}>
            <div className={styles.taxRow}>
                <span>{prevTaxLabel}</span>
                <span className={styles.taxAmount}>{formatMoney(prevTouristTax, { currency })}</span>
            </div>

            <div className={styles.taxRow}>
                {newTaxLabel && <RichTextWithLinks tag='span' field={{ value: newTaxLabel }} />}
                <Tooltip>
                    <TooltipTrigger tabIndex={0}>
                        <span className={styles.newTaxPrice}>{formatMoney(newTouristTaxConverted, { currency })}</span>
                    </TooltipTrigger>
                    <TooltipContent isPrimaryCloseButton>{tooltipContent}</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
};

export default TouristTaxSummary;

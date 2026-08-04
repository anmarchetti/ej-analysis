import { FC } from 'react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import { useLuxuryInternalFlight } from 'frontend/hooks/useLuxuryInternalFlight';
import { IGuestsAmount } from 'frontend/utils/luggage.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import styles from './CabinBagsInfo.module.scss';

export interface ICabinBagsInfoFields {
    IncludedBagsLabel?: ISitecoreField<string>;
    IncludedIcon?: ISitecoreField<ISitecoreImage>;
    IncludedWithInfantLabel?: ISitecoreField<string>;
    OverheadAddedIcon?: ISitecoreField<ISitecoreImage>;
    OverheadBagAddedLabel?: ISitecoreField<string>;
    SpeedyBoardingTooltip?: ISitecoreField<string>;
}

export interface ICabinBagsInfoProps {
    LCBCount: number;
    fields: ICabinBagsInfoFields;
    guestsAmountByType: IGuestsAmount;
    bagTypeClassName?: string;
    containerClassName?: string;
    hideIcon?: boolean;
    iconClassName?: string;
    showSpeedyBoardingTooltip?: boolean;
}

const CabinBagsInfo: FC<ICabinBagsInfoProps> = ({
    fields,
    guestsAmountByType,
    LCBCount,
    containerClassName,
    bagTypeClassName,
    iconClassName,
    hideIcon = false,
    showSpeedyBoardingTooltip,
}) => {
    const isLuxuryInternalFlight = useLuxuryInternalFlight();
    const {
        IncludedIcon,
        OverheadAddedIcon,
        IncludedBagsLabel,
        OverheadBagAddedLabel,
        IncludedWithInfantLabel,
        SpeedyBoardingTooltip,
    } = fields;

    const infantsLength = guestsAmountByType.infants;
    const adultsAndChildrenLength = guestsAmountByType.adults + guestsAmountByType.children;

    const includedLabel = Tokenizer.replaceToken(
        IncludedBagsLabel?.value,
        Tokens.Count,
        adultsAndChildrenLength.toString(),
    );

    const lcbCountFinal = isLuxuryInternalFlight ? adultsAndChildrenLength : LCBCount;
    const bagsAddedLabel = Tokenizer.replaceToken(OverheadBagAddedLabel?.value, Tokens.Count, lcbCountFinal.toString());
    const includeInfantLabel = Tokenizer.replaceTokens(IncludedWithInfantLabel?.value, {
        [Tokens.Count]: adultsAndChildrenLength.toString(),
        [Tokens.InfantCount]: infantsLength.toString(),
    });

    return (
        <div className={classNames(containerClassName, styles.container)} data-tid='cabin-bags-info'>
            <div className={bagTypeClassName} data-tid='lcb-bag-type'>
                {!hideIcon && <JSSImage field={IncludedIcon} className={iconClassName} data-tid='included-bag-icon' />}
                {!!infantsLength ? includeInfantLabel : includedLabel}
            </div>
            <div className={classNames(bagTypeClassName, !lcbCountFinal && 'd-none')} data-tid='lcb-bag-type'>
                {!hideIcon && (
                    <JSSImage field={OverheadAddedIcon} className={iconClassName} data-tid='overhead-bag-added-icon' />
                )}
                <div>
                    {bagsAddedLabel}
                    {showSpeedyBoardingTooltip && SpeedyBoardingTooltip?.value && (
                        <Tooltip placement='bottom'>
                            <TooltipTrigger className={styles.tooltipTrigger} />
                            <TooltipContent text={SpeedyBoardingTooltip?.value} className={styles.tooltipContent} />
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CabinBagsInfo;

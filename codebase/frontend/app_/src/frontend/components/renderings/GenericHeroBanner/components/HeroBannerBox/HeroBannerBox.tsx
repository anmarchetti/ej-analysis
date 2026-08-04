import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import HeroBannerControls from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerControls/HeroBannerControls';

export interface IHeroBannerBoxProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    onClick: (e: React.MouseEvent, link: ISitecoreField<ISitecoreLink>, position?: string) => void;
    hasAdditionalControl?: boolean;
}

const HeroBannerBox: FunctionComponent<IHeroBannerBoxProps> = ({
    fields,
    experiment,
    hasAdditionalControl,
    onClick,
}) => {
    const { isPriceVisible } = useStore((stores: TStores) => ({
        isPriceVisible: isHolidayStore(stores) || !stores.layoutStore.isPricesHidden,
    }));

    const {
        Title,
        Icon,
        TopText,
        Subtitle,
        CTAType,
        TextBeforeNumber,
        NumberValue,
        TextAfterNumber,
        BottomText,
        BottomLinedText,
        CTA,
        CTA2,
    } = fields;

    const hasIcon = !!Icon?.value?.src;
    const hasTopText = !!TopText?.value;
    const hasTextBeforeNumber = !!TextBeforeNumber?.value;
    const hasNumberValue = !!NumberValue?.value;
    const hasTextAfterNumber = !!TextAfterNumber?.value;
    const controls = hasAdditionalControl ? [CTA, CTA2] : [CTA];

    return (
        <>
            {(hasTopText || hasIcon) && (
                <div className='hero-banner__logo'>
                    {hasIcon && <JSSImage field={Icon} />}
                    <Text field={TopText} tag='span' />
                </div>
            )}
            {!!Title && <RichTextWithLinks field={Title} tag='h2' className='hero-banner__title' />}
            {!!Subtitle && <RichTextWithLinks className='hero-banner__subtitle' field={Subtitle} tag='div' />}
            {isPriceVisible && (hasNumberValue || hasTextAfterNumber || hasTextBeforeNumber) && (
                <>
                    <Text field={TextBeforeNumber} tag='span' className='hero-banner__price-currency' />

                    <div className='hero-banner__total'>
                        <Text field={NumberValue} tag='span' />
                        <Text field={TextAfterNumber} tag='span' />
                    </div>
                </>
            )}
            <Text field={BottomText} tag='span' />
            <Text field={BottomLinedText} tag='div' className='hero-banner__promo-footer' />
            <HeroBannerControls
                experiment={experiment}
                controlsFields={controls}
                type={CTAType?.value}
                onClick={onClick}
            />
        </>
    );
};

export default observer(HeroBannerBox);

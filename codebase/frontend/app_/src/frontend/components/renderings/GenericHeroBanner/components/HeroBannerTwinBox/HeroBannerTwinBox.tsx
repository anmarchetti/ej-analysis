import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import HeroBannerControls from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerControls/HeroBannerControls';

export interface IHeroBannerTwinBoxProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    onClick: (
        e: React.MouseEvent | React.KeyboardEvent,
        link: ISitecoreField<ISitecoreLink>,
        position?: string,
    ) => void;
    isSecondBox?: boolean;
}

const HeroBannerTwinBox: FunctionComponent<IHeroBannerTwinBoxProps> = ({
    fields,
    experiment,
    isSecondBox,
    onClick,
}) => {
    const { isPriceVisible } = useStore((stores: TStores) => ({
        isPriceVisible: isHolidayStore(stores) || !stores.layoutStore.isPricesHidden,
    }));

    const {
        Subtitle,
        Subtitle2,
        CTAType,
        TextBeforeNumber,
        NumberValue,
        TextAfterNumber,
        BottomText,
        BottomLinedText,
        TextBeforeNumber2,
        NumberValue2,
        TextAfterNumber2,
        CTA,
        CTA2,
    } = fields;

    if ((!isSecondBox && !Subtitle?.value) || (isSecondBox && !Subtitle2?.value)) {
        return null;
    }

    const mainFields = isSecondBox
        ? {
              textBefore: TextBeforeNumber2,
              value: NumberValue2,
              textAfter: TextAfterNumber2,
              subtitle: Subtitle2,
              button: CTA2,
          }
        : {
              textBefore: TextBeforeNumber,
              value: NumberValue,
              textAfter: TextAfterNumber,
              subtitle: Subtitle,
              button: CTA,
          };

    const hasTextBeforeNumber = !!mainFields.textBefore?.value;
    const hasNumberValue = !!mainFields.value?.value;
    const hasTextAfterNumber = !!mainFields.textAfter?.value;

    return (
        <div className='content-box' data-tid='hero-banner-content-box'>
            {!!mainFields.subtitle && (
                <RichTextWithLinks className='hero-banner__subtitle' field={mainFields.subtitle} tag='div' />
            )}
            {isPriceVisible && (hasNumberValue || hasTextAfterNumber || hasTextBeforeNumber) && (
                <>
                    <Text field={mainFields.textBefore} tag='span' className='hero-banner__price-currency' />

                    <div className='hero-banner__total'>
                        <Text field={mainFields.value} tag='span' />
                        <Text field={mainFields.textAfter} tag='span' />
                    </div>
                </>
            )}
            {!isSecondBox && <Text field={BottomText} tag='span' />}
            {!isSecondBox && <Text className='hero-banner__promo-footer' field={BottomLinedText} tag='div' />}
            <HeroBannerControls
                experiment={experiment}
                controlsFields={[mainFields.button]}
                type={CTAType?.value}
                onClick={onClick}
                isSecondBox={isSecondBox}
            />
        </div>
    );
};

export default observer(HeroBannerTwinBox);

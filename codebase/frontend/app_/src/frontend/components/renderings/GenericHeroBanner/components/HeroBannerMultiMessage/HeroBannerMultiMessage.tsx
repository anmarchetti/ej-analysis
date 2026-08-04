import { FunctionComponent } from 'react';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import CreditAnchor from 'frontend/components/common/CreditAnchor/CreditAnchor';
import BoxWithRoundel from 'frontend/components/renderings/GenericHeroBanner/components/BoxWithRoundel/BoxWithRoundel';
import HeroBannerImages from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerImages/HeroBannerImages';

import styles from './HeroBannerMultiMessage.module.scss';

export interface IHeroBannerHeroBannerMultiMessageProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    onClick: (
        e: React.MouseEvent | React.KeyboardEvent,
        link: ISitecoreField<ISitecoreLink>,
        position?: string,
    ) => void;
}

const HeroBannerMultiMessage: FunctionComponent<IHeroBannerHeroBannerMultiMessageProps> = ({
    fields,
    experiment,
    onClick,
}) => {
    const {
        TextBeforeNumber2,
        NumberValue2,
        TextAfterNumber2,
        CTA2,
        Subtitle2,
        ExtraContent2,
        TextBeforeNumber3,
        NumberValue3,
        TextAfterNumber3,
        CTA3,
        Subtitle3,
        ExtraContent3,
        Image,
        MobileOnlyImage,
    } = fields;

    const secondBoxFields: IHeroBannerFields = {
        ...fields,
        TextBeforeNumber: TextBeforeNumber2,
        NumberValue: NumberValue2,
        TextAfterNumber: TextAfterNumber2,
        CTA: CTA2,
        Title: Subtitle2,
        Subtitle: ExtraContent2,
    };

    const thirdBoxFields: IHeroBannerFields = {
        ...fields,
        TextBeforeNumber: TextBeforeNumber3,
        NumberValue: NumberValue3,
        TextAfterNumber: TextAfterNumber3,
        CTA: CTA3,
        Title: Subtitle3,
        Subtitle: ExtraContent3,
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.blocksWrapper}>
                <div className={styles.firstBox}>
                    <div className={styles.imageBox}>
                        <HeroBannerImages mobileImage={MobileOnlyImage} image={Image} />
                    </div>
                    <BoxWithRoundel
                        fields={fields}
                        experiment={experiment}
                        onClick={onClick}
                        className={styles.mainBox}
                        isMainBox
                    />
                </div>
                <BoxWithRoundel
                    fields={secondBoxFields}
                    experiment={experiment}
                    onClick={onClick}
                    className={styles.secondBox}
                    isSecondaryBox
                />
                <BoxWithRoundel
                    fields={thirdBoxFields}
                    experiment={experiment}
                    onClick={onClick}
                    className={styles.thirdBox}
                    isSecondaryBox
                />
            </div>
            <div className={styles.creditWrapper}>
                <CreditAnchor fields={fields} isPillStyle className={styles.credit} />
            </div>
        </div>
    );
};

export default HeroBannerMultiMessage;

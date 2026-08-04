import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IHeroBannerFields } from 'models/data/IHeroBannerFields';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ISitecorePersonalizeExperimentBase } from 'models/sitecore/ISitecorePersonalizeExperiment';
import RouterLink from 'frontend/components/common/RouterLink';
import HeroBannerHeader from 'frontend/components/renderings/GenericHeroBanner/components/HeroBannerHeader/HeroBannerHeader';
import { getHeroBannerControls } from 'frontend/components/renderings/GenericHeroBanner/heroBanner.utils';

import styles from './BoxWithRoundel.module.scss';

export interface IHeroBannerBoxWithRoundelProps {
    experiment: ISitecorePersonalizeExperimentBase;
    fields: IHeroBannerFields;
    onClick: (
        e: React.MouseEvent | React.KeyboardEvent,
        link: ISitecoreField<ISitecoreLink>,
        position?: string,
    ) => void;
    className?: string;
    isMainBox?: boolean;
    isSecondaryBox?: boolean;
}

const BoxWithRoundel: FC<IHeroBannerBoxWithRoundelProps> = ({
    fields,
    experiment,
    onClick,
    className,
    isSecondaryBox,
    isMainBox,
}) => {
    const { TextBeforeNumber, NumberValue, TextAfterNumber, CTA } = fields;
    const [firstControl] = getHeroBannerControls([CTA], experiment);

    const isRoundelVisible = TextBeforeNumber?.value || NumberValue?.value || TextAfterNumber?.value;

    return (
        <div
            className={classNames(styles.stripeContent, className, {
                [styles.mainBox]: isMainBox,
                [styles.secondaryBox]: isSecondaryBox,
            })}
            data-tid='hero-banner-content'
        >
            <div className={classNames(styles.header, isRoundelVisible && styles.slimHeader)}>
                <HeroBannerHeader fields={fields} />
            </div>

            {!!firstControl?.value?.href && (
                <RouterLink
                    link={firstControl}
                    className={styles.control}
                    onClick={(e: React.MouseEvent): void => onClick(e, firstControl)}
                >
                    {firstControl.value.text}
                </RouterLink>
            )}

            {isRoundelVisible && (
                <div className={styles.roundelWrapper} data-tid='hero-banner-roundel'>
                    <div className={styles.roundel}>
                        <Text field={TextBeforeNumber} tag='span' />
                        <div className={styles.textContainer}>
                            <Text field={NumberValue} tag='span' className={styles.number} />
                            <Text field={TextAfterNumber} tag='span' />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoxWithRoundel;

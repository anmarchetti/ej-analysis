import { FC, useEffect, useState } from 'react';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { IFinalQuizFields } from 'models/data/IHolidayInspiration';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import FlyingPlaneAnimation from 'frontend/components/common/FlyingPlaneAnimation/FlyingPlaneAnimation';
import QuestionFooter from 'frontend/components/common/InspireMeQuestionFooter/QuestionFooter';
import JSSImage from 'frontend/components/common/JSSImage';
import commonStyles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';

import styles from './FinalQuizTab.module.scss';

export type TFinalQuizTabProps = ISitecoreComponent<IFinalQuizFields>;

const FinalQuizTab: FC<TFinalQuizTabProps> = ({ fields }) => {
    const [activeIndex, setActiveIndex] = useState<number>(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setActiveIndex(prevIndex => (prevIndex + 1) % (HeaderImageLoader?.length || 1));
        }, 500);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    if (!fields) {
        return null;
    }

    const { Description, HeaderImageLoader, HeaderIconLoader, Title } = fields;

    return (
        <div className={classNames(commonStyles.questionWrapper, commonStyles.commonQuestionStructure, styles.wrapper)}>
            <div className={styles.image}>
                {HeaderIconLoader && <JSSImage field={HeaderIconLoader} className={styles.icon} />}

                {HeaderImageLoader && (
                    <div className={styles.sliderContainer}>
                        {HeaderImageLoader.map((imageObj, index) => (
                            <img
                                key={index}
                                src={imageObj.fields.Image.value.src}
                                alt={`Final Image ${index + 1}`}
                                className={classNames(styles.slide, index === activeIndex && styles.activeSlide)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.content}>
                <Text tag='h3' field={Title} className={styles.title} />
                <RichText field={Description} tag='span' className={styles.description} />
                <FlyingPlaneAnimation />
            </div>
            <QuestionFooter isNextButtonDisabled isBackButtonDisabled />
        </div>
    );
};

export default FinalQuizTab;

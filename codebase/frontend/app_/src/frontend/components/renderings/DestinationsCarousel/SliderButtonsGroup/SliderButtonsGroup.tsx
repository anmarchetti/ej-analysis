import SliderNavButton from 'frontend/components/common/SliderNavButton';
import styles from 'frontend/components/renderings/DestinationsCarousel/DestinationCarousel.module.scss';

export const SliderButtonsGroup = ({ next, previous }: any) => (
    <>
        <SliderNavButton isLeftNav onClick={previous} className={styles.sliderNav} />
        <SliderNavButton onClick={next} className={styles.sliderNav} />
    </>
);

export default SliderButtonsGroup;

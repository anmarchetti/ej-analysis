import styles from './StarRatingNew.module.scss';

interface IStarRatingNewProps {
    rating: number;
    showOnlyFull?: boolean;
}

const StarSvg = () => (
    <svg aria-hidden='true' focusable='false' viewBox='1 1 22 22' data-tid='star-icon'>
        <path d='m11.322 2.923c.126-.259.39-.423.678-.423.289 0 .552.164.678.423.974 1.998 2.65 5.44 2.65 5.44s3.811.524 6.022.829c.403.055.65.396.65.747 0 .19-.072.383-.231.536-1.61 1.538-4.382 4.191-4.382 4.191s.677 3.767 1.069 5.952c.083.462-.275.882-.742.882-.122 0-.244-.029-.355-.089-1.968-1.048-5.359-2.851-5.359-2.851s-3.391 1.803-5.359 2.851c-.111.06-.234.089-.356.089-.465 0-.825-.421-.741-.882.393-2.185 1.07-5.952 1.07-5.952s-2.773-2.653-4.382-4.191c-.16-.153-.232-.346-.232-.535 0-.352.249-.694.651-.748 2.211-.305 6.021-.829 6.021-.829s1.677-3.442 2.65-5.44z' />
    </svg>
);

const StarRatingNew = ({ rating, showOnlyFull }: IStarRatingNewProps) => {
    if (!rating) {
        return null;
    }

    const starsTotal = 5;

    // get rest of decimal part to use as percentage integer value
    const decimalPartOfRating = Math.round(Number((rating % 1).toFixed(2)) * 100);

    // build an array of percentage values
    const stars = Array.from({ length: showOnlyFull ? Math.round(rating) : starsTotal }, (_, k) => {
        const increm = 10;
        const res = rating / (k + 1) >= 1 ? 100 : decimalPartOfRating;

        // this adds more visibility for too low and too high values
        if (res > 0 && res <= 30) return res + increm;

        if (res >= 70 && res <= 90) return res - increm;

        return res;
    });
    // clean up array
    const starsfillOptions = stars.map((el, idx) => {
        if (idx > 0) {
            return stars[idx - 1] < 100 ? 0 : el;
        }

        return el;
    });

    if (showOnlyFull) {
        return (
            <div className={styles['star-rating']}>
                <div className={styles['star-rating__stars'] + ' ' + styles['star-rating__stars--filled']}>
                    {stars.map((_, idx) => (
                        <StarSvg key={`star-${idx}`} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles['star-rating']} data-tid='star-rating'>
            <div className={styles['star-rating__stars']}>
                {starsfillOptions.map((width, idx) => (
                    <div
                        key={`star-box-${idx}`}
                        className={
                            styles['star-rating__svg-box'] +
                            ' ' +
                            (width == 100 ? styles['star-rating__svg-box--filled'] : '')
                        }
                    >
                        <StarSvg />
                        {width !== 100 && width !== 0 && (
                            <div className={styles['star-rating__svg-box-fill']} style={{ width: `${width}%` }}>
                                <StarSvg />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StarRatingNew;

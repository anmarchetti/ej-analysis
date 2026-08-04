import { FC, useEffect, useMemo, useState } from 'react';
import { Image as ImageJSS, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IDestinationCarouselCard } from 'models/data/IDestinationCarousel';
import { MediaSize } from 'models/data/MediaSizeParams';
import { DestinationType } from 'models/enum/DestinationType';
import { ICardItem, ICountries } from 'frontend/components/renderings/DestinationsCarousel/DestinationsCarousel';

import styles from './DestinationCard.module.scss';

export interface ICardProps extends IDestinationCarouselCard {
    countries: Nullable<ICountries[]>;
    destinationType: DestinationType;
    isSelected: boolean;
    onSelectDestination: (selectedItem: ICardItem) => void;
    position: string;
}

const DestinationCard: FC<ICardProps> = ({
    Image,
    Name,
    KSPs,
    Code,
    countries,
    destinationType,
    onSelectDestination,
    position,
    isSelected,
}) => {
    const [selected, setSelected] = useState<boolean>(isSelected);

    useEffect(() => {
        setSelected(isSelected);
    }, [isSelected]);

    /** Review when AB test finishes EHD-140 + EJH-17022 */
    const location = useMemo(
        () => countries?.find(({ children }) => children?.includes(Code.value))?.name || '',
        [countries, Code],
    );

    const getBackgroundStyles = (): React.CSSProperties | undefined =>
        getSitecoreImageBackgroundStyles(Image, MediaSize.Small);

    const onSelect = () => {
        const selectedDestination: ICardItem = {
            name: Name?.value,
            position,
            category: destinationType,
            code: Code?.value,
        };
        onSelectDestination(selectedDestination);
        setSelected(prevSelected => !prevSelected);
    };

    return (
        <div
            className={classNames(styles.wrapper, selected && styles.selected)}
            data-tid='destination-card'
            onClick={onSelect}
        >
            <div className={styles.card}>
                <div className={styles.cardImage} style={getBackgroundStyles()}>
                    {Name?.value && <Text className={styles.cardLocation} field={Name} tag='h4' />}
                </div>
                <div className={styles.cardBody}>
                    {KSPs?.map(({ id, fields }) => {
                        const { KSP, Icon } = fields;
                        const content = Tokenizer.replaceToken(KSP.value, Tokens.Region, location);

                        return (
                            <div className={styles.itemWrapper} key={id} data-tid='destination-ksp'>
                                {Icon?.value && <ImageJSS field={Icon} className={styles.cardIcon} />}
                                {content && <p className={styles.cardItem}>{content}</p>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DestinationCard;

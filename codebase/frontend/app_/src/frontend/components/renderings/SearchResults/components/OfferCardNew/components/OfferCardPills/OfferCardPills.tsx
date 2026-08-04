import { FC } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import EcoCertifiedPill from 'frontend/components/common/EcoCertifiedPill';
import styles from 'frontend/components/renderings/SearchResults/components/OfferCardNew/OfferCardNew.module.scss';

type TOfferCardPillsPops = {
    isEcoCertifiedPill: boolean;
    isOfferUnavailableInShortlist: boolean;
    offer: IOffer;
    rendering: ISitecoreComponent['rendering'];
    routeDep: IRoute;
};

const OfferCardPills: FC<TOfferCardPillsPops> = ({
    isOfferUnavailableInShortlist,
    isEcoCertifiedPill,
    rendering,
    offer,
    routeDep,
}) => {
    const { hotel } = offer;

    return (
        <div className={classNames(styles.headerPills, 'offer-card-pills')}>
            {!isOfferUnavailableInShortlist && (
                <Placeholder
                    name={PlaceholderNames.PromotionalMessages}
                    rendering={rendering}
                    offer={offer}
                    routeDep={routeDep}
                />
            )}

            {isEcoCertifiedPill && hotel && (
                <EcoCertifiedPill isNewPill title={hotel.ecoFacility.name} tooltip={hotel.ecoFacility.tooltip} />
            )}
        </div>
    );
};

export default observer(OfferCardPills);

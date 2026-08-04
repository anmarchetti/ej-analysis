import useStore from 'frontend/hooks/useStore';
import { filterPackageIcons } from 'frontend/utils/offer.utils';
import { IExtraLuggageInfo } from 'models/data/IFlightExtras';
import { IThemePackageIcon } from 'models/data/IHotel';
import { ITransfer } from 'models/data/ITransfer';

interface IUsePackageIconsProps {
    extraLuggage: Nullable<IExtraLuggageInfo>;
    isLuxury: boolean;
    packageIcons: IThemePackageIcon[];
    transfer: Nullable<ITransfer>;
}

interface IUsePackageIconsData {
    getPhrase: (key: string) => string;
    customItems?: Array<{
        icon: {
            alt: string;
            src: string;
        };
        label: string;
    }>;
}

const usePackageIcons = ({
    isLuxury,
    packageIcons,
    transfer,
    extraLuggage,
}: IUsePackageIconsProps): IUsePackageIconsData => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const data = isLuxury
        ? {}
        : {
              customItems: filterPackageIcons(packageIcons, transfer, extraLuggage).map(i => ({
                  icon: {
                      alt: i.name,
                      src: i.iconUrl,
                  },
                  label: i.name,
              })),
          };

    return { getPhrase, ...data };
};

export default usePackageIcons;

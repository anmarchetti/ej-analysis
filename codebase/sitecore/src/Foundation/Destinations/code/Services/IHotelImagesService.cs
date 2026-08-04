using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IHotelImagesService
    {
        void Create(Item parentItem, List<string> imageUrls);

        void AddMissing(Item hotelItem, List<string> imageUrls);

        void ReplaceAll(Item parentItem, List<string> imageUrls);
    }
}

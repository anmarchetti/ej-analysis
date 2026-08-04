using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Requests;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IHotelRoomsService
    {
        void Create(Item hotelItem, List<RoomContent> rooms, string code);

        void Upsert(Item hotelItem, List<RoomContent> rooms, string code);
    }
}

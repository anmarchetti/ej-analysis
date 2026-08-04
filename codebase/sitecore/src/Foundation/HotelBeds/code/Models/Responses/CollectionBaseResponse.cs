using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    public abstract class CollectionBaseResponse<T> : BaseResponse<T>
        where T : BaseObject
    {
        public abstract IEnumerable<T> Data { get; set; }
    }
}

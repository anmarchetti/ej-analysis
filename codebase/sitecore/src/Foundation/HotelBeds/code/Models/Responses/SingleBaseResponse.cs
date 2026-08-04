using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;

namespace easyJet.Foundation.HotelBeds.Models.Responses
{
    public abstract class SingleBaseResponse<T> : BaseResponse<T>
        where T : BaseObject
    {
        public abstract T Data { get; set; }
    }
}

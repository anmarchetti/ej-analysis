using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Associate customer with booking
    /// </summary>
    [Serializable]
    [DataContract]
    public class AssignBookingRequest : GetBookingRequest
    {
    }
}

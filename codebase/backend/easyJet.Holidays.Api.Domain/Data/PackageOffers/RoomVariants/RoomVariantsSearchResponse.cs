using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants
{
    /// <summary>
    /// Alternative rooms response model
    /// </summary>
    [Serializable]
    [DataContract]
    public class RoomVariantsSearchResponse
    {
        /// <summary>
        /// ALternative rooms for each guests mix
        /// </summary>
        [DataMember]
        public IList<IEnumerable<Unit>> Rooms { get; init; }

        [DataMember]
        public IList<AltBoardType> AltBoards { get; init; }
    }
}

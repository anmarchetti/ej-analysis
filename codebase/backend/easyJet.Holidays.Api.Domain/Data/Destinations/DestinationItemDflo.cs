using System.Runtime.Serialization;


namespace easyJet.Holidays.Api.Domain.Data.Destinations
{
    /// <summary>
    /// Destination item with image
    /// </summary>
    public class DestinationItemData : DestinationItem
    {
        public DestinationItemData(DestinationItem destinationItem)
        {
            AirportCodes = destinationItem.AirportCodes;
            Available = destinationItem.Available;
            Children = destinationItem.Children;
            Code = destinationItem.Code;
            GiataCode = destinationItem.GiataCode;
            Name = destinationItem.Name;
            ItemName = destinationItem.ItemName;
            Parents = destinationItem.Parents;
            RelatedRegions = destinationItem.RelatedRegions;
            RelatedResorts = destinationItem.RelatedResorts;
            ShowOnSearchPod = destinationItem.ShowOnSearchPod;
            Type = destinationItem.Type;
        }

        /// <summary>
        /// Url to image from cms
        /// </summary>
        [DataMember]
        public string ImageUrl { get; set; }
    }
}

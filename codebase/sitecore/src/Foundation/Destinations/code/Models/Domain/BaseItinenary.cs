using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class BaseItinenary
    {
        // Requires for deserialization
        public BaseItinenary()
        {
        }

        public BaseItinenary(Item item)
        {
            if (item == null)
            {
                return;
            }

            Name = item.Fields[Constants.Fields.DatasourceItem.Name]?.Value;
            Description = item.Fields[Constants.Fields.DatasourceItem.Description]?.Value;
            Duration = item.Fields[Constants.Fields.BaseItinerary.Duration]?.Value;
        }

        public string Name { get; set; }

        public string Description { get; set; }

        public string Duration { get; set; }
    }
}
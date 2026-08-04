using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class DatasourceObjectWithImage : DatasourceObject
    {
        public string Image { get; set; }

        public DatasourceObjectWithImage()
        {
        }

        public DatasourceObjectWithImage(BaseDatasourceSearchResultItem item)
            : base(item)
        {
            Image = item.Image;
        }

        public DatasourceObjectWithImage(Item item, bool buildUrl = false)
            : base(item, buildUrl)
        {
            Image = item?.GetSmallMediaUrl(Constants.Fields.SitecoreImageItem.Image);
        }
    }
}

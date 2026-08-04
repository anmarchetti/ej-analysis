using Schema.NET;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Services
{
    public interface ISchemaFactory
    {
        /// <summary>
        /// Returns json schema by item.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Schema.</returns>
        WebSite GetSchema(Item item);
    }
}

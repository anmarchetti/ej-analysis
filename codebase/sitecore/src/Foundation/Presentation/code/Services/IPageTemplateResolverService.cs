using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Services
{
    /// <summary>
    /// Resolves the Sitecore template ID of a content item by its item ID.
    /// Encapsulates the "look up item → read TemplateID" pattern so callers
    /// do not need direct database access and the behaviour is independently testable.
    /// </summary>
    public interface IPageTemplateResolverService
    {
        /// <summary>
        /// Returns the <see cref="ID"/> of the template assigned to the item identified by
        /// <paramref name="pageItemId"/> in the specified database.
        /// Returns <see cref="ID.Null"/> when the item is not found.
        /// </summary>
        ID ResolveTemplateId(ID pageItemId, DatabaseType databaseType);
    }
}

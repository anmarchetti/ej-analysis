using System.Collections.Generic;
using System.Linq;

namespace easyJet.Foundation.Multisite.Services
{
    public interface IContentService
    {
        /// <summary>
        /// Get item fields by path.
        /// </summary>
        /// <param name="path">Item path.</param>
        /// <param name="withChildren">Include children or not.</param>
        /// <param name="readAll">Get values from standart fields.</param>
        /// <returns>Items fields.</returns>
        Dictionary<string, object> GetContentByPath(string path, bool withChildren = false, bool readAll = false);
    }
}

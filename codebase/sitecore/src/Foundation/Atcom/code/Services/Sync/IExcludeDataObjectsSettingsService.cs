using System.Collections.Generic;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Atcom.Services.Sync
{
    public interface IExcludeDataObjectsSettingsService
    {
        HashSet<string> GetCodes();
    }
}
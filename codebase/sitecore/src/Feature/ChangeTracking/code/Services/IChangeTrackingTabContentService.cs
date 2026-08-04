using System.Collections.Generic;
using easyJet.Feature.ChangeTracking.Models;
using Sitecore.Data;

namespace easyJet.Feature.ChangeTracking.Services
{
    public interface IChangeTrackingTabContentService
    {
        List<ChangeSetViewModel> GetModels(ItemUri itemUri);
    }
}
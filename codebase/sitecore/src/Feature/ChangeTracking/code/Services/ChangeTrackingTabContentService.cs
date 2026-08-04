using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.ChangeTracking.Mappers;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;

namespace easyJet.Feature.ChangeTracking.Services
{
    [Service(typeof(IChangeTrackingTabContentService), Lifetime = Lifetime.Singleton)]
    public class ChangeTrackingTabContentService : IChangeTrackingTabContentService
    {
        private readonly IChangeTrackingService changeTracking;
        private readonly IDatabaseProvider databaseProvider;

        public ChangeTrackingTabContentService(IChangeTrackingService changeTracking, IDatabaseProvider databaseProvider)
        {
            this.changeTracking = changeTracking;
            this.databaseProvider = databaseProvider;
        }

        public List<ChangeSetViewModel> GetModels(ItemUri itemUri)
        {
            var item = databaseProvider.GetItem(itemUri);
            var history = changeTracking.GetChangeSets(item, DateTime.Now.AddYears(-200), DateTime.Now);
            return history.Select(i => ChangeSetMapper.CreateViewModel(i, item.Database)).ToList();
        }
    }
}
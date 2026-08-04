using System;
using System.Configuration;
using System.Data.Entity;
using System.Diagnostics.CodeAnalysis;
using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Personalize;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Configuration;
using Sitecore.Diagnostics;

namespace easyJet.Feature.Tracker.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(ITrackingDatabaseService), Lifetime = Lifetime.Transient)]
    public class TrackingDatabaseService : DbContext, ITrackingDatabaseService
    {
        public DbSet<PersonalizationTrackingItem> TrackingItems { get; set; }

        private static string ConnectionString => $"{ConfigurationManager.ConnectionStrings[Factory.GetDatabase("web").ConnectionStringName].ConnectionString}";

        static TrackingDatabaseService()
        {
            // don't let EF modify the database schema...
            Database.SetInitializer<TrackingDatabaseService>(null);
        }

        public TrackingDatabaseService()
            : base(ConnectionString)
        {
        }

        public async Task Save(PersonalizationOrderCheckout data)
        {
            if (TrackingItems == null)
            {
                Log.Warn("[database order tracking] Data set is not properly initailized", this);
                return;
            }

            if (data?.Experiences == null)
            {
                Log.Warn("[database order tracking] Tracking data passed from client is null", this);
                return;
            }

            try
            {
                foreach (var dataExperience in data.Experiences)
                {
                    TrackingItems.Add(new PersonalizationTrackingItem
                    {
                        Experience = dataExperience.Key,
                        AttributeId = dataExperience.Value,
                        Price = data.Price,
                        BookingReference = data.ReferenceId,
                        Currency = data.CurrencyCode,
                        Date = DateTime.UtcNow,
                    });
                }

                await SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Log.Error("Error submitting data to database", ex, this);
            }
        }
    }
}

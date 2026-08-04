using System.Data.Entity;
using easyJet.Feature.ChangeTracking.Models;

namespace easyJet.Feature.ChangeTracking.Services
{
    public interface IDatabaseContextService
    {
        DbSet<ChangeTrackingFieldChange> FieldChanges { get; set; }

        DbSet<ChangeTrackingItemChange> ItemChanges { get; set; }

        int SaveChanges();
    }
}
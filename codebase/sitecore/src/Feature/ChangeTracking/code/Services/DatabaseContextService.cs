using System.ComponentModel.DataAnnotations.Schema;
using System.Configuration;
using System.Data.Entity;
using System.Diagnostics.CodeAnalysis;
using easyJet.Feature.ChangeTracking.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Configuration;

namespace easyJet.Feature.ChangeTracking.Services
{
    [ExcludeFromCodeCoverage]
    [Service(typeof(IDatabaseContextService), Lifetime = Lifetime.Transient)]
    public class DatabaseContextService : DbContext, IDatabaseContextService
    {
        private static string ConnectionString => $"{ConfigurationManager.ConnectionStrings[Factory.GetDatabase("master").ConnectionStringName].ConnectionString}";

        static DatabaseContextService()
        {
            // don't let EF modify the database schema...
            Database.SetInitializer<DatabaseContextService>(null);
        }

        public DatabaseContextService()
            : base(ConnectionString)
        {
        }

        public virtual DbSet<ChangeTrackingFieldChange> FieldChanges { get; set; }

        public virtual DbSet<ChangeTrackingItemChange> ItemChanges { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChangeTrackingItemChange>()
                .Property(e => e.Action)
                .IsFixedLength().HasDatabaseGeneratedOption(DatabaseGeneratedOption.None)
                .IsUnicode(false);
        }
    }
}

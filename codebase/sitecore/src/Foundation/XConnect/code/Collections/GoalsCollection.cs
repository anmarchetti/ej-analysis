using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.XConnect.Common.Goals;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Collections
{
    [ExcludeFromCodeCoverage]
    public class GoalsCollection
    {
        public static XdbModel Model { get; } = BuildModel();

        private static XdbModel BuildModel()
        {
            var modelBuilder = new XdbModelBuilder("GoalsCollection", new XdbModelVersion(0, 1));

            modelBuilder.ReferenceModel(Sitecore.XConnect.Collection.Model.CollectionModel.Model);
            modelBuilder.DefineEventType<HotelDetails>(false);

            return modelBuilder.BuildModel();
        }
    }
}
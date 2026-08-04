using System.Collections.Generic;
using System.Configuration;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using easyJet.Foundation.XConnect.Common.Collections;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.ModelGenerator
{
    [ExcludeFromCodeCoverage]
    public static class ModelGenerator
    {
        private static string DestinationPath => ConfigurationManager.AppSettings["destinationPath"];

        private static readonly List<(string, XdbModel)> Facets = new List<(string, XdbModel)>
        {
            ("PushNotifications", PushNotifications.Models.CollectionModel.Model),
            ("Bookings", BookingsCollection.Model),
            ("GoalsCollection", GoalsCollection.Model),
            ("ContactCollection", ContactCollection.Model),
            ("EmailCollection", EmailCollection.Model),
            ("ChatBotCollection", ChatBotCollection.Model)
        };

        public static void Serialize()
        {
            CheckAndCreateDestinationFolders();

            foreach (var (facetCollection, model) in Facets)
            {
                var json = Sitecore.XConnect.Serialization.XdbModelWriter.Serialize(model);
                var targetPath = $"{DestinationPath}easyJet.Foundation.{facetCollection}.Model.json";
                File.WriteAllText(targetPath, json);
            }
        }

        private static void CheckAndCreateDestinationFolders()
        {
            if (!Directory.Exists(DestinationPath))
            {
                Directory.CreateDirectory(DestinationPath);
            }
        }
    }
}

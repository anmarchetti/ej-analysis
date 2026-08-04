using System;
using easyJet.Foundation.SitecoreExtensions.Attributes;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.SitecoreExtensions.Helper
{
    public static class ItemContextJobHelper
    {
        public static Item GetContextItem(string id, string lang, string database)
        {
            if (string.IsNullOrEmpty(lang) || string.IsNullOrEmpty(id))
            {
                throw new ArgumentException($"Arguments are empty. Language: {lang}, ID: {id}");
            }

            var db = Factory.GetDatabase(database) ?? Context.Database ?? Context.ContentDatabase;
            var contextItem = db.GetItem(id, Language.Parse(lang));
            return contextItem;
        }

        /// <summary>
        /// Create and get log message with current date.
        /// </summary>
        /// <param name="message">Message.</param>
        /// <returns>Log message with current date.</returns>
        public static string GetLogMessage(string message)
        {
            return $"[{DateTime.Now.Hour}:{DateTime.Now.Minute}:{DateTime.Now.Second}] {message} {Environment.NewLine}";
        }
    }
}
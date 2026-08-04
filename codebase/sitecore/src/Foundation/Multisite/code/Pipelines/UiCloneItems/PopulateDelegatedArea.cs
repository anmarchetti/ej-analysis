using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Multisite.Services;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Pipelines;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.Multisite.Pipelines.UiCloneItems
{
    public class PopulateDelegatedArea
    {
        private readonly IDelegatedAreaService delegatedAreaService;
        private readonly BaseFactory factory;

        public PopulateDelegatedArea(IDelegatedAreaService delegatedAreaService, BaseFactory factory)
        {
            this.delegatedAreaService = delegatedAreaService;
            this.factory = factory;
        }

        /// <summary>
        /// Add destination item to delegated area setting.
        /// </summary>
        /// <param name="args">Arguments.</param>
        public void Process(CopyItemsArgs args)
        {
            if (args.Parameters["delegatedArea"] == null)
            {
                return;
            }

            Database database = factory.GetDatabase(args.Parameters["database"]);
            if (database == null)
            {
                return;
            }

            Item targetItem = database.GetItem(args.Parameters["destination"]);
            if (targetItem == null || args.Copies == null || (!args.Copies.Any() || delegatedAreaService.AddToDelegatedArea(args.Copies.First(), targetItem)))
            {
                return;
            }

            SheerResponse.Alert("This is a delegated area and items cannot be added.");
        }
    }
}
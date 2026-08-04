using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Configuration;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    public abstract class BaseCsvCommand : BaseItemProgressReportingCommand
    {
        private readonly ICsvUtilsService csvUtilsService;

        protected BaseCsvCommand(
            IDatabaseProvider databaseProvider,
            ICsvUtilsService csvUtilsService,
            ILogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
            this.csvUtilsService = csvUtilsService;
        }

        protected UploadCommandParam Settings => UploadCommandParamConfiguration.GetItemByCommandName(Name);

        /// <inheritdoc />
        protected internal override bool IsCommandContextValid(CommandContext context)
        {
            if (!ValidateSettings())
            {
                return false;
            }

            var item = context.Items.FirstOrDefault();
            var shouldShowItem = item?.TemplateID.Equals(Settings.TemplateId) ?? false;

            if (!shouldShowItem)
            {
                return false;
            }

            FileField file = item.Fields[Settings.FileFieldId];

            return file.ContainsCsvFile();
        }

        /// <summary>
        /// Get file model from File field.
        /// </summary>
        /// <typeparam name = "T" > Convert type.</typeparam>
        /// <param name="contextItem">Sitecore Item.</param>
        /// <param name="classMap">Register a class map</param>
        /// <returns>Collections of converted data.</returns>
        protected internal virtual List<T> GetFileData<T>(Item contextItem, Type classMap = null)
             where T : class, new()
        {
            if (!ValidateSettings())
            {
                return new List<T>();
            }

            var fileItem = new FileField(contextItem.Fields[Settings.FileFieldId])?.MediaItem;

            if (fileItem == null)
            {
                return new List<T>();
            }

            var fileParameters = new FileParameters()
            {
                FileDataDelimiter = Settings.CsvDelimiter,
                HasHeaderRecord = true,
            };

            if (classMap != null)
            {
                fileParameters.ClassMap = classMap;
            }

            using (var csvFile = new CsvFile(fileItem))
            {
                return csvUtilsService.ReadFromCsv<T>(csvFile.Stream, fileParameters);
            }
        }

        /// <summary>
        /// Validate Settings for Upload Command.
        /// </summary>
        /// <returns><see langword="True"/> if Settings are valid.</returns>
        protected internal virtual bool ValidateSettings()
        {
            if (Settings == null)
            {
                Logger.Warn($"Settings for command {Name} can not be set. Check config files.", this);
                return false;
            }

            return true;
        }

        protected override void PostAction(ClientPipelineArgs args)
        {
            if (args.Parameters[Constants.JobFailedIdentifier] != bool.TrueString)
            {
                Context.ClientPage.ClientResponse.Alert("Data from CSV file was uploaded successfully.");
                base.PostAction(args);
            }
        }
    }
}
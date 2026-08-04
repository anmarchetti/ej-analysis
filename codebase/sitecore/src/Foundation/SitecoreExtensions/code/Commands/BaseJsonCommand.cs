using System.IO;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.Configuration;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Services;
using Newtonsoft.Json;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Shell.Framework.Commands;

namespace easyJet.Foundation.SitecoreExtensions.Commands
{
    public abstract class BaseJsonCommand : BaseItemProgressReportingCommand
    {
        protected BaseJsonCommand(
            IDatabaseProvider databaseProvider,
            ILogger logger,
            IUserCreationService userCreationService,
            ISitecoreUIService sitecoreUiService)
            : base(databaseProvider, logger, userCreationService, sitecoreUiService)
        {
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

            return file.ContainsJsonFile();
        }

        /// <summary>
        /// Get file model from File field.
        /// </summary>
        /// <typeparam name = "T" > Convert type.</typeparam>
        /// <param name="contextItem">Sitecore Item.</param>
        /// <returns>Collections of converted data.</returns>
        protected internal virtual T GetFileData<T>(Item contextItem)
             where T : class, new()
        {
            if (!ValidateSettings())
            {
                return new T();
            }

            MediaItem fileItem = new FileField(contextItem.Fields[Settings.FileFieldId])?.MediaItem;

            if (fileItem == null)
            {
                return new T();
            }

            using (StreamReader sr = new StreamReader(fileItem.GetMediaStream()))
            {
                string content = sr.ReadToEnd();
                return JsonConvert.DeserializeObject<T>(content);
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
                return false;
            }

            return true;
        }
    }
}
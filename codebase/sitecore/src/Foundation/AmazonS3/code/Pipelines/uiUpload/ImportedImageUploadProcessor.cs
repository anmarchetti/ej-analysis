using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Pipelines;
using Sitecore.Pipelines.Upload;

namespace easyJet.Foundation.AmazonS3.Pipelines.uiUpload
{
    /// <summary>Saves the uploaded files.</summary>
    public class ImportedImageUploadProcessor : UploadProcessor
    {
        private const string Underscore = "_";
        private readonly string imagesRootPath = Settings.GetSetting("AmazonS3.SitecoreImagesPath");

        private readonly IAmazonS3Logger logger;
        private readonly IHttpContextAccessor httpContextAccessor;

        public ImportedImageUploadProcessor(IAmazonS3Logger logger, IHttpContextAccessor httpContextAccessor)
        {
            this.logger = logger;
            this.httpContextAccessor = httpContextAccessor;
        }

        public void Process(UploadArgs args)
        {
            try
            {
                // Set the timeout for bulk upload to 20 min (default is current 10 min configured in web.config)
                httpContextAccessor.GetCurrent().Server.ScriptTimeout = (int)TimeSpan.FromMinutes(20).TotalSeconds;
                var keepOriginal = IsKeepOriginalChecked();

                var matched = false;
                var batch = new List<ImagePipelineArgs>();
                foreach (var item in args.UploadedItems)
                {
                    if (!matched && !(item.HasBaseTemplate(new TemplateID(Constants.TemplateIds.SystemImage)) && item.Paths.ParentPath.StartsWith(imagesRootPath)))
                    {
                        continue;
                    }

                    if (item.Paths.ParentPath.Equals(imagesRootPath.TrimEnd(new[] { '/' })))
                    {
                        var argsErrorText = $"The ZIP archive has the wrong format.{Environment.NewLine}The file {item.Name} should be placed in a folder named after the hotel code it belongs to.{Environment.NewLine} Please modify the file and try again.";
                        args.ErrorText += argsErrorText;
                        logger.Error(argsErrorText, this);
                    }
                    else
                    {
                        matched = true;
                        var atcomHotelCode = item.Parent.Name.Split(new[] { Underscore }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
                        var itemCode = item.Name.Split(new[] { Underscore }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
                        batch.Add(new ImagePipelineArgs { ImageItem = item, HotelCode = atcomHotelCode, ItemCode = itemCode, KeepOriginal = keepOriginal });
                    }
                }

                if (batch.Any())
                {
                    CorePipeline.Run("AmazonS3BatchSyncPipeline", new BatchSyncPipelineArgs { Batch = batch });
                }

                if (!matched)
                {
                    logger.Debug($"Item was not resolved or located outside part: {imagesRootPath}.", this);
                }
            }
            catch (Exception e)
            {
                logger.Error(e.Message, e, this);
                args.ErrorText += e.Message;
            }
        }

        private bool IsKeepOriginalChecked()
        {
            var keepOriginalValue = httpContextAccessor.GetCurrent()?.Request?.Form[Constants.Dialogs.KeepOriginalCheckboxName];
            return string.Equals(keepOriginalValue, "1", StringComparison.Ordinal);
        }
    }
}

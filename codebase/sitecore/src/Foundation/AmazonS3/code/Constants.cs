using System.Diagnostics.CodeAnalysis;
using Sitecore.Data;

namespace easyJet.Foundation.AmazonS3
{
    [ExcludeFromCodeCoverage]
    public class Constants
    {
        public struct TemplateIds
        {
            public static readonly ID SystemImage = new ID("{F1828A2C-7E5D-4BBD-98CA-320474871548}");
            public static readonly ID HotelImageReport = new ID("{30642443-0E09-4889-BBA2-0239EEF8E04F}");
            public static readonly ID Zip = new ID("{4F4A3A3B-239F-4988-98E1-DA3779749CBC}");
        }

        public struct Settings
        {
            public const string ReportPathSettingsName = "AmazonS3.ReportPath";
            public const string AcmiBucketNameSettingsName = "AmazonS3.AcmiBucketName";
            public const string ImageBucketNameSettingsName = "AmazonS3.ImageBucketName";
            public const string ImageSizeSmallSettingsName = "AmazonS3.ImageSize.Smal";
            public const string ImageSizeMediumSettingsName = "AmazonS3.ImageSize.Medium";
            public const string ImageSizeLargeSettingsName = "AmazonS3.ImageSize.Large";
            public const string SitecoreImagesPathSettingsName = "AmazonS3.SitecoreImagesPath";
            public const string BatchUploadCustomDialogUrlSettingsName = "AmazonS3.BatchUpload.CustomDialogUrl";
            public const string ImportHotelImagesKeepOriginalProfileKey = "AmazonS3.ImportHotelImages.KeepOriginal";
            public const string AllowDeleteImagesFromS3SettingsName = "AmazonS3.AllowDeleteImagesFromS3";
            public const string ImageReportLifeSpanInDaysSettingsName = "AmazonS3.ImageReportLifeSpanInDays";
            public const string RegionSettingsName = "AmazonS3.Region";

            public const int ImageReportLifeSpanInDaysDefaultValue = 10;
            public const int LargeImageSizeDefaultValue = 1024;
            public const int MediumImageSizeDefaultValue = 800;
            public const int SmallImageSizeDefaultValue = 320;
            public const bool AllowDeleteImagesFromS3DefaultValue = true;
        }

        public struct Dialogs
        {
            public const string DefaultUploadDialogUrl = "/sitecore/shell/Applications/Media/UploadManager/Upload.aspx";
            public const string CustomUploadDialogUrl = "/sitecore/shell/Applications/Media/UploadManager/EasyJetBulkUpload.aspx";
            public const string UploadResultDialogUrl = "/sitecore/shell/Applications/Media/UploadManager/Result.aspx";
            public const string KeepOriginalCheckboxName = "KeepOriginal";
        }

        public struct FieldsIds
        {
            public static readonly ID Media = new ID("{40E50ED9-BA07-4702-992E-A912738D32DC}");
            public static readonly ID Size = new ID("{6954B7C7-2487-423F-8600-436CB3B6DC0E}");
        }

        public struct FieldsName
        {
            public static readonly string AtcomCode = "AtcomCode";
            public static readonly string ImageName = "ImageName";
            public static readonly string Status = "Status";
            public static readonly string Message = "Message";
            public static readonly string DateTime = "DateTime";
        }

        public struct ImageNames
        {
            public const string OriginalImageFolder = "Original";
        }

        public struct LeaseFlightTool
        {
            public const string InputFileField = "Input File";
            public const string StatusField = "Status";
            public const string OutputField = "Output";

            public static readonly ID TemplateId = new ID("{D434F63A-E43F-4329-B825-5E4A95C4B6DE}");
        }

        public struct Jobs
        {
            public struct ProgressStatuses
            {
                public const string InProgress = "In progress";
                public const string Success = "Success";
                public const string Failed = "Failed";
            }

            public struct BulkToolJob
            {
                public const string Name = "Upload lease flights to S3";
            }
        }
    }
}

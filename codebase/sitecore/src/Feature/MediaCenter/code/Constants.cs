using Sitecore.Data;

namespace easyJet.Feature.MediaCenter
{
    public struct Constants
    {
        public struct Common
        {
            public static readonly string MasterDb = "master";
        }

        public struct TemplateNames
        {
        }

        public struct TemplateIds
        {
            public static readonly ID MediaCenterPage = new ID("{A5A1C3C6-76BD-448E-9709-4CD6957A4813}");
            public static readonly ID ContentHubPage = new ID("{99755ECC-B50F-419C-9F80-95E013672D94}");
            public static readonly ID ArticlePage = new ID("{A3A83479-5CEC-440E-9B30-A7AD70121343}");
            public static readonly ID TopicsFolder = new ID("{96B44174-B3B5-4D27-9DD3-7D5EB28307DF}");
            public static readonly ID Topic = new ID("{BA13D0EE-2A1A-493B-A047-9D149D5D43B9}");
        }

        public struct FieldsIds
        {
            public class ArticlePageItem
            {
                public static readonly ID IsTopArticle = new ID("{67760325-0959-4E9D-8D85-1E6B4C1D51DB}");
            }
        }

        public struct Fields
        {
            public class MediaCentreItem
            {
                public const string Title = "Title";
                public const string Description = "Description";
            }

            public class ArticlePageItem
            {
                public const string Title = "Title";
                public const string TopContent = "TopContent";
                public const string BottomContent = "BottomContent";
                public const string Image = "Image";
                public const string PublicationDate = "PublicationDate";
                public const string Topics = "Topics";
                public const string IsTopArticle = "IsTopArticle";
            }

            public class TopicItem
            {
                public const string Name = "Name";
            }
        }
    }
}
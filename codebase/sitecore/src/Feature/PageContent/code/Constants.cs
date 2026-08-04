using Sitecore.Data;

namespace easyJet.Feature.PageContent
{
    public struct Constants
    {
        public struct TemplateIds
        {
            public static readonly ID HealthEntryRequirementFolder = new ID("{A6B07161-D9E0-40D1-9BEF-92C7C1954538}");
            public static readonly ID HealthEntryRequirementsBlock = new ID("{AE5DA933-19F8-4B3B-A158-4FE856A6C1F5}");
            public static readonly ID FcdoRequirementTile = new ID("{26A7902F-6625-42AD-89D3-8E8A332B2311}");
            public static readonly ID HealthEntryRequirementTile = new ID("{899A5AAA-E367-4D14-9913-3E5866C6CB7B}");
            public static readonly ID FaqItem = new ID("{D98F63A2-9FBC-44BF-94B3-64638887B391}");
            public static readonly ID FaqCategory = new ID("{89E3CED7-6DD2-4026-AFB7-3D94D9F4B334}");
            public static readonly ID QuestionAndAnswer = new ID("{C9FD0113-5386-4ACB-B11C-0C14AD77FFD8}");
            public static readonly ID QuestionsAndAnswersFolder = new ID("{48403D80-0E80-447F-84CC-D2C218D0F2A3}");
            public static readonly ID BasePage = new ID("{168F65DC-9ECD-4A6E-AD93-A46464E45F79}");
            public static readonly ID PeriodDrivenPromoPage = new ID("{DB1C19B1-7A2D-4212-BBDE-3CACF53D37C9}");
            public static readonly ID HolidaysUnderFolder = new ID("{A23790C0-A22E-4679-8F4B-FDDF84083454}");
            public static readonly ID FooterLinkContainer = new ID("{E8DA8930-0BA7-429C-A456-5AF4B1FE5F45}");
            public static readonly ID FooterLinkGroup = new ID("{1B204F54-36FA-49DB-85C6-A83F175A876E}");
            public static readonly ID FooterLink = new ID("{9B729F16-D4B8-43A6-AF87-0053DC128ACA}");
            public static readonly ID TransparentFolder = new ID("DEBFE2B9-F6DE-4C85-ABEA-B8DAA3066264");
            public static readonly ID RecommendedDestination = new ID("{4E2D07A2-8E63-4F1A-904E-C242919571A0}");
            public static readonly ID InspireDestinationsMeFolder = new ID("{AAFE1B4C-B297-401D-BDC1-5628264136BC}");
            public static readonly ID NavigationLink = new ID("{BC011F0A-976C-4825-9E01-8BAA7C8E6CCA}");
        }

        public struct Pipelines
        {
            public const string GetItemUrl = "easyJet.GetItemUrl";

            public struct ResolvePathToItem
            {
                public const string Name = "easyJet.ResolvePathToItem";
                public const string CreateResolveItemResult = "easyJet.ResolvePathToItem.CreateResolveItemResult";
                public const string IsValidItem = "easyJet.ResolvePathToItem.IsValidItem";
            }
        }

        public struct QueryParameters
        {
            public class DeepLink
            {
                public const string HelpCategory = "helpCategory";
                public const string HelpQuestion = "helpQuestion";
            }
        }

        public struct ItemNames
        {
            public const string HealthEntryRequirementsFolder = "Health Entry Requirements";
            public const string FlightAndHotelHealthEntryRequirementsFolder = "Health Entry Requirements F and H";
        }

        public struct Fields
        {
            public struct HealthEntryRequirementTile
            {
                public const string Title = "Title";
                public const string Description = "Description";
                public const string Image = "Image";
                public const string Icon = "Icon";
                public const string CTA = "CTA";
                public const string TrackingLabel = "TrackingLabel";
            }

            public struct FcdoRequirementTile
            {
                public const string LinkText = "LinkText";
            }

            public struct NavigationLink
            {
                public const string Link = "Link";
            }

            public struct HealthEntryRequirementsBlock
            {
                public const string Airports = "Airports";
                public const string HealthEntryRequirements = "HealthEntryRequirements";
                public const string IsDefault = "IsDefault";
            }

            public class WhatIsIncludedBlockItem
            {
                public const string Title = "Title";
                public const string NoteText = "NoteText";
                public const string IconsFolder = "IconsFolder";
            }

            public class FeaturedHotelsItem
            {
                public const string Title = "Title";
                public const string Description = "Description";
                public const string FeaturedHotels = "FeaturedHotels";
            }

            public class DeepLinkItem
            {
                public const string NavigationParameter = "NavigationParameter";
            }

            public class QuestionAndAnswer
            {
                public const string Question = "Question";
                public const string Answer = "Answer";
            }

            public class DealsPromo
            {
                public const string RequestedSearch = "RequestedSearch";
            }

            public struct DealsLinks
            {
                public const string Title = "Title";
                public const string Subtitle = "Subtitle";
                public const string Icon = "Icon";
                public const string Pages = "Pages";
            }

            public struct SEOLinks
            {
                public const string Title = "Title";
                public const string Links = "Links";
                public const string UseMasterData = "UseMasterData";
                public const string MasterTabData = "MasterTabData";
            }

            public struct TransparentFolder
            {
                public const string TransparentItem = "TransparentItem";
            }

            public struct FooterLinkContainer
            {
                public const string DesktopTitle = "DesktopTitle";
                public const string MobileTitle = "MobileTitle";
                public const string ListOfTitles = "ListOfTitles";

                public struct FooterLinkGroup
                {
                    public const string Title = "Title";
                    public const string ListOfSubtitles = "ListOfSubtitles";

                    public struct FooterLink
                    {
                        public const string Subtitle = "Subtitle";
                        public const string Link = "SubtitleLink";
                    }
                }
            }

            public struct RecommendedDestination
            {
                public const string Destination = "Destination";
                public const string Tags = "Tags";
            }
        }

        public struct FieldIds
        {
            public class PromoPage
            {
                public static readonly ID StartDate = new ID("{05D98CF9-06D0-4D89-90B7-7C2146715C1F}");
                public static readonly ID EndDate = new ID("{66263F4B-4A48-4B11-BBBC-5252CCFE2FA3}");
            }

            public class HolidaysUnderFolder
            {
                public static readonly ID Pills = new ID("{F74C1875-1B06-47C6-A78F-60AB75FADB47}");
            }

            public struct HealthEntryRequirementsBlock
            {
                public static readonly ID Airports = new ID("{56687DE0-8CB7-44B5-8B3B-970F45A3D1EA}");
            }
        }
    }
}
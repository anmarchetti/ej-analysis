using System.Collections.Generic;
using System.Runtime.Serialization;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations
{
#pragma warning disable S1192 // S1192: String literals should not be duplicated - this is a constants class, so duplication is expected.
    public struct Constants
    {
        public struct Common
        {
            public const string CheckboxTrueValue = "1";
            public const string CheckboxFalseValue = "0";
            public const string StandardValues = "__Standard Values";
            public const string Default = "default";
            public const string Unknown = "unknown";
        }

        public struct TemplateNames
        {
            public const string Country = "Country";
            public const string VirtualCountry = "VirtualCountry";
            public const string VirtualRegion = "VirtualRegion";
            public const string Region = "Region";
            public const string RegionCity = "Region - City";
            public const string VirtualResort = "VirtualResort";
            public const string Resort = "Resort";
            public const string Hotel = "Hotel";
        }

        public struct AccommodationReferences
        {
            public static readonly KeyValuePair<ID, ID> Boards = new KeyValuePair<ID, ID>(TemplateIds.AccommodationBoardsFolder, TemplateIds.AccommodationBoard);
            public static readonly KeyValuePair<ID, ID> Facilities = new KeyValuePair<ID, ID>(TemplateIds.AccommodationFacilitiesFolder, TemplateIds.AccommodationFacility);
            public static readonly KeyValuePair<ID, ID> Rooms = new KeyValuePair<ID, ID>(TemplateIds.AccommodationRoomsFolder, TemplateIds.AccommodationRoom);
            public static readonly KeyValuePair<ID, ID> Transfers = new KeyValuePair<ID, ID>(TemplateIds.AccommodationTransfersFolder, TemplateIds.AccommodationTransfer);
        }

        public struct TemplateIds
        {
            public static readonly ID BaseCode = new ID("{7C47FDF5-86E2-4D0B-9F8F-8AC4F0293BF6}");

            public static readonly ID AirportsFolder = new ID("{F12C5FDC-1DB7-4EAC-865F-00EF6418FBD9}");
            public static readonly ID AirportsGroup = new ID("{1DF13BFC-E83F-4B30-91F4-A082A6F94900}");
            public static readonly ID Airport = new ID("{9B7D85B4-E5CF-42E7-B533-B20FB55EC18D}");

            public static readonly ID DestinationsFolder = new ID("{41831D30-A4BD-4AD0-B5F2-A3D0A6F7828A}");
            public static readonly ID Country = new ID("{5F03C6EF-EF52-4F2E-BC5A-B1F065A1E745}");
            public static readonly ID Location = new ID("{2F42EC14-7E56-467A-B300-AB9723C74546}");
            public static readonly ID LocationCity = new ID("{33B3542E-1316-40CA-8971-1CDB3C1D452D}");
            public static readonly ID Resort = new ID("{538939B3-07EC-4C23-BF8C-3A68DE0FDC93}");
            public static readonly ID Accommodation = new ID("{28E5E169-8F72-4F90-A277-280A8302B607}");

            public static readonly ID RoomTypesFolder = new ID("{BCD8AA4E-9306-45CF-8C4A-41EF88AF851B}");
            public static readonly ID AtcomRoomTypesGroup = new ID("{21F3814B-F8F0-4E7A-B91B-04CD1C2FAF45}");
            public static readonly ID HotelBedsRoomTypesGroup = new ID("{F9678D2F-34CE-4F11-AE0B-C9181C2E3C39}");
            public static readonly ID RoomType = new ID("{85911381-FCEA-453C-89A7-D8B86532EBE0}");

            public static readonly ID RoomFacilitiesFolder = new ID("{EA39971C-094D-4BEC-A479-9171279553C0}");
            public static readonly ID RoomFacility = new ID("{1EC134E4-4753-498E-9D1A-6DC67A8975BE}");
            public static readonly ID RoomTypeFacilityGroup = new ID("{AC73B887-BF1B-4ACE-9F29-77B00BCF1983}");

            public static readonly ID SeasonalFacilitiesFolder = new ID("{AF70896C-BB8D-4B28-BBCD-CAC5F1FD8AAD}");
            public static readonly ID SeasonalFacility = new ID("{6D88B737-8EF6-4403-A1D4-7C34006E1126}");

            public static readonly ID StarRatingsFolder = new ID("{8C2B3723-24ED-4769-82D3-597F9F12ACFC}");
            public static readonly ID StarRating = new ID("{C170404A-44A8-4069-AFB7-22A694E46628}");

            public static readonly ID FacilityTypologiesFolder = new ID("{5067393A-17E3-4EEB-BA6F-C7160590B7EB}");
            public static readonly ID FacilityTypology = new ID("{4AFC3CFD-509B-4B95-B616-B1FB097062A4}");

            public static readonly ID FacilityTypesFolder = new ID("{12E7FE01-6B76-4E7D-8349-FB20D5F14C47}");
            public static readonly ID FacilityTypesGroup = new ID("{7E1CEEB8-9A59-4584-91E8-6014A5B0FF56}");
            public static readonly ID FacilityType = new ID("{0AE072FB-5BCF-4E09-95B5-239CBE370B2B}");

            public static readonly ID BoardTypesFolder = new ID("{BA09C3E6-B29E-4723-8376-5C83E942CEDA}");
            public static readonly ID BoardType = new ID("{13ECBEA2-A890-4D6E-A4FF-4AD65D455124}");

            public static readonly ID AccommodationFacilitiesFolder = new ID("{5C397782-6810-460A-AB57-84E9AB67514C}");
            public static readonly ID AccommodationFacility = new ID("{803E75ED-804E-4900-97D6-7BCC046C8385}");

            public static readonly ID AccommodationRoomsFolder = new ID("{1762DFC8-B872-41A2-A7C1-A54B93DD6CCD}");
            public static readonly ID AccommodationRoom = new ID("{BA1EC5C3-14C7-40B3-8B69-D020590DA1F3}");

            public static readonly ID AccommodationBoardsFolder = new ID("{AA2B6E6C-AE94-4E48-AE95-D77DA154FE9B}");
            public static readonly ID AccommodationBoard = new ID("{B1E9284E-A714-45EE-84CB-0A1ADB630306}");

            public static readonly ID ImagesFolder = new ID("{AF7DAAA8-8099-4F22-A607-F0E1FBA6AD0D}");
            public static readonly ID ExternalImage = new ID("{E4B3BB73-22AB-4843-A816-3AA32EDDC7DC}");
            public static readonly ID SitecoreImage = new ID("{D91DEBBE-FF68-4C69-AA6E-2425451C2786}");

            public static readonly ID FacilityVirtualGroupingFolder = new ID("{809A05FA-6FEF-4322-A2E0-07D440F1E8BB}");
            public static readonly ID FacilityVirtualGrouping = new ID("{319054B1-87D3-4C7B-8230-0FA70331BB98}");
            public static readonly ID OverviewFacilityVirtualGrouping = new ID("{15C8583C-F86B-4982-85E3-B21AC3C587C1}");
            public static readonly ID FoodAndDrinkFacilityVirtualGrouping = new ID("{C89A2C46-8F19-49F4-AF5C-B6992ED5C77D}");
            public static readonly ID FamilyFacilityVirtualGrouping = new ID("{E47A1A13-182C-400D-8A51-932EDA35A0F5}");

            public static readonly ID RoomStaysFolder = new ID("{4454BFD8-88E4-4AAA-853A-ECC6ED70B994}");
            public static readonly ID RoomStays = new ID("{9BF6F8B8-BB77-4686-B631-0593B79E9791}");

            public static readonly ID BedGroupsFolder = new ID("{B673F12B-9D5B-45D1-B9D2-0EC3CB8CAAB6}");
            public static readonly ID BedGroup = new ID("{DDF1A5C0-C6B6-43A6-96E6-945CD5E74C79}");

            public static readonly ID PriceBreakdownSettingsFolder = new ID("{8BA1664D-F4A9-4BE3-9B30-1DB5D51F69D6}");
            public static readonly ID PriceBreakdownSetting = new ID("{B01F62CB-5C39-4A59-A04C-64DBBB1BFAD0}");

            public static readonly ID ItinerariesFolder = new ID("{18BE0E88-1B8F-4E15-AB3A-DEDD890A8578}");
            public static readonly ID Itinerary = new ID("{A358EFB7-EE1E-442C-82A2-4F2563E83A3C}");
            public static readonly ID POI = new ID("{EB0BE30E-074A-424E-9956-C120F63E2F2B}");

            public static readonly ID UserCountriesFolder = new ID("{65314B7D-B629-4A39-BB8F-E14EA70BA046}");
            public static readonly ID UserCountry = new ID("{C5C485D2-C352-4E12-AC74-7A23DF280E45}");

            public static readonly ID DialingCodesFolder = new ID("{F8D9CAEB-C4A2-4D82-BCE5-03CA2A790C5A}");
            public static readonly ID DialingCode = new ID("{D333F42F-ADB6-402F-84C7-9015755BC38E}");

            public static readonly ID AccommodationTransfersFolder = new ID("{A5492194-4104-4BB1-B995-43AA24C683C0}");
            public static readonly ID AccommodationTransfer = new ID("{6867DAC6-4C72-4652-9011-A5B85284480F}");

            public static readonly ID TransfersTypeFolder = new ID("{8AEED4AD-CCA6-4F7C-A3EE-7545B45734A4}");
            public static readonly ID TransferType = new ID("{69C67D22-E38F-49FF-8487-F1DFB858AA03}");

            public static readonly ID HotelThemesFolder = new ID("{39D48966-C4CE-47E0-A420-EB05AF87E17F}");
            public static readonly ID HotelTheme = new ID("{FA899838-0CFF-4E8C-92D3-1B5E039004D0}");
            public static readonly ID ThemeType = new ID("{D1DCCF10-9C09-456C-B383-7E010735A292}");

            public static readonly ID TranserInfoFolder = new ID("{E0E3304E-7D21-4DB5-A57E-24C42B935A68}");
            public static readonly ID TransferInfo = new ID("{434E365E-D63B-4A66-9E88-88C07EC2B97D}");

            public static readonly ID TextBlocksFolder = new ID("{AB8D608B-3B9D-4ECB-9BA3-8C61306D7A41}");
            public static readonly ID TextBlock = new ID("{BD18AA14-C33D-4E76-B5F4-59CBB936BE31}");
            public static readonly ID PromoBlocksFolder = new ID("{EB30259D-FF9A-46CB-8E0C-4616B148F3A8}");
            public static readonly ID PageComponentsFolder = new ID("{05BBE519-F066-4B38-B0FC-CBC9C2F1C567}");
            public static readonly ID PromoPage = new ID("{C0CB2F05-AFD2-41CE-B53F-6F15A1033740}");
            public static readonly ID ReoccurringPromoPage = new ID("{5ED2ED12-F1EC-49CF-B9B9-AF094E587A2C}");
            public static readonly ID PromoBlock = new ID("{84ACB697-5638-4525-9801-B31CAC2E0394}");
            public static readonly ID DestinationInfoBlocksFolder = new ID("{82C5913D-9B19-4455-B0D3-1D8317FF85EE}");
            public static readonly ID DestinationInfoBlock = new ID("{3A4782E4-7E02-4065-8BC4-78816838C8F0}");

            public static readonly ID SchedulePublishQueue = new ID("{F008F59D-1150-4372-8E37-85A12FDD8638}");

            public static readonly ID VirtualCountry = new ID("{3BB7CB0A-8F57-48D6-9602-30A6198720D0}");
            public static readonly ID VirtualRegion = new ID("{799ECB20-C605-4A6C-A32B-27222BDBB91E}");
            public static readonly ID VirtualResort = new ID("{31FC60A9-A529-4081-BB33-7B1751F0BDAD}");

            public static readonly ID LivePriceFolder = new ID("{DF7E8EBD-7A96-4E39-956C-32B3A0B81D10}");
            public static readonly ID NamedSearchFolder = new ID("{E0C28696-E187-46B6-801C-A71313F6A316}");
            public static readonly ID PeriodsFolder = new ID("{D33B46F8-CEC5-4482-AF8A-7F6CCBBE5764}");

            public static readonly ID CancelCreditSettingsFolder = new ID("{A92B314E-D650-4F9A-A282-2724A0E5B6CA}");
            public static readonly ID CancelCreditRulesFolder = new ID("{2E0DA95C-0C8E-4EEB-B579-F38C25930EAA}");
            public static readonly ID CancelCreditRule = new ID("{B473AF98-632C-4A9E-98B8-D6A14FDDDBD7}");
            public static readonly ID CreditOnlyRulesFolder = new ID("{83EF1967-587D-4D96-B4B9-B1AAEBC3192E}");
            public static readonly ID CreditOnlyRule = new ID("{88DE2A7E-2285-4F50-89D0-C2BAA9103EBB}");

            public static readonly ID ExemptionListsFolder = new ID("{88F08BC0-1E5C-49B4-8D8A-FF8045926209}");
            public static readonly ID SpecialRequestsFolder = new ID("{678081B4-8407-4205-AD80-B7A68DAEBF5B}");
            public static readonly ID SpecialRequestsContradictoryGroupsFolder = new ID("{83B89909-0E5D-452A-AE3B-AC5C7B6823BB}");
            public static readonly ID SpecialRequestsContradictoryGroupId = new ID("{0F8839BE-74AF-40BD-B777-0AD6DBB3BBCE}");
            public static readonly ID SpecialRequestType = new ID("{3DF2F525-27DF-47BA-ADFF-D778A777CB3B}");
            public static readonly ID SpecialRequest = new ID("{38212231-C5AE-407A-85F5-A0233BFD498C}");

            public static readonly ID RoomNamesUploadReportFolder = new ID("{09B6FBF1-0933-4C8D-BD56-2A53F22C0C21}");
            public static readonly ID RoomNameUploadReport = new ID("{1BFA4442-2F24-4720-9D1F-6823CE43769A}");

            public static readonly ID RoomFacilitiesUploadReportFolder = new ID("{61ECD874-02DA-470C-8C56-871A4B0BF5F8}");
            public static readonly ID RoomFacilityUploadReport = new ID("{3E97B85A-D6CF-4823-B6AC-B6DC60A5877D}");

            public static readonly ID FacilityUploadReport = new ID("{B5967994-8D35-4121-AC21-90215107EA43}");
            public static readonly ID FacilitiesUploadReportFolder = new ID("{D9D11B99-6CB4-4938-8B2D-C4ECEDD9DB0B}");

            public static readonly ID RequestedSearchesFolder = new ID("{022C8C56-2CA3-4C42-8D8F-7CDA3F459F51}");
            public static readonly ID RequestedSearch = new ID("{139E9D53-56BA-47DF-949D-F2B039023258}");
            public static readonly ID RequestedSearchesMarketFolder = new ID("{E6EA34FA-ACFF-4ADD-AA79-363916763AAA}");

            public static readonly ID HotelBoardDescriptionUploadReport = new ID("{9D421FFF-65B9-4ABC-935A-D99B317FCAB2}");
            public static readonly ID HotelBoardDescriptionUploadReportFolder = new ID("{8B3AFF35-11B1-48C1-AB2D-DE6B484AE461}");

            public static readonly ID HotelOverviewDescriptionUploadReport = new ID("{C6FD9ADD-2259-4A2C-81D2-141E30A59459}");
            public static readonly ID HotelOverviewDescriptionUploadReportFolder = new ID("{773BA850-E477-449E-BDA9-0C6CB010020A}");

            public static readonly ID HotelThemesUploadReport = new ID("{1580B20C-8BFC-43BE-8D56-AA0B0919BDA2}");
            public static readonly ID HotelThemesUploadReportFolder = new ID("{8FFCAF8A-1481-4D9B-AF02-B434D188AE27}");

            public static readonly ID FacilitiesUploadReport = new ID("{2B5385E4-0092-4121-89F4-599D4ED56FB5}");
            public static readonly ID FoodAndDrinkUploadReportFolder = new ID("{88001467-3654-44A4-96C4-CAF406A68901}");
            public static readonly ID FamilyFacilitiesUploadReportFolder = new ID("{CFE86921-F982-4F6E-A859-AFDD4DB65668}");

            public static readonly ID FacilityHeaderFolder = new ID("{327E2D6C-4F48-45AA-A944-97B7483EF8BE}");
            public static readonly ID FacilityHeader = new ID("{A5E834E6-986E-4668-8711-B83F507A7871}");
            public static readonly ID FacilityMatrix = new ID("{BD34A5EA-4252-4472-89AA-81226B5A439A}");

            public static readonly ID HolidayTypePage = new ID("{C6C7FCEF-96CD-4D17-81C1-80CDA7873612}");

            public static readonly ID HolidayTypeFolderPage = new ID("{BCC163B4-00F8-42BC-AD82-1503D412592C}");

            public static readonly ID OfferFiltersFolder = new ID("{63F1CFFE-8633-4ED6-BDAE-8770E17DD6F0}");
            public static readonly ID OfferFilterTemplate = new ID("{AC7EC709-724A-4A66-BA98-5E3FCF5E83CB}");
            public static readonly ID OfferFilterReorderingConfiguration = new ID("{D3EF9628-9100-4133-BE02-7CEBED0D8F14}");
            public static readonly ID OfferFilterReordering = new ID("{7ADF47EF-3E83-43FC-BF0F-9DC64669E5AC}");
            public static readonly ID SearchFiltersFolder = new ID("{2743018F-E73C-437F-BE33-FF0EA923C9FA}");
            public static readonly ID FlightsFilter = new ID("{1814B832-3501-4BF1-834C-60962AFC02B3}");
            public static readonly ID TimeFilter = new ID("{8F0C90D9-15F7-4200-86D8-A59D03E54AD3}");

            public static readonly ID MuzementSettings = new ID("{26DC94DC-3A89-4BB8-856D-02A3E89897D4}");

            public static readonly ID OffersAndPromotionsSettings = new ID("{85ECB024-46DD-4781-ACA4-246E6FC605DE}");

            public static readonly ID FoodAndDrinkFacilityRichTextTab = new ID("{33B65EB0-29A6-4C4E-857F-ED373001130B}");
            public static readonly ID FamilyFacilityRichTextTab = new ID("{BCC97B59-1964-4662-9EE5-B3BF36AF289C}");
            public static readonly ID FacilityRichTextTab = new ID("{40FE6B49-FE8D-4D11-A3B1-B88C6EA38BDA}");

            public static readonly ID LuggageFolder = new ID("{8434F506-C87F-4D50-AADA-F50D36E90BFC}");
            public static readonly ID LuggageCategory = new ID("{928655D3-BFC1-4E24-99A5-096BE1B24D09}");
            public static readonly ID LuggageItem = new ID("{41775FBB-D551-4813-B3D7-1BDC7C6DB534}");
            public static readonly ID CombinedLuggageItem = new ID("{AD9CC85B-D9F7-4621-AF6E-D1B82603DEE0}");

            public static readonly ID FilterPillsFolder = new ID("{4B2BEF5F-508D-4732-8A70-516FD9E05173}");
            public static readonly ID RecommendedFiltersFolder = new ID("{0ED3D67E-3DC1-41C8-A5F2-DDF3308DF4E2}");

            // Pages:
            public static readonly ID CountryPage = new ID("{5F03C6EF-EF52-4F2E-BC5A-B1F065A1E745}");
            public static readonly ID RegionPage = new ID("{2F42EC14-7E56-467A-B300-AB9723C74546}");
            public static readonly ID RegionCityPage = new ID("{33B3542E-1316-40CA-8971-1CDB3C1D452D}");

            public static readonly ID EcoFacility = new ID("{4D51CEC1-0FD8-4ED1-B9CE-25BDF3C45F2C}");
            public static readonly ID GenericPage = new ID("{D6E273D0-4C78-4ABD-B412-5C98E7C9DB94}");
        }

        public struct ItemIds
        {
            public static readonly ID CertifiedSustainable = new ID("{4B03F06C-9538-4591-9498-1802A71E382B}");
            public static readonly ID MoveHotelsToNeighbourhoodResortsScript = new ID("{8D7C9F55-CA54-430F-8B22-74EE20FA3531}");
            public static readonly ID BedGroupsRepository = new ID("{359BEAFE-66E5-488C-BA6D-C44149F5D43D}");
        }

        public static readonly ID DestinationsWorkflowId = new ID("{E4933E36-0C0B-41AC-9EFB-BD97EF4826AB}");

        public struct WorkflowsStateIds
        {
            public static readonly ID DestinationsWorkflowEditingId = new ID("{91C0AA3E-2A65-44F7-9939-474C7B5C76D9}");
            public static readonly ID DestinationsWorkflowDraftId = new ID("{8048C461-28DC-4299-BB4D-7EBE4C2696DF}");
            public static readonly ID DestinationsWorkflowPendingApprovalId = new ID("{DD32B040-668C-431C-943C-F53DB3373E86}");
            public static readonly ID DestinationsWorkflowApprovedId = new ID("{A47E8B4F-A0EE-40F2-B1A1-B3CE91C0F79A}");
            public static readonly ID DestinationsWorkflowRejectedId = new ID("{A4243767-21FD-4356-A137-A9EAD3627FBC}");
            public static readonly ID DestinationsWorkflowScheduledId = new ID("{0A3F74B4-1671-404D-ACFA-284B23327E69}");
        }

        public struct RobotsIds
        {
            public static readonly ID NoFollowId = new ID("{2ED5E200-068A-4D3F-AB14-86DD81BEA30F}");
            public static readonly ID NoIndexId = new ID("{4BB84571-8047-42DE-8E1B-834DEA5DCB95}");
        }

        public static readonly ID ChangeFrequencyDoNotIncludeId = new ID("{BF310BAC-6A31-4366-85B9-5A173937EEDD}");

        public struct TemplateName
        {
            public const string FacilityType = "Facility Type";
        }

        public struct FieldsIds
        {
            public class CancelCreditSetting
            {
                public static readonly ID DestinationAirportsId = new ID("{3C9E83E2-0751-4DBC-A2EB-63095C1A19AD}");
                public static readonly ID AllowDepositOnlyToBeConvertedId = new ID("{B2857633-A2F7-4DEA-B958-35C9BF6355DB}");
                public static readonly ID AllowFullyPaidToBeConvertedId = new ID("{AB9B7805-3B0B-42A5-B944-64AF02E36874}");
                public static readonly ID AllowPartiallyPaidToBeConvertedId = new ID("{1CD2A67D-582C-48DD-A1D1-62DE503C5F81}");
            }

            public class RequestedSearch
            {
                public static readonly ID PromoPageId = new ID("{01F507C9-F56D-423D-9DA0-AF58DA9349D3}");
            }

            public class ReoccurringPromoPage
            {
                public static readonly ID MaxDaysBeforeDeparture = new ID("{BE856BCF-0046-42DB-ACDB-56855DFFDE92}");
            }

            public class DatasourceItem
            {
                public static readonly ID Code = new ID("{68324654-7020-4F55-B17B-8B58C9E16DBB}");
            }

            public class AccommodationRoomItem
            {
                public static readonly ID BedGroupTypes = new ID("{1990A45E-97FC-4CE6-84FC-F2EAE8B74E85}");
            }

            public class BedGroupItem
            {
                public static readonly ID BedGroupId = new ID("{543D4766-9F4C-4E32-B09A-74A1C94A4E82}");
                public static readonly ID Description = new ID("{96FB15AC-7A06-46D8-9A64-1B8240108DCD}");
            }
        }

        public struct Fields
        {
            public static class PromotionCollectionItem
            {
                public const string Key = "Key";
                public const string PromotionCodes = "PromotionCodes";
                public const string Title = "Title";
            }

            public static class SpecialRequestsContradictoryFolder
            {
                public const string SpecialRequestsContradictoryGroups = "SpecialRequestsContradictoryGroups";
            }

            public static class SpecialRequestsContradictoryOptions
            {
                public const string SpecialRequestsContradictoryGroupOptions = "Options";
            }

            public static class SitemapBase
            {
                public const string ChangeFrequency = "ChangeFrequency";
            }

            public static class MetaData
            {
                public const string Robots = "Robots";
                public const string TrackingPageTitle = "TrackingPageTitle";
            }

            public class SitecoreProperty
            {
                public const string Value = "Value";
            }

            public class MuzementSettings
            {
                public const string RegionRadius = "RegionRadius";
                public const string CountryRadius = "CountryRadius";
                public const string MuzementDestinationsImport = "MuzementDestinationsImport";
            }

            public class StandardFields
            {
                public const string SortOrder = "__sortorder";
                public const string DisplayName = "__Display name";
            }

            public class DatasourceItem
            {
                public const string Code = "Code";
                public const string Name = "Name";
                public const string Content = "Content";
                public const string Description = "Description";
            }

            public class OfferFilterItem
            {
                public const string Code = "Code";
                public const string Name = "Name";
                public const string Enabled = "Enabled";
                public const string Value = "Value";
                public const string TrackingId = "TrackingId";
            }

            public class FacilityTypeItem
            {
                public const string ShowInFilter = "ShowInFilter";
                public const string SetAsFacilityErrata = "SetAsFacilityErrata";
                public const string FacilityFilterGroup = "FacilityFilterGroup";
                public const string DisclaimerMessage = "DisclaimerMessage";
                public const string TooltipText = "TooltipText";
            }

            public class BaseFacilityItem
            {
                public const string Code = "Code";
                public const string Name = "Name";
                public const string FacilityType = "FacilityType";
                public const string Number = "Number";
                public const string IndYesOrNo = "IndYesOrNo";
                public const string Voucher = "Voucher";
                public const string IndLogic = "IndLogic";
                public const string IndFee = "IndFee";
                public const string Order = "Order";
                public const string Amount = "Amount";
                public const string Currency = "Currency";
                public const string ApplicationType = "ApplicationType";
            }

            public class FacilityMatrixAccommodationConfiguration
            {
                public const string ApplyMatrixOverride = "ApplyMatrixOverride";
                public const string MatrixOverride = "MatrixOverride";
            }

            public class FacilityMatrixConfiguration
            {
                public const string MustHaveCheckbox = "MustHave";
                public const string Facilities = "Facilities";
            }

            public class FacilityMatrixItem
            {
                public const string TypeTitle = "TypeTitle";
                public const string FilledIcon = "FilledIcon";
                public const string TooltipText = "TooltipText";
                public const string IsExclusive = "IsExclusive";
            }

            public class BasePaxMix
            {
                public const string NumberOfAdults = "NumberOfAdults";
                public const string NumberOfChildren = "NumberOfChildren";
                public const string DefaultDuration = "DefaultDuration";
            }

            public class DynamicPromoPage
            {
                public const string UrlPathName = "UrlPathName";
            }

            public class AccommodationFacilityItem : BaseFacilityItem
            {
                public const string Distance = "Distance";
                public const string AgeFrom = "AgeFrom";
                public const string AgeTo = "AgeTo";
                public const string TextValue = "TextValue";
                public const string DateFrom = "DateFrom";
                public const string DateTo = "DateTo";
                public const string TimeFrom = "TimeFrom";
                public const string TimeTo = "TimeTo";
                public const string Eco = "ECO";
            }

            public class RoomFacilityItem : BaseFacilityItem
            {
            }

            public class AccommodationReferenceItem
            {
                public const string Content = "Content";
                public const string Description = "Description";
                public const string Image = "Image";
                public const string Icon = "Icon";
                public const string TransferType = "TransferType";
            }

            public class AccommodationRoomItem
            {
                public const string RoomType = "RoomType";
                public const string Description = "Description";
                public const string BedGroupTypes = "BedGroupTypes";
            }

            public class AccommodationBoardItem
            {
                public const string BoardType = "BoardType";
                public const string Content = "Content";
            }

            public class PromoBlocksFolder
            {
                public const string FeaturedFacilities = "FeaturedFacilities";
            }

            public class PromoPage
            {
                public const string Destination = "Destination";
                public const string HotelsImportData = "HotelsImportData";
            }

            public class PromoBlock
            {
                public const string Title = "Title";
                public const string Description = "Description";
                public const string Image = "Image";
                public const string Link = "Link";
            }

            public class AccommodationItem
            {
                public const string GiataCode = "GiataCode";
                public const string HotelBedsCode = "HotelBedsCode";
                public const string Description = "HotelDescription";
                public const string Longitude = "Longitude";
                public const string Latitude = "Latitude";
                public const string Address = "Address";
                public const string City = "City";
                public const string PostalCode = "PostalCode";
                public const string Resort = "Resort";
                public const string Website = "Website";
                public const string Email = "Email";
                public const string StarRating = "StarRating";
                public const string BookingPhone = "BookingPhone";
                public const string ManagementPhone = "ManagementPhone";
                public const string HotelPhone = "HotelPhone";
                public const string FaxNumber = "FaxNumber";
                public const string Images = "Images";
                public const string Facilities = "Facilities";
                public const string SeasonalFacilities = "Seasonal Facilities";
                public const string Boards = "Boards";
                public const string Airports = "Airports";
                public const string Rooms = "Rooms - {0}";
                public const string ClosestFacility = "ClosestFacility";
                public const string TripAdvisorId = "TripAdvisorId";
                public const string HotelRating = "HotelRating";
                public const string TotalNumberOfReviews = "TotalNumberOfReviews";
                public const string HotelTheme = "HotelTheme";
                public const string Types = "Types";
                public const string FeaturedHotelImage = "FeaturedHotelImage";
                public const string FeaturedHotelDate = "FeaturedHotelDate";
                public const string FeaturedHotelDateText = "FeaturedHotelDateText";
                public const string FeaturedHotelBookFromTitle = "FeaturedHotelBookFromTitle";
                public const string GreatDeal = "GreatDeal";
                public const string OverviewDescription = "OverviewDescription";
                public const string VideoPlaceholder = "VideoPlaceholder";
                public const string PromoCollections = "PromoCollections";
                public const string HotelHighlights = "HotelHighlights";
                public const string Strapline = "StrapLine";
                public const string KeySellingPoint1 = "KeySellingPoint1";
            }

            public class FacilityRichTextTab
            {
                public const string Description = "Description";
            }

            public class RoomType
            {
                public const string TypeDescriptionContent = "TypeDescriptionContent";
                public const string CharacteristicDescriptionContent = "CharacteristicDescriptionContent";
            }

            public class BaseAppearance
            {
                public const string ShowOnSite = "ShowOnSite";
                public const string ShowOnSearchPod = "ShowOnSearchPod";
                public const string ShowInAutocomplete = "ShowInAutocomplete";
                public const string ShowOnDropdown = "ShowOnDropdown";
            }

            public class BoardTypeItem
            {
                public const string BoardGroup = "BoardGroup";
            }

            public class ExternalImageItem
            {
                public const string Small = "Small";
                public const string Medium = "Medium";
                public const string Large = "Large";
                public const string RoomCode = "RoomCode";
                public const string RoomType = "RoomType";
                public const string Order = "Order";
            }

            public class SitecoreImageItem
            {
                public const string Image = "Image";
            }

            public class SitecoreIconItem
            {
                public const string Icon = "Icon";
            }

            public class AirportItem
            {
                public const string IsDepartureAirport = "IsDepartureAirport";
            }

            public class FacilityVirtualGrouping
            {
                public const string FacilityGroups = "FacilityGroups";
            }

            public class OverviewFacilityVirtualGrouping
            {
                public const string TopFacilities = "TopFacilities";
                public const string Title = "Title";
            }

            public class RoomItem
            {
                public const string RoomStays = "Stays";
            }

            public class RoomStayItem
            {
                public const string StayType = "StayType";
                public const string Description = "Description";
                public const string Order = "Order";
            }

            public class BedGroupItem
            {
                public const string BedGroupId = "Bed Group Id";
                public const string Description = "Description";
            }

            public class PriceBreakdownSetting
            {
                public const string AtcomCodes = "AtcomCodes";
                public const string Text = "Text";
                public const string Scope = "Scope";
            }

            public class BaseItinerary
            {
                public const string Duration = "Duration";
            }

            public class Itinerary
            {
                public const string TotalDistance = "TotalDistance";
                public const string RouteType = "RouteType";
            }

            public class POIs
            {
                public const string Subtitle = "Subtitle";
                public const string Latitude = "Latitude";
                public const string Longitude = "Longitude";
                public const string ActiveIcon = "ActiveIcon";
                public const string NonActiveIcon = "NonActiveIcon";
            }

            public class AccommodationTransferItem
            {
                public const string Airports = "Airports";
                public const string TransferType = "TransferType";
            }

            public class HotelThemeItem
            {
                public const string Icon = "Icon";
                public const string Description = "Description";
                public const string PackageIcons = "PackageIcons";
            }

            public class DestinationGuideTheme
            {
                public const string DestinationGuideTitle = "DestinationGuideTitle";
                public const string DestinationGuideUrl = "DestinationGuideUrl";
            }

            public class DestinationInfoBlock
            {
                public const string Description = "Description";
            }

            public class ContentByDateItem
            {
                public const string StartDate = "StartDate";
                public const string EndDate = "EndDate";
                public const string Content = "Content";
            }

            public class TypeItem
            {
                public const string Name = "Name";
                public const string Description = "Description";
                public const string Icon = "Icon";
                public const string FilledIcon = "FilledIcon";
                public const string TypeAndThemeTitle = "TypeAndThemeTitle";
            }

            public class PackageThemeIcon
            {
                public const string Type = "Type";
                public const string BagType = "BagType";
            }

            public class TransferInfoFolder
            {
                public const string ImportFile = "ImportFile";
                public const string LanguageMapping = "Language Mapping";
            }

            public class TransferInfoItem
            {
                public const string AirportId = "AirportId";
                public const string ResortId = "ResortId";
                public const string ResortName = "ResortName";
                public const string Duration = "Duration";
                public const string ArrivalInstr = "ArrivalInstr";
                public const string DepInstr = "DepInstr";
                public const string Type = "Type";
                public const string ProductId = "ProductId";
            }

            public class DynamicPromo
            {
                public const string HotelTheme = "HotelTheme";
                public const string HotelThemeType = "HotelThemeType";
            }

            public class PromoSeasonItem
            {
                public const string StartDate = "Start Date";
                public const string EndDate = "End Date";
            }

            public class BaseThemes
            {
                public const string HotelThemes = "HotelThemes";
                public const string ThemeTypes = "ThemeTypes";
            }

            public class Schedule
            {
                public const string ScheduleDateTime = "ScheduleDateTime";
            }

            public class TextBlock
            {
                public const string Description = "Description";
            }

            public class SchedulePublishQueue
            {
                public const string PublishItemId = "PublishItemId";
                public const string PublishItemPath = "PublishItemPath";
                public const string PublishScheduleDate = "PublishScheduleDate";
                public const string IsPublished = "IsPublished";
                public const string PublishedDateTime = "PublishedDateTime";
            }

            public class Region
            {
                public const string MuzementId = "MuzementId";
            }

            public class VirtualDestination
            {
                public const string Regions = "Regions";
                public const string Resorts = "Resorts";
            }

            public class NamedSearch
            {
                public const string ChildAges = "ChildAges";
            }

            public class PeriodByDestination
            {
                public const string Destinations = "Destinations";
                public const string DateOfRunStartDate = "DateOfRunStartDate";
                public const string DateOfRunEndDate = "DateOfRunEndDate";
                public const string SearchDateRangeStartDate = "SearchDateRangeStartDate";
                public const string SearchDateRangeEndDate = "SearchDateRangeEndDate";
            }

            public class BaseCreditSetting
            {
                public const string ActivationDateFrom = "ActivationDateFrom";
                public const string ActivationDateTo = "ActivationDateTo";
                public const string NumberOfDays = "NumberOfDays";
                public const string DestinationAirports = "DestinationAirports";
                public const string AllowDepositOnlyToBeConverted = "AllowDepositOnlyToBeConverted";
                public const string AllowFullyPaidToBeConverted = "AllowFullyPaidToBeConverted";
                public const string AllowPartiallyPaidToBeConverted = "AllowPartiallyPaidToBeConverted";
                public const string BookingDepartureDateFrom = "BookingDepartureDateFrom";
                public const string BookingDepartureDateTo = "BookingDepartureDateTo";
                public const string DateOfChangeFrom = "DateOfChangeFrom";
                public const string DateOfChangeTo = "DateOfChangeTo";
                public const string AllowCreditForLessThan28Days = "AllowCreditForLessThan28Days";
                public const string BookedWithinDateFrom = "BookedWithinDateFrom";
                public const string BookedWithinDateTo = "BookedWithinDateTo";
            }

            public class CancelCreditSetting
            {
                public const string AllowedAmountOfFailures = "AllowedAmountOfFailures";
                public const string EnableOneTimeUseCredit = "EnableOneTimeUseCredit";
                public const string EnableAmendmentFee = "EnableAmendmentFee";
                public const string ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture = "ApplyOneTimeUseCreditForXOrMoreDaysBeforeDeparture";
                public const string ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture = "ShowOnlyOriginalPaymentMethodForXOrMoreDaysBeforeDeparture";
                public const string AllowCancelPartialRefundLess28Days = "AllowCancelPartialRefundLess28Days";
                public const string CurrentRulesApplyForHolidaysBookedFrom = "CurrentRulesApplyForHolidaysBookedFrom";
                public const string CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture = "CurrentRulesAllowRefundsForXOrMoreDaysBeforeDeparture";
                public const string PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture = "PreviousRulesAllowRefundsForXOrMoreDaysBeforeDeparture";
            }

            public class ExemptionList
            {
                public const string BookingReferences = "BookingReferences";
            }

            public class DestinationsFolder
            {
                public const string RoomNameUpload = "RoomNameUpload";
                public const string RoomFacilityUpload = "RoomFacilityUpload";
                public const string FacilityUpload = "FacilityUpload";
                public const string BoardDescriptionUpload = "BoardDescriptionUpload";
                public const string HotelOverviewDescriptionUpload = "HotelOverviewDescriptionUpload";
                public const string ThemesTypesUpload = "ThemesTypesUpload";
                public const string FoodAndDrinkHotelFacilityUpload = "FoodAndDrinkHotelFacilityUpload";
            }

            public class OffersAndPromotionsSettings
            {
                public const string KidsGoFree = "KidsGoFree";
            }

            public class DialingCode
            {
                public const string AreaName = "AreaName";
                public const string AreaCode = "AreaCode";
            }

            public class HotelFolderUpdates
            {
                public const string UpdatesImagesFolder = "UpdatesImagesFolder";
                public const string UpdatesFacilitiesFolder = "UpdatesFacilitiesFolder";
                public const string UpdatesBoardsFolder = "UpdatesBoardsFolder";
                public const string UpdatesRoomsFolder = "UpdatesRoomsFolder";
            }

            public class SpecialRequestsFolder
            {
                public const string SpecialRequestsTypes = "SpecialRequestsTypes";
            }

            public class SpecialRequestType
            {
                public const string SpecialRequests = "SpecialRequests";
            }

            public class SpecialRequest
            {
                public const string DisplayName = "DisplayName";
                public const string PreSelectedForInfant = "PreSelectedForInfant";
                public const string PreSelectedForInfantAlert = "PreSelectedForInfantAlert";
            }

            public class RoomNameUploadReport : BaseRoomUploadReport
            {
            }

            public class RoomFacilityUploadReport : BaseRoomUploadReport
            {
                public const string Code = "Code";
                public const string FacilityName = "FacilityName";
            }

            public class BaseRoomUploadReport
            {
                public const string AtcomCode = "AtcomCode";
                public const string RoomCode = "RoomCode";
                public const string RoomName = "RoomName";
                public const string Message = "Message";
                public const string DateTime = "DateTime";
            }

            public class FacilityUploadReport
            {
                public const string HotelCode = "HotelCode";
                public const string HotelName = "HotelName";
                public const string FacilityCode = "FacilityCode";
                public const string FacilityName = "FacilityName";
                public const string FacilityFilterGroup = "FacilityFilterGroup";
                public const string DateTime = "DateTime";
                public const string Message = "Message";
            }

            public class HotelBoardDescriptionUploadReport
            {
                public const string HotelCode = "HotelCode";
                public const string HotelName = "HotelName";
                public const string BoardCode = "BoardCode";
                public const string BoardName = "BoardName";
                public const string DateTime = "DateTime";
                public const string Message = "Message";
            }

            public class HotelOverviewDescriptionUploadReport
            {
                public const string GiataCode = "GiataCode";
                public const string HotelOverviewDescription = "HotelOverviewDescription";
                public const string DateTime = "DateTime";
                public const string Message = "Message";
            }

            public class HotelThemesUploadReport
            {
                public const string HotelCode = "HotelCode";
                public const string HotelName = "HotelName";
                public const string HotelTheme = "HotelTheme";
                public const string HotelThemeCode = "HotelThemeCode";
                public const string HotelType = "HotelType";
                public const string HotelTypeCode = "HotelTypeCode";
                public const string DateTime = "DateTime";
                public const string Message = "Message";
            }

            public class FoodAndDrinkUploadReport
            {
                public const string HotelCode = "HotelCode";
                public const string HotelName = "HotelName";
                public const string DateTime = "DateTime";
                public const string Message = "Message";
            }

            public class UserCountry
            {
                public const string CountryName = "CountryName";
                public const string CountryCode = "CountryCode";
                public const string Iso2 = "Iso2";
            }

            public class RequestedSearch
            {
                public const string Url = "Url";
                public const string Enabled = "Enabled";
                public const string PromoPage = "PromoPage";
                public const string Origin = "Origin";
                public const string Destination = "Destination";
            }

            public class SearchParameters
            {
                public const string StartDate = "StartDate";
                public const string EndDate = "EndDate";
                public const string NumberOfInfants = "NumberOfInfants";
                public const string ChildrenAges = "ChildrenAges";
            }

            public class Filters
            {
                public const string BoardTypes = "BoardTypes";
                public const string FacilityTypes = "FacilityTypes";
                public const string StarRating = "StarRating";
                public const string TripAdvisorRating = "TripAdvisorRating";
                public const string MinPricePP = "MinPricePP";
                public const string MaxPricePP = "MaxPricePP";
                public const string MinTotalPrice = "MinTotalPrice";
                public const string MaxTotalPrice = "MaxTotalPrice";
                public const string DiscountPercentsMin = "DiscountPercentsMin";
                public const string DiscountPercentsMax = "DiscountPercentsMax";
                public const string DiscountAmountMax = "DiscountAmountMax";
                public const string DiscountAmountMin = "DiscountAmountMin";
                public const string DiscountOnly = "DiscountOnly";
                public const string HolidayThemes = "HolidayThemes";
                public const string HolidayTypes = "HolidayTypes";
                public const string PromoCollections = "PromoCollections";
            }

            public class DateSettings
            {
                public const string IsFlexibleDatesRange = "IsFlexibleDatesRange";
                public const string InitialSearchDays = "InitialSearchDays";
            }

            public class FacilityHeader
            {
                public const string Facilities = "Facilities";
            }

            public struct SeasonalFacility
            {
                public const string StartDate = "StartDate";
                public const string EndDate = "EndDate";
            }

            public class Message
            {
                public const string Output = "Output";
            }

            public class TimeFilter
            {
                public const string FilterType = "FilterType";
                public const string Time = "Time";
            }

            public class TimeSetting
            {
                public const string StartTime = "StartTime";
                public const string EndTime = "EndTime";
                public const string AtcomCode = "AtcomCode";
            }

            public struct SortingFields
            {
                public const string RegionSortOrder = "__RegionSortOrder";
                public const string ResortSortOrder = "__ResortSortOrder";
                public const string SeoResortSortOrder = "__SeoResortSortOrder";
            }

            public struct LuggageCategory
            {
                public const string Code = "Code";
                public const string Name = "Name";
                public const string Type = "Type";
            }

            public struct LuggageItem
            {
                public const string Code = "Code";
            }

            public struct CombinedLuggageItem
            {
                public const string CombinedLuggage = "CombinedLuggage";
            }

            public struct LuggageItemBase
            {
                public const string Name = "Name";
                public const string Description = "Description";
                public const string Icon = "Icon";
                public const string IsLuggageItemEnabled = "IsLuggageItemEnabled";
            }

            public struct CarouselTile
            {
                public const string Title = "Title";
                public const string Subtitle = "Subtitle";
                public const string Description = "Description";
                public const string Image = "Image";
            }

            public static class RecommendedFilters
            {
                public const string MinNumberOfOffers = "MinNumberOfOffers";
            }

            public static class RecommendedFilterOption
            {
                public const string FilterCode = "FilterCode";
                public const string Code = "Code";
                public const string Name = "Name";
                public const string Type = "Type";
            }
        }

        public struct RenderingIds
        {
            public static readonly ID PromoBlocks = new ID("{FF441699-4D65-45C1-B565-E87714B5A278}");
        }

        public struct ReportErrors
        {
            public const string HotelNotExist = "Hotel wasn't found.";
            public const string DuplicateRoomCodes = "Hotel has rooms with duplicate codes.";
            public const string DuplicateFacilityCodes = "Room has facilities with duplicate codes.";
            public const string DuplicateHotelFacilityCodes = "Hotel has facilities with duplicate codes.";
            public const string FacilityNotFound = "Facility not found";
            public const string DuplicateBoardTypesCodes = "Uploaded file has dublicate board types for a hotel.";
            public const string BoardTypeCodeNotFound = "Board type not found";
            public const string DuplicateHotelBoards = "Hotel has duplicates boards";
            public const string DuplicateHotels = "Duplicate hotel code";
            public const string UnhandledException = "Unhandled Exception Refer to logs for addtional info";
        }

        public struct QueryParameters
        {
            public class SearchParameters
            {
                public const string Origin = "org";
                public const string Destinations = "dst";
                public const string From = "from";
                public const string To = "to";
                public const string Duration = "duration";
                public const string Children = "children";
                public const string Adults = "adults";
                public const string Infants = "infants";
                public const string ChildAges = "childrenAges";
                public const string HotelThemes = "themesCodes";
            }

            public class Filters
            {
                public const string BoardType = "boardType";
                public const string Facilities = "facilities";
                public const string StarRating = "starRating";
                public const string TripAdvisorRating = "taRating";
            }
        }

        public struct Acmi
        {
            public const string SettingsPathSettingName = "Acmi.SettingsPath";

            public struct Messages
            {
                public struct Codes
                {
                    public const string Inbound = "ACMI1";
                    public const string Outbound = "ACMI2";
                    public const string InboundOutboundSameProvider = "ACMI3";
                    public const string InboundOutboundDifferentProvider = "ACMI4";
                }

                public const string InboundMessageField = "Inbound Message";
                public const string OutboundMessageField = "Outbound Message";
                public const string InboundOutboundSameProviderMessageField = "Inbound and Outbound Same Provider Message";
                public const string InboundOutboundDifferentProvidersMessageField = "Inbound and Outbound Different Providers Message";

                public static readonly ID TemplateId = new ID("4B712E6A-DC42-45A8-A58C-2444551EAE3F");
            }

            public struct Carrier
            {
                public const string RegNumber = "Reg Number";
                public const string CarrierName = "Carrier Name";

                public static readonly ID TemplateId = new ID("08664DDC-E8BE-4096-86B8-B25B9BC4F1C5");
            }
        }

        public struct Atcom
        {
            public const string SettingsPathSettingName = "Atcom.SettingsPath";
            public const string AtcomExcludeCodesCacheName = "Atcom.Exclude.Codes.Cache";

            public struct Fields
            {
                public const string CodesToIgnore = "Codes To Ignore";
                public const string RoomTypeFacilitiesSyncRegionRestriction = "Room Type Facilities Sync Region Restriction";
            }
        }

        public struct BrokenLinksReport
        {
            public const string BrokenLinksReportPathSettingsName = "Destinations.BrokenImagesLinksReportPath";
            public const string ImageSizeSmallPrefixUrlSettingsName = "HotelBeds.ImageSizePrefixUrl.Small";
            public const string HbgS3KeyPrefixSettingName = "HotelBeds.HbgImagesToS3Sync.S3KeyPrefix";
        }

        public struct TransferInfo
        {
            public const string DefaultLanguage = "en";
        }
    }
#pragma warning restore S1192
}

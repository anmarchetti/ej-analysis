using Sitecore.Data;

namespace easyJet.Foundation.Voucherify
{
    public struct Templates
    {
        public struct PromotionFolder
        {
            public static readonly ID Id = new ID("{FFDF75B6-AB69-46ED-B8F9-35E426E69542}");

            public struct Fields
            {
                public static readonly ID InputFile = new ID("{6F24CB69-4032-4DFE-8D15-C7BA5CB241A4}");
            }
        }

        public struct PromotionMarketFolder
        {
            public static readonly ID Id = new ID("{931C2E00-6C7B-4F50-AB4E-37D91E573C95}");

            public struct Fields
            {
                public static readonly string Markets = "Markets";
            }
        }

        public struct Promotion
        {
            public static readonly ID Id = new ID("{A79ECCA5-FA9B-4B8C-A1D5-4487E041CBB3}");

            public struct Fields
            {
                public static readonly string CustomerPromoCode = "CustomerPromoCode";
                public static readonly string HolidayCardDescription = "HolidayCardDescription";
                public static readonly string PromoBannerDescription = "PromoBannerDescription";
                public static readonly string AtcomPromoCode = "AtcomPromoCode";
                public static readonly string DateValidityFrom = "DateValidityFrom";
                public static readonly string DateValidityTo = "DateValidityTo";

                public static readonly string Global = "Global";
                public static readonly string Airport = "Airport";
                public static readonly string Destination = "Destination";
                public static readonly string NumberOfAdults = "NumberOfAdults";
                public static readonly string NumberOfChildren = "NumberOfChildren";
                public static readonly string NumberOfInfants = "NumberOfInfants";
                public static readonly string Board = "Board";
                public static readonly string HolidayType = "HolidayType";
                public static readonly string HolidayTheme = "HolidayTheme";
                public static readonly string HotelType = "HotelType";
                public static readonly string PromoCollections = "PromoCollections";
                public static readonly string DepartureDateFrom = "DepartureDateFrom";
                public static readonly string DepartureDateTo = "DepartureDateTo";
                public static readonly string ReturnDateFrom = "ReturnDateFrom";
                public static readonly string ReturnDateTo = "ReturnDateTo";
                public static readonly string Duration = "Duration";
                public static readonly string Budget = "Budget";
                public static readonly string Redemption = "Redemption";

                public static readonly string AirportErrorCode = "AirportErrorCode";
                public static readonly string DestinationErrorCode = "DestinationErrorCode";
                public static readonly string MinimumPriceErrorCode = "MinimumPriceErrorCode";
                public static readonly string PerPersonPriceErrorCode = "PerPersonPriceErrorCode";
                public static readonly string DateRangeOfValidityErrorCode = "DateRangeOfValidityErrorCode";
                public static readonly string NumberOfAdultsErrorCode = "NumberOfAdultsErrorCode";
                public static readonly string NumberOfChildrenErrorCode = "NumberOfChildrenErrorCode";
                public static readonly string NumberOfInfantsErrorCode = "NumberOfInfantsErrorCode";
                public static readonly string BoardErrorCode = "BoardErrorCode";
                public static readonly string HolidayThemeErrorCode = "HolidayThemeErrorCode";
                public static readonly string HolidayTypeErrorCode = "HolidayTypeErrorCode";
                public static readonly string HotelTypeErrorCode = "HotelTypeErrorCode";
                public static readonly string PromoCollectionsErrorCode = "PromoCollectionsErrorCode";
                public static readonly string DepartureDateErrorCode = "DepartureDateErrorCode";
                public static readonly string ReturnDateErrorCode = "ReturnDateErrorCode";
                public static readonly string DurationErrorCode = "DurationErrorCode";
                public static readonly string MinimumDurationErrorCode = "MinimumDurationErrorCode";
                public static readonly string MaximumDurationErrorCode = "MaximumDurationErrorCode";
                public static readonly string DurationRangeErrorCode = "DurationRangeErrorCode";
                public static readonly string DiscountAmountPerBooking = "DiscountAmountPerBooking";
                public static readonly string PercentageDiscountPerBooking = "PercentageDiscountPerBooking";
                public static readonly string AdultDiscountAmountPerPerson = "AdultDiscountAmountPerPerson";
                public static readonly string AdultPercentageAmountPerPerson = "AdultPercentageAmountPerPerson";
                public static readonly string ChildDiscountAmountPerPerson = "ChildDiscountAmountPerPerson";
                public static readonly string ChildPercentageAmountPerPerson = "ChildPercentageAmountPerPerson";

                public static readonly string CardDescription = "CardDescription";
                public static readonly string Icon = "Icon";
                public static readonly string BannerTitle = "BannerTitle";
                public static readonly string MinimumSpend1 = "MinimumSpend1";
                public static readonly string MinimumSpend2 = "MinimumSpend2";
                public static readonly string MinimumSpend3 = "MinimumSpend3";
                public static readonly string PromoCode = "PromoCode";
                public static readonly string Date = "Date";
                public static readonly string TandCs = "TandCs";
                public static readonly string DisplayOnExtrasPage = "DisplayOnExtrasPage";
                public static readonly string ShowTaxesNote = "ShowTaxesNote";
            }

            public struct FieldsIds
            {
                public static readonly ID Global = new ID("{AF52B611-21FC-4234-A6A4-8C918BE850A6}");
                public static readonly ID Airport = new ID("{786098E2-3F66-4BB8-80A1-CB2393FC9E8D}");
                public static readonly ID Destination = new ID("{12C1CB23-07E2-4970-9875-9061B4A71D84}");
                public static readonly ID NumberOfAdults = new ID("{D31F510B-06B5-4FDB-82A2-04A24CE0C40C}");
                public static readonly ID NumberOfChildren = new ID("{9E377B86-172F-4D09-9267-37B73F63A1F3}");
                public static readonly ID NumberOfInfants = new ID("{82666331-DF90-4BFD-9D37-D9E7D4D336A2}");
                public static readonly ID Board = new ID("{F9B847E4-F28C-4DD0-8A5C-EA1EE0D76127}");
                public static readonly ID HolidayType = new ID("{4652CF33-400B-464E-9839-32BF4FB36EA4}");
                public static readonly ID HolidayTheme = new ID("{49E36C47-F349-42E6-93A9-9D9796739F72}");
                public static readonly ID HotelType = new ID("{B333B3D5-9624-4880-B964-0BEA5B387C23}");
                public static readonly ID PromoCollections = new ID("{E72BD7B4-B83E-4AF7-9957-E623A64D3710}");
                public static readonly ID DepartureDateFrom = new ID("{1B5210F3-6429-42A6-96BB-333A001BCCC7}");
                public static readonly ID DepartureDateTo = new ID("{F5C5CF08-9C08-4E71-ADE8-E883EB978A46}");
                public static readonly ID Duration = new ID("{2B51E94D-3DEE-4DBB-A0C8-4C3E58FA6287}");
                public static readonly ID MinimumDuration = new ID("{8C840D8B-D872-4502-951F-51E2A0989A96}");
                public static readonly ID MaximumDuration = new ID("{971DB959-F17E-4EB4-8AAA-7EC762B62554}");
                public static readonly ID Budget = new ID("{0C8FDC62-C483-442D-9ED9-A213EFCDBED5}");
                public static readonly ID PerPersonBudget = new ID("{CE18844B-D118-4912-A376-307741387441}");
                public static readonly ID Redemption = new ID("{28FD6332-053C-48C5-BB59-6DF546CCF07F}");
                public static readonly ID DiscountAmountPerBooking = new ID("{6037922E-8CD5-434E-949A-440CF029254F}");
                public static readonly ID PercentageDiscountPerBooking = new ID("{691C033A-0337-4B92-92CE-1DA445E75106}");
                public static readonly ID AdultDiscountAmountPerPerson = new ID("{E035C92D-B3AD-45A2-BF7D-51E4013CD8CE}");
                public static readonly ID AdultPercentageAmountPerPerson = new ID("{D27D49B2-5DFC-43D6-8B5B-A8E12E696C05}");
                public static readonly ID ChildDiscountAmountPerPerson = new ID("{A6F39549-F139-4E2D-8756-044C7D765825}");
                public static readonly ID ChildPercentageAmountPerPerson = new ID("{B6AE24BD-615C-4327-9F75-E5E67583F5D2}");
            }
        }

        public struct PromoPage
        {
            public static readonly ID Id = new ID("{C0CB2F05-AFD2-41CE-B53F-6F15A1033740}");

            public struct Fields
            {
                public static readonly ID IsMonthOnlyPageId = new ID("{9E301AB6-6FCF-4933-9D44-196CE91B593D}");
                public static readonly string IsMonthOnlyPage = "IsMonthOnlyPage";
                public static readonly string StartDate = "StartDate";
                public static readonly string EarliestDate = "EarliestDate";
            }

            public struct Validation
            {
                public static readonly ID EarliestDateRule = new ID("{BBFBFDD5-7AB4-4C4B-AA2C-3D2FA787FD87}");
            }
        }

        public struct PromotionCodeConfiguration
        {
            public static readonly ID Id = new ID("{5D2E7ED6-6A7F-417C-A2D4-84DB051EED0C}");

            public struct Fields
            {
                public const string AtcomPromoCode = "AtcomPromoCode";
                public const string MinimumSpend = "MinimumSpend";
                public const string MinimumSpendPerPerson = "MinimumSpendPerPerson";
                public const string DiscountAmountPerBooking = "DiscountAmountPerBooking";
                public const string PercentageDiscountPerBooking = "PercentageDiscountPerBooking";
                public const string AdultDiscountAmountPerPerson = "AdultDiscountAmountPerPerson";
                public const string AdultPercentageAmountPerPerson = "AdultPercentageAmountPerPerson";
                public const string ChildDiscountAmountPerPerson = "ChildDiscountAmountPerPerson";
                public const string ChildPercentageAmountPerPerson = "ChildPercentageAmountPerPerson";
                public const string HideOnPromoBanner = "HideOnPromoBanner";
                public const string IsPromotionInVoucherify = "IsPromotionInVoucherify";
            }
        }
    }
}
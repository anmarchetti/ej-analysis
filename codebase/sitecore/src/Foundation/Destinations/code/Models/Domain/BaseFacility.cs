using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class BaseFacility
    {
        public BaseFacility()
        {
        }

        public BaseFacility(Item referenceTypeItem, Item referenceItem)
        {
            Name = referenceTypeItem.Fields[Constants.Fields.DatasourceItem.Name]?.Value;
            FacilityCode = referenceTypeItem.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            FacilityGroupCode = referenceTypeItem.Parent?.Fields[Constants.Fields.DatasourceItem.Code]?.Value;
            Number = referenceItem.Fields[Constants.Fields.BaseFacilityItem.Number]?.Value;
            Order = referenceItem.Fields[Constants.Fields.BaseFacilityItem.Order]?.Value;
            DisclaimerMessage = referenceTypeItem.Fields[Constants.Fields.FacilityTypeItem.DisclaimerMessage]?.Value;
            TextValue = referenceItem.Fields[Constants.Fields.AccommodationFacilityItem.TextValue]?.Value;
        }

        public string Name { get; set; }

        public string FacilityCode { get; set; }

        public string FacilityGroupCode { get; set; }

        public string Order { get; set; }

        public string Number { get; set; }

        public string DisclaimerMessage { get; set; }

        public string TextValue { get; set; }

        public string GetFacilityTypeCode()
        {
            if (!string.IsNullOrEmpty(FacilityCode) && !string.IsNullOrEmpty(FacilityGroupCode))
            {
                return $"{FacilityGroupCode}-{FacilityCode}";
            }

            return !string.IsNullOrEmpty(FacilityCode) ? FacilityCode : string.Empty;
        }
    }
}
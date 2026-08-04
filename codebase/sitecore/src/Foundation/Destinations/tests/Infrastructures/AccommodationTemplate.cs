namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class AccommodationTemplate : DatasourceTemplate
    {
        public AccommodationTemplate(string name)
            : base(name, Constants.TemplateIds.Accommodation)
        {
            Add(Constants.Fields.HotelFolderUpdates.UpdatesBoardsFolder);
            Add(Constants.Fields.HotelFolderUpdates.UpdatesFacilitiesFolder);
            Add(Constants.Fields.HotelFolderUpdates.UpdatesImagesFolder);
            Add(Constants.Fields.HotelFolderUpdates.UpdatesRoomsFolder);
        }
    }
}

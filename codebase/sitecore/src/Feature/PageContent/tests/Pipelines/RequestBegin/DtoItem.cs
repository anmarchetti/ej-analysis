namespace easyJet.Feature.PageContent.Tests.Pipelines.RequestBegin
{
    public class DtoItem
    {
        public DtoItem(string name, string id, bool isTransparentItem = false)
        {
            Name = name;
            Id = id;
            IsTransparentItem = isTransparentItem;
        }

        public string Name { get; set; }

        public string Id { get; set; }

        public bool IsTransparentItem { get; set; }
    }
}
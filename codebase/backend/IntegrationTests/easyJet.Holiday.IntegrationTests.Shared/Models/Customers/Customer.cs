namespace easyJet.Holiday.IntegrationTests.Shared.Models.Customers
{
    public class Customer
    {
        public required CustomerCredentials Credentials { get; set; }
        public required CustomerInfo Info { get; set; }
    }
}

using System.Text.Json.Serialization;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Customers;

public class CreateCustomerRequest
{
    [JsonPropertyName("customer")]
    public CustomerInfo? Customer { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("rememberMe")]
    public bool RememberMe { get; set; }
}
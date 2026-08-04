namespace easyJet.Holidays.Api.Domain.Data.Hotels;

/// <summary>
/// Destinations Datasource Object Interface.
/// </summary>
public interface IDestinationDatasource
{
    /// <summary>
    /// Gets or sets Destination Code.
    /// </summary>
    string Code { get; set; }
    
    /// <summary>
    /// Gets or sets Destination Name.
    /// </summary>
     string Name {get; set;}
}
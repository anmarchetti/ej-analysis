using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Booking;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Customer;
using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;
using easyJet.Holiday.IntegrationTests.Shared.Models.CallCentre;
using easyJet.Holiday.IntegrationTests.Shared.Models.Language;
using easyJet.Holiday.IntegrationTests.Shared.Models.SharedServices;
using easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy;
using easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy.ConcreteStrategies;
using easyJet.Holidays.IntegrationTests.TestApi.Middleware;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;
using easyJet.Holidays.IntegrationTests.TestApi.Service.CallCentre;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Credit;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Customers;
using easyJet.Holidays.IntegrationTests.TestApi.Service.DataHub;
using easyJet.Holidays.IntegrationTests.TestApi.Service.PackageOffers;
using easyJet.Holidays.IntegrationTests.TestApi.Service.TradePortal;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Refit;
using System.Reflection;
using System.Runtime.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.WebHost.ConfigureKestrel(cfg =>
{
    cfg.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(300);
});

// Add services to the container.
builder.Services
    .AddControllers()
    .AddNewtonsoftJson();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.Configure<CallCentreSettings>(builder.Configuration.GetSection("CallCentre"));
builder.Services.Configure<MarketSettings>(builder.Configuration.GetSection("MarketSettings"));
builder.Services.Configure<SharedServicesSettings>(builder.Configuration.GetSection("SharedServices"));
var webApiUrl = builder.Configuration["WebApiUrl"]!;
var jsonSerializerSettings = new JsonSerializerSettings
{
    ContractResolver = new DataMemberContractResolver(),
    Formatting = Formatting.Indented
};
// Register refit api
builder.Services
    .AddRefitClient<ICustomerApi>(new RefitSettings { ContentSerializer = new NewtonsoftJsonContentSerializer() })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ISearchApi>(new RefitSettings { ContentSerializer = new NewtonsoftJsonContentSerializer() })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<IBookingApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer(jsonSerializerSettings)
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<IOffersApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ICallCentreApi>(new RefitSettings { ContentSerializer = new NewtonsoftJsonContentSerializer() })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ICreditApi>(new RefitSettings() { ContentSerializer = new NewtonsoftJsonContentSerializer() })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ISeatsApi>(new RefitSettings() { ContentSerializer = new NewtonsoftJsonContentSerializer() })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ISharedServicesBookingApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ISharedServicesVouchersApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));
builder.Services
    .AddRefitClient<ISharedServicesAccountApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ISharedServicesVouchersApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ISharedServicesAccountApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ISharedServicesDataHubApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));


builder.Services
    .AddRefitClient<IContactUsApi>(new RefitSettings { ContentSerializer = new NewtonsoftJsonContentSerializer() })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<IVoucherApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services
    .AddRefitClient<ITradePortalAccountApi>(new RefitSettings
    {
        ContentSerializer = new NewtonsoftJsonContentSerializer()
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri(webApiUrl));

builder.Services.AddSingleton<CustomerFaker>();
builder.Services.AddSingleton<AdultFaker>();
builder.Services.AddSingleton<ChildFaker>();
builder.Services.AddSingleton<InfantFaker>();
builder.Services.AddSingleton<GetPackagesRequestFaker>();

builder.Services.AddScoped<IOfferService, OfferService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<ISharedServicesBookingService, SharedServicesBookingService>();
builder.Services.AddScoped<ISharedServicesVouchersService, SharedServicesVouchersService>();
builder.Services.AddScoped<ISharedServicesAccountService, SharedServicesAccountService>();
builder.Services.AddScoped<ISharedServicesDataHubService, SharedServicesDataHubService>();
builder.Services.AddScoped<ICallCentreService, CallCentreService>();
builder.Services.AddScoped<ICreditService, CreditService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();

builder.Services.AddScoped<IBookingCreationStrategy, RegularBooking>();
builder.Services.AddScoped<IBookingCreationStrategy, RoomAndBoard>();

builder.Services.AddScoped<IBookingCreationStrategySelector, BookingCreationStrategySelector>();

builder.Services.AddScoped<IOffersBuilder, OffersBuilder>();
builder.Services.AddScoped<IBookingBuilder, BookingBuilder>();
builder.Services.AddScoped<IBookingApiService, BookingApiService>();
builder.Services.AddScoped<ITradePortalAccountService, TradePortalAccountService>();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=BookingUI}/{action=Index}/{id?}");
app.MapControllers();

app.Run();

namespace easyJet.Holidays.IntegrationTests.TestApi
{
    public partial class Program
    {
    }
}

public class DataMemberContractResolver : DefaultContractResolver
{
    protected override JsonProperty CreateProperty(System.Reflection.MemberInfo member, MemberSerialization memberSerialization)
    {
        var property = base.CreateProperty(member, memberSerialization);

        var dataMemberAttribute = member.GetCustomAttribute<DataMemberAttribute>();
        if (dataMemberAttribute != null && !string.IsNullOrEmpty(dataMemberAttribute.Name))
        {
            property.PropertyName = dataMemberAttribute.Name;
        }

        return property;
    }
}
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS publish

WORKDIR /usr/src

COPY . .

RUN dotnet publish ./IntegrationTests/easyJet.Holidays.IntegrationTests.TestApi -c Release -o publish --property WarningLevel=0


FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY --from=publish --chown=app:app /usr/src/publish ./

# Ensure that application runs with non-root privileges
USER app

CMD ["dotnet", "easyJet.Holidays.IntegrationTests.TestApi.dll"]

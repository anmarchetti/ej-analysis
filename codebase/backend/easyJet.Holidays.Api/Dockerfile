FROM dhi.io/dotnet:10-sdk-alpine3.23 AS publish

WORKDIR /usr/src

# Install full CA bundle - the hardened runner image has a stripped trust store
RUN apk add --no-cache ca-certificates

COPY . .

# Clean environment-specific appsettings.json files to avoid conflicts
RUN rm ./easyJet.Holidays.Api/appsettings.*.json

# Use docker logging configuration
RUN mv -f ./easyJet.Holidays.Api/NLog.Ecs.config ./easyJet.Holidays.Api/NLog.config

RUN dotnet publish ./easyJet.Holidays.Api/easyJet.Holidays.Api.csproj \
    --configuration Release \
    --output publish \
    --property WarningLevel=0 \
    --property UseAppHost=false


FROM dhi.io/aspnetcore:10-alpine3.23 AS runner

WORKDIR /app

COPY --from=publish /usr/src/publish ./
COPY --from=publish /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

USER nonroot

ENV ASPNETCORE_URLS="http://localhost:5000"

EXPOSE 5000

CMD ["dotnet", "easyJet.Holidays.Api.dll"]

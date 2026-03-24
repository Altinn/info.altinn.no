FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["umbraco-infoportal/umbraco-infoportal.csproj", "umbraco-infoportal/"]
RUN dotnet restore "umbraco-infoportal/umbraco-infoportal.csproj"
COPY . .
WORKDIR "/src/umbraco-infoportal"
RUN dotnet build "umbraco-infoportal.csproj" -c  $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "umbraco-infoportal.csproj" -c  $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ConnectionStrings__umbracoDbDSN="Server=tcp:${AZURE_SQL_FQDN},1433;Initial Catalog=umbraco;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Authentication=\"Active Directory Default\";"
ENV ConnectionStrings__umbracoDbDSN_ProviderName="Microsoft.Data.SqlClient"

ENTRYPOINT ["dotnet", "umbraco-infoportal.dll"]

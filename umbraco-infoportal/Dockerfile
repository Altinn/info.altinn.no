FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:ddcf70ad1ab963a4fcd41fbd722a6b660e404e87567cfbd46fd2809c21b02088 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:548d93f8a18a1acbe6cc127bc4f47281430d34a9e35c18afa80a8d6741c2adc3 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["umbraco-infoportal/umbraco-infoportal.csproj", "umbraco-infoportal/"]
COPY ["Adapters/Infoportal.Adapters.Elasticsearch/Infoportal.Adapters.Elasticsearch.csproj", "Adapters/Infoportal.Adapters.Elasticsearch/"]
COPY ["Adapters/Infoportal.Adapters.Cloudflare/Infoportal.Adapters.Cloudflare.csproj", "Adapters/Infoportal.Adapters.Cloudflare/"]
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

RUN apt-get update && apt-get install -y tar && apt-get clean && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dotnet", "umbraco-infoportal.dll"]

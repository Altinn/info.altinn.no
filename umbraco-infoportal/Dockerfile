FROM mcr.microsoft.com/dotnet/aspnet:10.0@sha256:1fa23fc4872d95fd71c2833ebe65d7e84a43b2d51a31d119516852f13d9505a7 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0@sha256:ed034a8bf0b24ded0cbbac07e17825d8e9ebfe21e308191d0f7421eaf5ad4664 AS build
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

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

RUN apt-get update && apt-get install -y tar && apt-get clean && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/bin/tar:${PATH}"

ENTRYPOINT ["dotnet", "umbraco-infoportal.dll"]

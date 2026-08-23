FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /

# copy csproj and restore as distinct layers
COPY *.sln .
COPY Finder/*.csproj ./Finder/
COPY Finder.Tests/*.csproj ./Finder.Tests/
RUN dotnet restore

# copy everything else and build app
COPY Finder/. ./Finder/
WORKDIR /Finder
RUN dotnet publish -c release -o /app --no-restore

# install playwright
RUN dotnet tool install --global Microsoft.Playwright.CLI
ENV PATH="${PATH}:/root/.dotnet/tools"
RUN playwright install chromium

# final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app ./
ENTRYPOINT ["dotnet", "Finder.dll"]

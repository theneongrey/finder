FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /

# copy csproj and restore as distinct layers
COPY *.sln .
COPY Finder/*.csproj ./Finder/
RUN dotnet restore

# copy everything else and build app
COPY Finder/. ./Finder/
WORKDIR /Finder
RUN dotnet publish -c release -o /app --no-restore

# final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app ./
ENTRYPOINT ["dotnet", "Finder.dll"]
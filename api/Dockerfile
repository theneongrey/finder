## Build stage
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

# install pwsh and use the version-locked playwright.ps1 from the published output
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -sL https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -o /tmp/ms-prod.deb \
    && dpkg -i /tmp/ms-prod.deb && rm /tmp/ms-prod.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends powershell \
    && rm -rf /var/lib/apt/lists/* \
    && pwsh /app/playwright.ps1 install chromium

## Final stage — clean image, no build tools
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app ./
COPY --from=build /root/.cache/ms-playwright /root/.cache/ms-playwright

# chromium shared-library dependencies only (no tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libcairo2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dotnet", "Finder.dll"]

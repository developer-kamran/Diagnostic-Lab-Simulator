# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first (layer caching)
COPY DLSimulator.Backend.sln ./
COPY backend/DLSimulator.API.csproj ./backend/
COPY DLSimulator.Core/DLSimulator.Core.csproj ./DLSimulator.Core/

# Restore dependencies
RUN dotnet restore

# Copy everything else and publish
COPY . .
RUN dotnet publish backend/DLSimulator.API.csproj -c Release -o /app/publish

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Railway injects PORT env variable — ASP.NET Core reads ASPNETCORE_URLS
ENV ASPNETCORE_URLS=http://+:$PORT

EXPOSE $PORT

ENTRYPOINT ["dotnet", "DLSimulator.API.dll"]

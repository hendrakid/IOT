---
description: "Use when writing or modifying Android app code, Kotlin files, Gradle config, layouts, or Android-specific API integration. Covers Kotlin, Retrofit, Room, Material Design."
applyTo: "android/**"
---
# Android App Conventions

## Tech Stack

- Language: Kotlin (use type hints, null safety, coroutines)
- Architecture: MVVM (Model-View-ViewModel)
- HTTP Client: Retrofit + OkHttp
- Local Cache: Room Database
- UI: Material Design 3 / Jetpack Compose
- DI: Hilt or Koin
- Testing: JUnit (unit), Espresso (E2E + accessibility)

## Project Structure

```
android/app/src/main/
├── java/com/smartlock/
│   ├── data/
│   │   ├── remote/       # Retrofit API interfaces & DTOs
│   │   ├── local/        # Room database, DAOs, entities
│   │   └── repository/   # Repository pattern implementations
│   ├── ui/
│   │   ├── attendance/   # Attendance list screen
│   │   ├── cards/        # Card management screen
│   │   └── dashboard/    # Main dashboard screen
│   ├── di/               # Dependency injection modules
│   └── util/             # Extension functions, helpers
├── res/
│   ├── layout/           # XML layouts (if not Compose)
│   └── values/           # Strings, colors, themes
└── AndroidManifest.xml
```

## API Integration

- Use Retrofit with suspend functions (coroutines)
- Define API interface matching the Express.js endpoints
- Handle network errors gracefully — show user-friendly messages
- Use Room as offline cache for attendance records
- Sync strategy: fetch on app open, pull-to-refresh, background WorkManager sync

## Accessibility

- All interactive elements must have `contentDescription`
- Use sufficient color contrast (WCAG AA minimum)
- Support TalkBack screen reader
- Test with Espresso accessibility checks enabled
- Minimum touch target size: 48dp x 48dp

## Code Conventions

- Use Kotlin idioms: `let`, `apply`, `also`, data classes, sealed classes
- Prefer `val` over `var` (immutability)
- Use `Flow` for reactive data streams from Room
- Coroutine scopes: `viewModelScope` in ViewModels, `lifecycleScope` in UI
- Name ViewModels with suffix: `AttendanceViewModel`, `CardViewModel`

## Build & Test

- `./gradlew build` — Full build
- `./gradlew test` — Unit tests
- `./gradlew connectedAndroidTest` — Instrumented / E2E tests
- `./gradlew lint` — Static analysis
- Define API base URL in `BuildConfig` (different per build variant)

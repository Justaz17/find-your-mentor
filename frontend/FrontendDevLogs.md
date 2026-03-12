# Find Your Mentor - Frontend Development Log

**Project:** Find Your Mentor (FYP)  
**Student:** Justas (K00286090)  
**Tech Stack:** React Native (Expo), TypeScript, React Navigation, Axios  
**Development Period:** February 2026

---

## Purpose of This Document

This log tracks the iterative development process for the frontend (mobile application) of the Find Your Mentor platform. It records features built, technical decisions made, errors encountered and how they were resolved, and code changes with justifications. This document complements the backend development log and covers Phases 4 onwards.

---

## Development Timeline

### **Phase 4: Frontend Foundation & Project Structure**

#### **Feature 4.1: Expo Project Initialisation and Directory Structure**

**Goal:** Set up the React Native project with Expo and establish a scalable folder structure

**Steps Taken:**
1. Initialised the Expo project using Expo CLI, which scaffolded a standard React Native project with TypeScript support
2. Created the `src/` directory inside `frontend/` to organise all application source code
3. Established subdirectories following a layered architecture pattern:
   - `src/components/` — Reusable UI elements (Button, Input, Header, MentorCard, CategoryCard)
   - `src/context/` — Global state management using React Context API (AuthContext, AppProvider)
   - `src/hooks/` — Custom React hooks for shared logic
   - `src/navigation/` — React Navigation configuration (AppNavigator, StackNavigator, TabNavigator, types)
   - `src/screens/` — Full-page screen components (AuthScreen, HomeScreen, SearchScreen, BookingScreen, LearnerDashboardScreen, MentorProfileScreen)
   - `src/services/` — API communication layer (api.ts, authService.ts, mentorService.ts, bookingService.ts)
   - `src/types/` — TypeScript type definitions (User.ts, Mentor.ts, Booking.ts, Message.ts, Session.ts)
   - `src/utils/` — Helper functions and constants (constants.ts, formatDate.ts, formatPrice.ts, validators.ts)
4. Created placeholder files in each directory to establish the structure before implementation

**Files Created:**
- All directory folders and initial empty `.tsx`/`.ts` files across the project structure

**Technical Decisions:**
- **TypeScript over JavaScript:** Chose TypeScript for type safety across the application, catching errors at compile time rather than runtime. This was particularly important for ensuring API response types matched what the backend returned
- **Layered folder structure:** Separated concerns into distinct directories (screens, components, services, context) to maintain clean code organisation. This mirrors the separation of concerns used in the backend (routers, models, schemas)
- **Dedicated services layer:** Abstracted all API communication into service files rather than making HTTP calls directly from components. This centralises API logic, making it easier to update endpoints and handle errors consistently
- **Separate types directory:** TypeScript interfaces defined in their own directory rather than inline, allowing reuse across screens, services, and components

**Outcome:** Project structure established with clear separation of concerns, ready for feature implementation

---

#### **Feature 4.2: Dependency Installation**

**Goal:** Install all required libraries for navigation, HTTP communication, authentication, and storage

**Steps Taken:**
1. Installed React Navigation packages for screen routing:
   ```bash
   npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
   ```
2. Installed Axios for HTTP requests, AsyncStorage for token persistence, and jwt-decode for token parsing:
   ```bash
   npm install axios @react-native-async-storage/async-storage jwt-decode
   ```
3. Verified all packages installed correctly via `package.json`

**Technical Decisions:**
- **React Navigation:** Industry-standard navigation library for React Native, providing native-feeling transitions and stack/tab navigation patterns
- **Axios over fetch:** Chosen for its cleaner API, built-in request/response interceptors (used for automatic token attachment), and better error handling compared to the native `fetch` API
- **AsyncStorage:** React Native's equivalent of localStorage for persisting the JWT token between app sessions
- **jwt-decode:** Lightweight library for decoding JWT tokens on the client side without needing to call the backend for user information

**Outcome:** All dependencies installed, no version conflicts encountered

---

#### **Feature 4.3: TypeScript Type Definitions**

**Goal:** Define TypeScript interfaces that mirror the backend Pydantic schemas for type safety

**Steps Taken:**
1. Created `User.ts` with `User`, `UserCreate`, `UserLogin`, and `AuthResponse` interfaces matching backend schemas
2. Created `Mentor.ts` with `Skill` and `MentorProfile` interfaces matching `MentorProfileWithSkills` backend schema
3. Created `Booking.ts` with `Booking` interface including status union type (`'pending' | 'confirmed' | 'cancelled'`)
4. Created `Message.ts` with `Message` and `Conversation` interfaces
5. Created `Session.ts` with `Session` interface for local auth state
6. Created `navigation/types.ts` with `RootStackParamList` and `TabParamList` for type-safe navigation

**Files Created:**
- `src/types/User.ts`
- `src/types/Mentor.ts`
- `src/types/Booking.ts`
- `src/types/Message.ts`
- `src/types/Session.ts`
- `src/navigation/types.ts`

**Technical Decisions:**
- **Mirrored backend schemas:** Frontend types directly reflect the Pydantic schemas from the backend (e.g., `UserCreate` matches the `UserCreate` Pydantic model). This ensures type consistency across the full stack
- **Union types for status fields:** Used TypeScript union types (e.g., `'pending' | 'confirmed' | 'cancelled'`) rather than generic strings to catch invalid status values at compile time
- **Navigation types defined separately:** `RootStackParamList` and `TabParamList` defined in the navigation directory to enable type-safe navigation with `useNavigation<>()` and `useRoute<>()` hooks

**Outcome:** Complete type definitions for all current and planned features, providing compile-time type checking across the application

---

#### **Feature 4.4: Utility Functions and Constants**

**Goal:** Create shared constants and helper functions used across the application

**Steps Taken:**
1. Created `constants.ts` with:
   - `API_BASE_URL` configuration (set to `http://10.0.2.2:8000` for Android emulator, which maps to `localhost:8000` on the host machine)
   - `Colors` object with design theme colours (purple primary: `#6C3AED`, derived from the wireframes in the Design chapter)
   - `Spacing` and `FontSize` objects for consistent layout values
   - `CATEGORIES` array with category data for the home screen browse section
2. Created `formatDate.ts` with date/time formatting functions using `en-IE` locale
3. Created `formatPrice.ts` with euro-formatted price display functions
4. Created `validators.ts` with input validation functions for email, password, and name fields, plus composite validation for login and registration forms

**Files Created:**
- `src/utils/constants.ts`
- `src/utils/formatDate.ts`
- `src/utils/formatPrice.ts`
- `src/utils/validators.ts`

**Technical Decisions:**
- **Centralised colour palette:** All colours defined in one `Colors` object to ensure visual consistency and make theme changes trivial. The purple primary (`#6C3AED`) was derived from the wireframes presented in the Analysis and Design chapter
- **`10.0.2.2` for emulator:** Android emulators use `10.0.2.2` as a special alias to reach `localhost` on the host machine. This was used instead of `localhost` or `127.0.0.1` which would refer to the emulator's own loopback interface
- **Client-side validation:** Validation functions return error messages as strings (or `null` for valid input), allowing the UI to display specific feedback before making API calls. This reduces unnecessary network requests for obviously invalid inputs
- **Design tokens approach:** Using `Spacing` and `FontSize` objects rather than hardcoded values throughout components. This approach acts similarly to CSS variables or design tokens, maintaining consistency without a CSS preprocessor

**Outcome:** Shared utilities ready for use across all screens and components

---

### **Phase 5: API Communication Layer**

#### **Feature 5.1: Axios API Instance with Interceptors**

**Goal:** Create a centralised HTTP client that automatically handles authentication and error formatting

**Steps Taken:**
1. Created `api.ts` with an Axios instance configured with the backend base URL
2. Implemented a **request interceptor** that reads the JWT token from AsyncStorage and attaches it as a `Bearer` token in the `Authorization` header for every outgoing request
3. Implemented a **response interceptor** that:
   - Extracts clean error messages from backend error responses (`detail` field from FastAPI's HTTPException)
   - Handles 401 Unauthorized responses (logged as warning for potential token expiry)
   - Converts network errors into user-friendly messages
4. Set a 10-second request timeout to prevent the UI hanging on unresponsive connections

**Files Created:**
- `src/services/api.ts`

**Technical Decisions:**
- **Request interceptor for auth:** Rather than manually adding the `Authorization` header in every API call, the interceptor handles this automatically. This follows the DRY principle and ensures no protected endpoint is accidentally called without a token
- **Response interceptor for errors:** Backend errors from FastAPI come in different formats (`detail` string, `message` field, etc.). The interceptor normalises these into consistent `Error` objects that any component can display directly
- **10-second timeout:** Chosen as a balance between allowing slow connections and not leaving users waiting indefinitely. Network errors display a specific "check your connection" message

**Outcome:** Centralised API client with automatic authentication and consistent error handling

---

#### **Feature 5.2: Service Functions**

**Goal:** Create typed service functions for each backend API endpoint

**Steps Taken:**
1. Created `authService.ts` with:
   - `register()` — `POST /auth/register` with `UserCreate` payload, returns `User`
   - `login()` — `POST /auth/login` with `UserLogin` payload, returns `AuthResponse` containing the JWT
   - `getCurrentUser()` — `GET /auth/me` for retrieving user profile (placeholder for future endpoint)
2. Created `mentorService.ts` with:
   - `getMentors()` — `GET /mentors` with optional skill query parameter, returns `MentorProfile[]`
   - `getMentorById()` — `GET /mentors/{id}`, returns single `MentorProfile`
   - `createOrUpdateMentorProfile()` — `POST /mentors/me/profile` for creating/updating mentor profiles
3. Created `bookingService.ts` with:
   - `getMyBookings()` — `GET /bookings/me`, returns `Booking[]`
   - `createBooking()` — `POST /bookings` with availability slot ID

**Files Created:**
- `src/services/authService.ts`
- `src/services/mentorService.ts`
- `src/services/bookingService.ts`

**Technical Decisions:**
- **One service file per feature domain:** Mirrors the backend router structure (auth.py, mentors.py) for easy cross-referencing between frontend and backend code
- **Typed return values:** Every service function specifies its return type using the TypeScript interfaces from `src/types/`. This means calling `getMentors()` returns `Promise<MentorProfile[]>` — any component consuming this data gets full autocomplete and type checking
- **Endpoint paths match backend exactly:** Service functions use the same URL paths defined in the FastAPI routers (e.g., `/auth/register`, `/mentors`, `/mentors/{id}`). This direct mapping simplifies debugging when tracing requests from frontend to backend

**Outcome:** Complete API service layer with typed functions for all implemented backend endpoints

---

### **Phase 6: Authentication State Management**

#### **Feature 6.1: Auth Context and Provider**

**Goal:** Implement global authentication state management using React Context API

**Steps Taken:**
1. Created `AuthContext.tsx` with:
   - `AuthContextType` interface defining the context shape (user, token, isLoading, isAuthenticated, signIn, signOut)
   - `getUserFromToken()` helper that decodes a JWT using `jwt-decode` to extract user information (email from `sub` field, name derived from email)
   - `AuthProvider` component with state management for user, token, and loading status
   - `useEffect` hook that runs on app startup to check AsyncStorage for an existing token (persistent login)
   - `signIn()` function that stores the token in AsyncStorage and updates context state
   - `signOut()` function that clears the token from AsyncStorage and resets state
   - `useAuth()` custom hook for components to consume auth state
2. Created `AppProvider.tsx` as a wrapper component that combines all context providers (currently only AuthProvider, but extensible for future providers)
3. Added a safety timeout (3 seconds) to the token loading process to prevent the app from being stuck on a loading state if AsyncStorage is slow to respond

**Files Created:**
- `src/context/AuthContext.tsx`
- `src/context/AppProvider.tsx`

**Technical Decisions:**
- **React Context over Redux:** For an application of this scope, React Context provides sufficient state management without the additional boilerplate and learning curve of Redux. The auth state (user, token, loading) is simple enough that Context handles it effectively
- **JWT decoding on client:** User information (email, name) is extracted from the JWT payload rather than making an additional API call to fetch user details after login. The backend stores the user's email in the JWT `sub` field (standard JWT claim), which the frontend decodes to populate the user state
- **Persistent login via AsyncStorage:** The token is saved to AsyncStorage on login and checked on app startup. This means users don't need to log in every time they open the app, improving the user experience. If the token is invalid or expired, it's automatically cleared
- **Safety timeout mechanism:** A 3-second timeout was added around the AsyncStorage token loading to prevent the app from being permanently stuck on a loading spinner if the storage operation hangs

**Errors Faced:**
1. **App stuck on loading spinner (white screen with spinner)**
   - **Cause:** The `isLoading` state in AuthContext was initialised as `true` and was not being set to `false` promptly. AsyncStorage can be slow on first launch in the Android emulator, causing the app to remain in a loading state
   - **Solution:** Added a `setTimeout` safety mechanism that forces `isLoading` to `false` after 3 seconds, plus added `console.log` statements for debugging the token loading flow. This ensured that even if AsyncStorage was slow, the app would proceed to the auth screen

**Outcome:** Global auth state management working with persistent login, automatic token checking on startup, and safe fallback for slow storage operations

---

### **Phase 7: Navigation Architecture**

#### **Feature 7.1: Stack Navigator (Authentication Flow)**

**Goal:** Implement conditional navigation that shows auth screen or main app based on login state

**Steps Taken:**
1. Created `StackNavigator.tsx` with a native stack navigator
2. Implemented conditional rendering:
   - If `isAuthenticated` is `false`: render `AuthScreen` only
   - If `isAuthenticated` is `true`: render `TabNavigator` (main app) and `MentorProfileScreen` (modal)
3. Configured `MentorProfileScreen` as a stack screen with a visible header and back navigation
4. Set `animationTypeForReplace: 'pop'` on the Auth screen for a natural transition when logging out

**Files Created:**
- `src/navigation/StackNavigator.tsx`

**Technical Decisions:**
- **Conditional navigation over auth guards:** Rather than rendering all screens and using route guards to redirect, the navigator conditionally renders different screen sets based on auth state. This is the recommended React Navigation pattern and prevents unauthenticated users from accessing any protected screens
- **Auth screen replacement animation:** Using `animationTypeForReplace: 'pop'` creates a natural "stepping back" animation when the user logs out, rather than an awkward forward push

**Outcome:** Authentication flow working — app shows login/register when not authenticated, main app when authenticated

---

#### **Feature 7.2: Tab Navigator (Main App Navigation)**

**Goal:** Create bottom tab navigation for the main application screens

**Steps Taken:**
1. Created `TabNavigator.tsx` with a bottom tab navigator containing four tabs:
   - **Home** (🏠) — HomeScreen (mentor discovery, main entry point)
   - **Search** (🔍) — SearchScreen (placeholder for mentor search)
   - **Bookings** (📅) — BookingScreen (placeholder for booking management)
   - **Dashboard** (👤) — LearnerDashboardScreen (user profile, settings, logout)
2. Configured tab bar styling with the app's purple accent colour for active tabs
3. Used emoji icons as temporary tab icons (sufficient for MVP, can upgrade to icon library later)

**Files Created:**
- `src/navigation/TabNavigator.tsx`

**Technical Decisions:**
- **Four-tab structure:** Aligned with the wireframes from the Design chapter, which showed mentor discovery as the main entry point, with bookings and dashboard accessible via tabs
- **Emoji icons over icon library:** Used emoji characters (🏠, 🔍, 📅, 👤) rather than installing an icon library like `react-native-vector-icons`. This reduced dependencies and was sufficient for the current stage. A proper icon library can be integrated later if needed
- **Tab bar styling:** Active tab colour uses the primary purple (`#6C3AED`) to maintain visual consistency with the overall design theme

**Outcome:** Bottom tab navigation functional with four tabs, consistent styling

---

#### **Feature 7.3: Root App Navigator**

**Goal:** Connect the navigation container to the app entry point

**Steps Taken:**
1. Created `AppNavigator.tsx` wrapping `StackNavigator` inside React Navigation's `NavigationContainer`
2. Updated `App.tsx` (root component) to wrap everything in `AppProvider` and render `AppNavigator`
3. Configured status bar styling (dark content on white background)

**Files Created:**
- `src/navigation/AppNavigator.tsx`

**Files Modified:**
- `App.tsx` (root entry point — wrapped with AppProvider, renders AppNavigator)

**Outcome:** Complete navigation tree: `App.tsx` → `AppProvider` → `AppNavigator` → `StackNavigator` → (Auth or Tabs)

---

### **Phase 8: Screen Implementation**

#### **Feature 8.1: Authentication Screen (Login & Registration)**

**Goal:** Build a combined login/registration screen that communicates with the backend auth endpoints

**Steps Taken:**
1. Created `AuthScreen.tsx` with a togglable login/register form
2. Implemented the header section with:
   - App logo (purple square with "FM" initials)
   - App name "Find Your Mentor"
   - Subtitle describing the app's purpose
3. Built a tab toggle component (Log In / Sign Up) with animated active state
4. Implemented the login form with:
   - Email input with `email-address` keyboard type and autocomplete
   - Password input with `secureTextEntry` for masked input
   - Form validation using `getLoginErrors()` from validators
   - API call to `login()` service function
   - On success: calls `signIn()` from AuthContext with the returned JWT token
5. Implemented the registration form with:
   - Full Name input with `words` auto-capitalisation
   - Email, Password, and Confirm Password fields
   - Form validation using `getRegistrationErrors()` from validators
   - API call to `register()` followed by automatic `login()` call
   - On success: auto-logs in the user without requiring a separate login step
6. Added error display with a styled error banner (red left border, light red background)
7. Added loading state with `ActivityIndicator` and disabled button during API calls
8. Wrapped in `KeyboardAvoidingView` and `ScrollView` for proper keyboard handling on Android

**Files Created:**
- `src/screens/AuthScreen.tsx`

**Technical Decisions:**
- **Combined login/register screen:** Rather than separate screens, a toggle approach reduces navigation complexity and provides a smoother user experience. The form resets when toggling between modes
- **Auto-login after registration:** After successful registration, the app automatically calls the login endpoint and signs in the user. This eliminates the friction of requiring users to manually log in after creating an account
- **Client-side validation before API calls:** Validation runs locally before making network requests, providing instant feedback and reducing unnecessary API calls for invalid inputs
- **KeyboardAvoidingView:** Prevents the keyboard from covering input fields on Android, using `behavior="height"` which works more reliably on Android than `behavior="padding"`

**Outcome:** Auth screen functional with:
- Login form connects to `POST /auth/login`
- Registration form connects to `POST /auth/register` then auto-logs in
- Client-side validation with error display
- Loading states during API calls
- Automatic navigation to Home screen on successful authentication

---

#### **Feature 8.2: Home Screen (Mentor Discovery)**

**Goal:** Build the main landing screen with search, category browsing, and mentor listing, aligned with the wireframes in the Design chapter

**Steps Taken:**
1. Created `HomeScreen.tsx` with three main sections:
   - **Hero section:** Personalised greeting (time-based: morning/afternoon/evening + user's name if logged in), headline text, search bar, and popular skill tags
   - **Browse by Category:** Horizontal scrollable list of category cards (Fitness, Programming, Music, Finance, Languages, Design) matching the wireframe layout
   - **Top Mentors:** Vertical list of mentor cards fetched from the backend API
2. Implemented data fetching:
   - `useEffect` calls `getMentors()` on screen mount to fetch all visible mentors from `GET /mentors`
   - Loading state shows `ActivityIndicator` while data is being fetched
   - Error state shows error message with a "Try Again" retry button
   - Empty state shows a friendly message when no mentors exist yet
3. Implemented pull-to-refresh using React Native's `RefreshControl` component
4. Added search bar (UI ready, search functionality to be connected to Search screen)
5. Added popular tags ("Python", "Yoga", "Spanish", "Guitar") that populate the search field when tapped

**Files Created:**
- `src/screens/HomeScreen.tsx`

**Technical Decisions:**
- **Three-state pattern (loading/error/data):** Every data-fetching screen implements loading, error, and success states. This provides clear feedback to users at all times and handles network issues gracefully
- **Pull-to-refresh:** Allows users to manually refresh the mentor list, which is a standard mobile UX pattern. Uses React Native's built-in `RefreshControl` component
- **Personalised greeting:** The greeting adapts based on time of day and includes the user's name from auth context, creating a more personal experience
- **Categories from constants:** Category data is defined in `constants.ts` rather than hardcoded in the component, making it easy to add or modify categories later
- **ScrollView over FlatList for mentors:** Used `ScrollView` with mapped mentor cards rather than `FlatList` because the home screen has mixed content (hero, categories, mentors). `FlatList` would be used for a dedicated search/listing screen with large datasets

**Outcome:** Home screen rendering with:
- Personalised greeting with user's name
- Search bar with popular tags
- Horizontal category browsing
- Mentor list from backend API with loading/error/empty states
- Pull-to-refresh functionality

---

#### **Feature 8.3: Placeholder Screens**

**Goal:** Create functional placeholder screens for tabs that haven't been fully implemented yet

**Steps Taken:**
1. Created `SearchScreen.tsx` with placeholder UI ("Search for mentors — coming soon")
2. Created `BookingScreen.tsx` with placeholder UI ("Your bookings will appear here")
3. Created `LearnerDashboardScreen.tsx` with user's name display and functional logout button
4. Created `MentorProfileScreen.tsx` with route parameter extraction (receives `mentorId` from navigation)

**Files Created:**
- `src/screens/SearchScreen.tsx`
- `src/screens/BookingScreen.tsx`
- `src/screens/LearnerDashboardScreen.tsx`
- `src/screens/MentorProfileScreen.tsx`

**Technical Decisions:**
- **Functional placeholders over empty files:** Each placeholder screen renders meaningful UI and uses the app's design constants, rather than being completely empty. This ensures the tab navigation works correctly and provides visual feedback about what each screen will contain
- **Dashboard includes logout:** The LearnerDashboardScreen includes a working logout button that calls `signOut()` from AuthContext, allowing users to log out during testing
- **MentorProfile receives params:** The MentorProfileScreen extracts `mentorId` from navigation route parameters using `useRoute<>()`, demonstrating the data flow for when the full profile view is implemented

**Errors Faced:**
1. **"Got an invalid value for 'component' prop for the screen 'MentorProfile'"**
   - **Cause:** Several screen files (`MentorProfileScreen.tsx`, `SearchScreen.tsx`, `BookingScreen.tsx`, `LearnerDashboardScreen.tsx`) were 0 bytes — they had been created as empty placeholder files in December 2025 when the project structure was initially set up, but never had code added to them. When React Navigation tried to register these as screen components, it received `undefined` instead of valid React components
   - **Solution:** Added proper React component implementations to all four empty screen files. Each component was given a functional UI with the app's styling constants. After saving all files, the navigation registered the components correctly

2. **"Element type is invalid: expected a string or a class/function but got: undefined"**
   - **Cause:** Same root issue as above — the root `App.tsx` imported `AppProvider` from `src/context/AppProvider.tsx` and `AppNavigator` from `src/navigation/AppNavigator.tsx`, both of which were also 0-byte empty files from the initial project scaffolding
   - **Solution:** Added the implementation code to `AppProvider.tsx` (wrapping AuthProvider) and `AppNavigator.tsx` (wrapping NavigationContainer with StackNavigator). The lesson learned was to always verify file contents when working with a pre-existing project structure — empty files pass directory listings but fail at runtime

**Outcome:** All placeholder screens functional, tab navigation working, logout functional from Dashboard

---

### **Phase 9: Reusable Components**

#### **Feature 9.1: MentorCard Component**

**Goal:** Create a reusable card component for displaying mentor information in lists

**Steps Taken:**
1. Created `MentorCard.tsx` with a horizontal card layout containing:
   - **Avatar:** Generated from mentor's initials with a consistent colour derived from the name
   - **Info section:** Mentor name, skill chips (up to 3 displayed with "+N" overflow), and bio preview (2-line truncation)
   - **Price:** Hourly rate in euros with "/session" label, styled in purple
2. Implemented initials extraction from `user_name` (e.g., "Sarah Johnson" → "SJ")
3. Implemented deterministic colour assignment using name length modulo against a colour palette array

**Files Created:**
- `src/components/MentorCard.tsx`

**Technical Decisions:**
- **Initials-based avatar:** Used generated initials with coloured backgrounds rather than requiring profile images. This provides visual distinction between mentors without needing image upload functionality (which is out of scope for MVP)
- **Deterministic colour assignment:** Avatar colour is derived from the mentor's name length, ensuring the same mentor always gets the same colour across different views. This provides visual consistency without storing colour preferences
- **Skill chip limit:** Only showing 3 skills with a "+N more" indicator prevents cards from becoming too tall while still communicating the mentor's expertise range

**Outcome:** Reusable mentor card component displaying name, skills, bio, and pricing, used in HomeScreen mentor list

---

#### **Feature 9.2: CategoryCard Component**

**Goal:** Create a card component for the "Browse by Category" section on the home screen

**Steps Taken:**
1. Created `CategoryCard.tsx` with a vertical card layout:
   - Coloured icon container with semi-transparent background (colour + 15% opacity)
   - Category name text below
2. Designed to work within a horizontal `ScrollView` with fixed width

**Files Created:**
- `src/components/CategoryCard.tsx`

**Outcome:** Category cards rendering in horizontal scroll on home screen, matching the Design chapter wireframe layout

---

#### **Feature 9.3: Shared UI Components**

**Goal:** Create reusable Button, Input, and Header components for consistent UI across screens

**Steps Taken:**
1. Created `Button.tsx` with three variants:
   - **Primary:** Purple background, white text (main actions)
   - **Secondary:** Light background, dark text (secondary actions)
   - **Outline:** Transparent background, purple border and text (tertiary actions)
   - Loading state with `ActivityIndicator`
   - Disabled state with reduced opacity
2. Created `Input.tsx` with:
   - Optional label text above the input
   - Error state with red border and error message below
   - Passes through all standard `TextInput` props for flexibility
3. Created `Header.tsx` with:
   - Centred title text
   - Optional back button (left side)
   - Optional right action button

**Files Created:**
- `src/components/Button.tsx`
- `src/components/Input.tsx`
- `src/components/Header.tsx`

**Technical Decisions:**
- **Variant-based Button:** A single Button component with a `variant` prop rather than separate PrimaryButton, SecondaryButton components. This reduces code duplication and ensures all buttons share consistent sizing and behaviour
- **Input with built-in error display:** Rather than requiring every form to implement its own error text positioning, the Input component handles error display internally when an `error` prop is provided

**Outcome:** Three reusable components available for use across all current and future screens

---

## Errors and Debugging Summary

### Emulator and Tooling Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `adb.exe: device offline` — could not connect to TCP port 5554 | Android emulator disconnected from ADB (Android Debug Bridge). The emulator had been running for an extended period and lost its connection | Closed the emulator completely, restarted it from Android Studio Device Manager, ran `adb kill-server` followed by `adb start-server` to reset the ADB connection, then relaunched with `npx expo start` and pressed `a` |
| PowerShell `dir` command failing with `/s /b` flags | Used CMD-style flags (`/s /b`) in PowerShell terminal. PowerShell's `dir` is an alias for `Get-ChildItem` which uses different parameter syntax | Used PowerShell-compatible syntax: `dir src\context` instead of `dir frontend\src /s /b`. Also needed to drop the `frontend\` prefix when already inside the frontend directory |
| Path `frontend\frontend\src\context` not found | Ran `dir frontend\src\context` while already inside the `frontend/` directory, causing a doubled path | Corrected to `dir src\context` (relative to current directory) |

### React Native / Component Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| "Element type is invalid: expected a string or a class/function but got: undefined" on `App` render | `AppProvider.tsx` and `AppNavigator.tsx` were 0-byte empty files created during initial project scaffolding in December 2025. React received `undefined` when importing these files | Added proper implementation code to both files. `AppProvider.tsx` received the context wrapper component, `AppNavigator.tsx` received the NavigationContainer setup |
| "Got an invalid value for 'component' prop for the screen 'MentorProfile'" | `MentorProfileScreen.tsx`, `SearchScreen.tsx`, `BookingScreen.tsx`, and `LearnerDashboardScreen.tsx` were all 0-byte empty files. React Navigation requires valid React components for screen registration | Implemented placeholder components in all four files with proper `export default` statements. Verified file sizes using `dir src\screens` to confirm files were no longer 0 bytes |
| App stuck on white screen with loading spinner | `AuthContext` initialised `isLoading` as `true` and AsyncStorage was slow to respond on first emulator launch, leaving the app in a permanent loading state | Added a 3-second safety timeout using `setTimeout` that forces `isLoading` to `false` if the AsyncStorage operation hasn't completed. Added `console.log` statements throughout the token loading flow for debugging visibility |

### Environment and Configuration Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| Backend virtual environment not activated | Attempted to run `uvicorn` without activating the Python virtual environment first, resulting in missing module errors | Established the workflow: always run `.\venv\Scripts\activate` before `uvicorn app.main:app --reload` when opening a new terminal for backend development |
| Frontend not connecting to backend | Need both backend and frontend servers running simultaneously for the app to function | Established dual-terminal workflow: Terminal 1 runs backend (`uvicorn`), Terminal 2 runs frontend (`npx expo start`). Both must be active for full functionality |

---

## Summary of Completed Frontend Features

### Project Infrastructure
- Expo project with TypeScript
- Layered folder structure (components, context, hooks, navigation, screens, services, types, utils)
- All dependencies installed (React Navigation, Axios, AsyncStorage, jwt-decode)

### Type System
- TypeScript interfaces for User, Mentor, Booking, Message, Session
- Navigation type definitions for type-safe routing

### API Communication
- Axios instance with automatic JWT attachment via request interceptor
- Response interceptor for error normalisation
- Typed service functions for auth, mentor, and booking endpoints

### State Management
- AuthContext with persistent login (AsyncStorage)
- JWT token decoding for user information
- Global auth state (user, token, isAuthenticated, isLoading)

### Navigation
- Stack navigator with conditional auth flow
- Bottom tab navigator with four tabs (Home, Search, Bookings, Dashboard)
- Type-safe navigation with route parameters

### Screens
- **AuthScreen:** Login/Register with form validation, API integration, auto-login after registration
- **HomeScreen:** Hero section, category browsing, mentor listing with loading/error/empty states, pull-to-refresh
- **Placeholder screens:** Search, Bookings, Dashboard (with logout), MentorProfile (with route params)

### Reusable Components
- MentorCard (avatar, skills, bio, price)
- CategoryCard (icon, name)
- Button (primary/secondary/outline variants)
- Input (label, error state)
- Header (title, back button, right action)

---

## Key Technical Decisions

| Decision | Reasoning |
|----------|-----------|
| TypeScript over JavaScript | Type safety, compile-time error catching, autocomplete support |
| React Navigation (Stack + Tabs) | Industry-standard navigation, native-feeling transitions, supports conditional auth flow |
| Axios over fetch API | Cleaner API, request/response interceptors for auth and error handling |
| React Context over Redux | Sufficient for app scope, less boilerplate, simpler to maintain |
| AsyncStorage for token persistence | Standard React Native solution for key-value storage, enables persistent login |
| jwt-decode for user info | Avoids extra API call after login, user data extracted directly from token |
| StyleSheet over NativeWind/Tailwind | No extra configuration needed, works out of the box with React Native, simpler debugging. Design tokens in constants.ts provide equivalent consistency |
| Centralised design constants | Single source of truth for colours, spacing, fonts — equivalent to CSS variables |
| Emoji icons over icon library | Reduced dependencies for MVP, sufficient for current development stage |
| Client-side validation | Instant feedback, reduces unnecessary API calls, improves UX |

---

## Next Frontend Features to Implement

### Search Screen
- Skill-based mentor filtering
- Search input with debounced API calls
- Filter chips for categories

### Mentor Profile Screen (Full)
- Complete mentor profile view (bio, skills, hourly rate)
- "Book Session" button
- "Send Message" button
- Availability calendar display

### Booking Flow
- Available time slots display
- Booking confirmation screen
- My bookings list with status indicators

### Messaging
- Conversation list screen
- Individual conversation view
- Message input and sending
- Real-time message updates

### Dashboard (Full)
- User profile editing
- Booking statistics (upcoming, completed)
- Mentor profile management (for users who are mentors)

---

## Notes for Implementation Chapter

### When Writing About Frontend
1. **Reference the Design chapter wireframes:** "The home screen layout was implemented following the wireframe presented in Figure 6 of the Design chapter, with a search bar, category browsing section, and mentor listing"
2. **Show the layered architecture:** Demonstrate how screens → services → API → backend mirrors the separation of concerns
3. **Include screenshots:** Auth screen (login and register states), Home screen (with mentors loaded and empty state)
4. **Highlight the iterative error resolution:** Document how 0-byte files from initial scaffolding caused runtime errors and how they were systematically identified and resolved
5. **Explain the auth flow:** Diagram the flow from login form → API call → JWT received → token stored → context updated → navigator re-renders → main app displayed
6. **Discuss the dual-server development setup:** Backend (uvicorn) and frontend (Expo) running simultaneously, with the `10.0.2.2` address mapping explained for the Android emulator
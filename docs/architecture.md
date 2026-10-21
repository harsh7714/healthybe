# HealthyBe architecture

This guide describes the current project layout and the normal path for a request or new feature. Keep the existing API paths, request and response shapes, Mongoose schemas, authentication behavior, and UI behavior stable when making structural changes.

## Backend

The backend uses CommonJS modules. The Express application is composed in backend/src/app.js; backend/src/server.js validates configuration, connects to MongoDB, and starts the listener.

- config/: database connection, environment defaults and validation, shared constants.
- models/: Mongoose schemas and model definitions, including users, profiles, reports, sessions, password resets, and chat sessions.
- routes/: resource routers and index.js, which mounts the routers.
- controllers/: HTTP adapter functions. They read request data, call a service, and send the response.
- services/: business logic and integrations for auth, profiles, reports, chat, Gemini, and email.
- services/storage/: one report-storage interface backed by S3 or local disk.
- middleware/: authentication, rate limits, uploads, validation, request logging, not-found handling, and central error handling.
- validators/: request validation rules grouped by resource.
- utils/: asyncHandler, AppError, logging, and shared helpers.
- app.js: Express middleware, health routes, API mounts, and error handling.
- server.js: startup and database connection.

### Backend request flow

Route mapping runs middleware and then the controller. The controller passes validated input to a service. The service applies business rules and uses models or integration services. The controller sends the existing HTTP response. Errors pass through asyncHandler and the central error middleware.

The versioned API is mounted at /api/v1. The older /api prefix remains mounted as an alias so existing clients continue to work. Report business logic calls services/storage/index.js; that adapter selects S3 or local storage, so report.service.js does not choose the implementation.

## Frontend

The frontend uses ES modules, React, and Vite. Imports can use the configured aliases such as @features, @components, @hooks, @services, @context, @constants, @layouts, @app, and @styles.

- app/: application shell, lazy route definitions, and protected-route behavior.
- context/: auth, profile, and theme providers, with their hooks and context objects.
- features/: auth, profiles, reports, chat, home, and settings pages, components, hooks, and endpoint services.
- components/: shared UI components.
- layouts/: application layout and navigation.
- hooks/: shared application hooks.
- services/api.js: shared fetch client, credentials, and API error handling.
- constants/: route paths, navigation items, and shared messages.
- styles/: global tokens, page styles, theme styles, and responsive styles.
- main.jsx: frontend entry point and global style imports.

A page should compose feature components. Feature hooks own state and data loading. Feature services contain endpoint calls and use the shared API client. Route paths and navigation entries belong in constants/.

### Frontend request flow

A route lazy-loads a page. The page composes components and a feature hook. The hook calls a feature service, which uses services/api.js to attach credentials, build the API URL, and handle response errors. In development, Vite proxies API requests to the backend.

## Add a backend feature

1. Add or extend a validator in validators/ for incoming data.
2. Add a Mongoose model only when the feature needs persistence. Keep schema definitions in models/.
3. Put the feature's business rules and model access in a service.
4. Add a thin controller that reads req, calls the service, and sends the established response. Use asyncHandler and AppError for consistent errors.
5. Add a router that maps the URL, middleware, and controller. Register it in routes/index.js.
6. Keep the public URL under /api/v1. The existing app mount also exposes the /api compatibility alias.
7. If the feature needs an external integration, keep that integration in a service. For report files, use the storage adapter rather than accessing S3 or local disk from the report service.

## Add a frontend feature

1. Create frontend/src/features/<feature>/ with pages/, components/, hooks/, and services/ as needed.
2. Put endpoint functions in services/ and call them through @services/api. Keep UI state and data loading in a feature hook.
3. Build small components and let the page compose them.
4. Add new page paths to constants/routes.js, then lazy-load and register the page in app/routes.jsx.
5. If the feature appears in navigation, add its item to constants/navigation.js and use the shared layouts.
6. Import shared code through the Vite aliases and put reusable UI in components/ or layouts/.

## Local quality checks

From backend/, use npm run lint and npm run format:check. From frontend/, use npm run lint, npm run format:check, and npm run build. Keep source files focused and around 200 lines or fewer.

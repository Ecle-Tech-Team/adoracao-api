# AdoraçãoApp

## Stack

Mobile:
- React Native
- Expo Router
- JavaScript
- AsyncStorage

Backend:
- Node.js
- Express
- MySQL
- JWT authentication

Web projection:
- Next.js
- Tailwind CSS

## Architecture

The mobile application communicates with the Express API.

The Next.js application is a separate projection client and must not
contain backend business logic.

## Coding rules

- Follow the existing project architecture before introducing new patterns.
- Prefer modifying existing services/controllers over creating duplicate abstractions.
- Do not rewrite working modules unnecessarily.
- Preserve API compatibility with the mobile application.
- Validate database migrations before applying destructive changes.
- Never expose secrets or credentials.

## Workflow

Before significant implementation:

1. Inspect the relevant code.
2. Understand existing architecture.
3. Identify affected modules.
4. Propose the implementation approach.
5. Implement the smallest coherent change.
6. Run relevant tests/lint/build.
7. Review the resulting diff.

For architectural changes, do not implement until the plan is clear.
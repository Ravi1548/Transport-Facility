# Testing

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.16.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Code coverage

Run `ng test --code-coverage` or `npm run test:coverage` to execute the unit tests and generate code coverage reports. The coverage reports will be stored in the `coverage/` directory.

## Test Scripts

- `npm run test` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode (no watch, headless browser)
- `npm run test:watch` - Run tests in watch mode (explicit)
- `npm run coverage:open` - Open coverage report in browser

## Test Structure

All test files follow the naming convention `*.spec.ts` and are located alongside their corresponding source files.

### Component Tests
- Test component initialization
- Test component methods
- Test component interactions
- Test component templates

### Service Tests
- Test service methods
- Test HTTP calls
- Test data transformations
- Test error handling

### Guard Tests
- Test route protection
- Test authentication logic
- Test redirection behavior

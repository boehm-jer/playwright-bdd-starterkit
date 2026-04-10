# Playwright BDD Starter Kit

A starter kit for using behavior driven development and Playwright for end-to-end testing.

---

## Install and run

- `npm install` - install
- `npm run test` - run all Playwright tests in terminal
- `npm run report` - show html report on run tests
- `npm run ui` - open Playwright interactive ui

## Feature tags
- `npm run tag-test` - This will start a prompt for the tag then run only those Playwright tests.
- `npm run only` - Run all Playwright tests with the @only tag. 



<!-- 
Things from the cypress starter kit to aim for implementing later...

## Accessibility Testing (AXE Core Plugin):
To run accessibility tests on a page utilize the `AccessibilityHelpers` class.
```typescript
// Example:
AccessibilityHelpers.ActivateAxeCoreChecker('serious')
```

## Reading PDF Files:
This starter-kit includes an additional library that enhances cypress to allow reading pdf files.
To assert the content of pdf files, utilize the `PdfValidationHelpers` class.

```typescript
// Example:
PdfValidationHelper.ValidateDownloadedPdf('PDF_metadata.pdf','contain',['Testing', 'PDF', 'metadata'])
``` -->


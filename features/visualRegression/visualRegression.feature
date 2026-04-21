@visualRegression
Feature: Visual regression
  Playwright captures a full-page screenshot and compares it to a stored baseline.
  On first run, the baseline is created automatically. Subsequent runs fail if the
  page has changed beyond the configured pixel-difference tolerance.

  Scenario: Example.com homepage matches baseline
    Given I navigate to the example.com homepage
    When I capture a full-page screenshot named "example-homepage"
    Then the screenshot should match the visual baseline

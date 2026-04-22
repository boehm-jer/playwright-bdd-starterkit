@submit
Feature: Form submission
  Submit a basic form using the cypress kitchen sink page.

  Scenario: Successful form submission
    Given I am on the submission page
    When I enter the coupon code "cheese"
    Then the page should confirm a successful form submission
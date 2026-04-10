Feature: Form submission
  Submit a basic form using the cypress kitchen sink page.

  @submit
  Scenario: Successful form submission
    Given I am on the submission page
    When I enter my valid text "cheese"
    Then the page should confirm a successful form submission
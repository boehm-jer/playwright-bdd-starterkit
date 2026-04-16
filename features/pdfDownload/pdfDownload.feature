@only
Feature: Download a pdf file
  Downloaded pdf should match expectations

  @pdfDownload
  Scenario: Download has expected content
    Given I am visiting the website
    When I download the pdf file
    Then the pdf should have the expected content


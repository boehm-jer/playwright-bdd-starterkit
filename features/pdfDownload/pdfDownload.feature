@skip
Feature: Download a pdf file
  Downloaded pdf should match expectations

  @pdfDownload
  Scenario: Webpage is accessible
    Given I am visiting the website
    When I download the pdf file
    Then the pdf should have the expected content


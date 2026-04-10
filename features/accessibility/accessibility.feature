@accessibility @only
Feature: Accessibility
  Webpage should be free of accessibility violations.

  Scenario Outline: Webpage is accessible
    Given I am visiting "<webpage>"
    Then "<impact>" accessibility checks should pass
    Examples:
      |webpage                                | impact |
      |w3.org/WAI/standards-guidelines/wcag/  | serious   |
      |deque.com/axe/axe-core/                | critical  |


  Scenario Outline: An intentionally inaccessible site is not accessible
    Given I am visiting "<webpage>"
    Then "<impact>" accessibility checks should fail
    Examples:
      |webpage                                | impact   |
      |fakewinebarrel.com/                    | serious  |
      |dequeuniversity.com/demo/mars/         | critical |

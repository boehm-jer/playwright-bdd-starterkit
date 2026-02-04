@accessibility
Feature: Accessibility
  Webpage should be free of accessibility violations.

  Scenario Outline: Webpage is accessible
    Given I am visiting "<webpage>"
    Then "<benchmark>" accessibility checks should pass
    Examples:
      |webpage                                | benchmark |
      |w3.org/WAI/standards-guidelines/wcag/  | wcag2a    |
      |deque.com/axe/axe-core/                | wcag21a   |

  Scenario Outline: An intentionally inaccessible site is not accessible
    Given I am visiting "<webpage>"
    Then "<benchmark>" accessibility checks should fail
    Examples:
      |webpage                                | benchmark |
      |fakewinebarrel.com/                    | wcag21aa   |
      |dequeuniversity.com/demo/mars/         | wcag21a   |

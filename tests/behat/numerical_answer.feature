@editor @tiny @editor_tiny @tiny_html @tiny_cloze @javascript
Feature: Test the cloze question editor with numberic answers.

  Background:
    Given the following "users" exist:
      | username | firstname | lastname | email               |
      | teacher  | Mark      | Allright | teacher@example.com |
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course 1 | C1        | 0        |
    And the following "course enrolments" exist:
      | user    | course | role           |
      | teacher | C1     | editingteacher |
    Given the following "user preferences" exist:
      | user    | preference | value |
      | teacher | htmleditor | tiny  |

  Scenario: Create a NUMERICAL question with one correct and an incorrect answer
    When I am on the "Course 1" "core_question > course question bank" page logged in as teacher
    And I press "Create a new question ..."
    And I set the field "Embedded answers (Cloze)" to "1"
    And I click on "Add" "button" in the "Choose a question type to add" "dialogue"
    And I set the field "Question name" to "multianswer-001"
    And I click on "Cloze question editor" "button"
    And I set the field "NUMERICAL" to "1"
    And I click on "Select question type" "button"
    And I set the field with xpath "//form[@name='tiny_cloze_form']//li[1]//input[contains(@class, 'tiny_cloze_answer')]" to "4"
    And I set the field with xpath "//form[@name='tiny_cloze_form']//li[1]//input[contains(@class, 'tiny_cloze_feedback')]" to "That is correct"
    When I click on "Insert question" "button"
    #From 4.3 onwards this works:
    #And I click on the "View > Source code" menu item for the "Question text" TinyMCE editor
    #Then I should see "<p>{1:NUMERICAL:=4:0#That is correct}</p>" source code for the "Question text" TinyMCE editor
    And I click on "Save changes and continue editing" "button"
    Then the field "Question text" matches multiline:
    """
    <p><span class="cloze-question-marker" contenteditable="false">{1:NUMERICAL:=4:0#That is correct}</span></p>
    """
    When I select the "span" element in position "0" of the "Question text" TinyMCE editor
    And I click on "Cloze question editor" "button"
    Then I should see "Numerical (NUMERICAL)"
    When I click on "//form[@name='tiny_cloze_form']//li[1]//a[contains(@class, 'tiny_cloze_add')]" "xpath"
    And I set the field with xpath "//form[@name='tiny_cloze_form']//li[2]//input[contains(@class, 'tiny_cloze_answer')]" to "*"
    And I set the field with xpath "//form[@name='tiny_cloze_form']//li[2]//input[contains(@class, 'tiny_cloze_feedback')]" to "Try again"
    And I set the field with xpath "//form[@name='tiny_cloze_form']//li[2]//select[contains(@class, 'tiny_cloze_fraction')]" to "Incorrect"
    And I click on "Insert question" "button"
    #And I click on the "View > Source code" menu item for the "Question text" TinyMCE editor
    #Then I should see "<p>{1:NUMERICAL:1:NUMERICAL:=4:0#That is correct~*#Try again}</p>" source code for the "Question text" TinyMCE editor
    And I click on "Save changes and continue editing" "button"
    Then the field "Question text" matches multiline:
    """
    <p><span class="cloze-question-marker" contenteditable="false">{1:NUMERICAL:=4:0#That is correct~*#Try again}</span></p>
    """

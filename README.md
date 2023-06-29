Moodle Tiny editor Cloze question type button
=============================================

[![Moodle Plugin 
CI](https://github.com/srobotta/moodle-tiny_cloze/workflows/Moodle%20Plugin%20CI/badge.svg?branch=main)](https://github.com/srobotta/moodle-tiny_cloze/actions?query=workflow%3A%22Moodle+Plugin+CI%22+branch%3Amain)
![Supported](https://img.shields.io/badge/Moodle-4.1+-orange.svg)
[![License GPL-3.0](https://img.shields.io/github/license/srobotta/moodle-tiny_cloze?color=lightgrey)](https://github.com/srobotta/moodle-tiny_cloze/blob/main/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/srobotta/moodle-tiny_cloze)](https://github.com/srobotta/moodle-tiny_cloze/graphs/contributors)


A plugin for the Moodle Tiny editor to allow easier creation of Cloze questions
see https://docs.moodle.org/en/Embedded_Answers_(Cloze)_question_type. Inspired by the Atto Cloze editor https://docs.moodle.org/en/Cloze_editor_for_Atto.

This is an editor plugin to provide an interface for creating and
modifying embedded answer (Cloze) questions. To install, add to the TinyMCE
editor plugins directory and visit notifications to update database. This
directory must be named 'cloze' in lib/editor/tiny/plugins.

The button should appear in the editor only while editing embedded answer (Cloze) questions.
When you position the cursor in the editor at the desired place and click on the button inside the editor toolbar, a popup window will let you choose any of the available question types.
Selecting any question type, you will see a plain language description of what that question type does.
Finally clicking "Insert question" adds the resulting Cloze question syntax into the question text at the cursor position.

This requires Moodle 4.1 or later as that shipped with a new version of the Tiny editor and the Atto editor is due to be phased out in a future version of Moodle.

Created collaboratively at MoodleMootDACH 23 Zurich.

## Installation

 - Copy repository content in *moodleroot*/lib/editor/tiny/plugins. The following can be omitted:
   - tests/ (if you're not going to test it with Behat)
   - .gitmodules
   - build.xml
 - Install the plugin from Moodle. 


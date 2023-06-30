Moodle Tiny editor Cloze question type button
=============================================

[![Moodle Plugin 
CI](https://github.com/srobotta/moodle-tiny_cloze/workflows/Moodle%20Plugin%20CI/badge.svg?branch=main)](https://github.com/srobotta/moodle-tiny_cloze/actions?query=workflow%3A%22Moodle+Plugin+CI%22+branch%3Amain)
![Supported](https://img.shields.io/badge/Moodle-4.1+-orange.svg)
[![License GPL-3.0](https://img.shields.io/github/license/srobotta/moodle-tiny_cloze?color=lightgrey)](https://github.com/srobotta/moodle-tiny_cloze/blob/main/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/srobotta/moodle-tiny_cloze)](https://github.com/srobotta/moodle-tiny_cloze/graphs/contributors)


A plugin for the Moodle Tiny editor to callow easier creation of Cloze questions
see https://docs.moodle.org/402/en/Embedded_Answers_(Cloze)_question_type. Inspired by the Atto Cloze editor. https://docs.moodle.org/402/en/Atto_editor.

This is an editor plugin to provide an interface for creating and
modifying embedded answer (cloze) questions. To install, add to the TinyMCE
editor plugins directory and visit notifications to update database. This
directory must be named 'cloze' in lib/editor/tiny/plugins.

The button should appear in the editor only while editing questions. Click
the button while editing a question, select the question type and a form
will appear form entering answers. Finally insert into the question text.

This requires Moodle 4.1 or later as that shipped with a new version of the tiny editor and the Atto editor is due to be phased out in a future version of Moodle

Created collaboratively at MoodleMootDACH 23 Zurich.

## Installation

 - Copy repository content in *moodleroot*/lib/editor/tiny/plugins. The following can be omitted:
   - tests/ (if you're not going to test it with Behat)
   - .gitmodules
   - build.xml
 - Install the plugin from Moodle. 


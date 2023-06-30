// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Commands helper for the Moodle tiny_cloze plugin.
 *
 * @module      tiny_cloze/commands
 * @copyright   2023 MoodleDACH
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getButtonImage} from 'editor_tiny/utils';
import {get_string as getString} from 'core/str';
import {
    component,
    clozeeditButtonName,
    icon,
} from './common';
import {displayDialogue, resolveSubquestion, onInit, onProcess, onBlur} from './ui';

/**
 * Get the setup function for the buttons.
 *
 * This is performed in an async function which ultimately returns the registration function as the
 * Tiny.AddOnManager.Add() function does not support async functions.
 *
 * @returns {function} The registration function to call within the Plugin.add function.
 */
export const getSetup = async() => {
    const [
        clozeButtonText,
        buttonImage,
    ] = await Promise.all([
        getString('pluginname', component),
        getButtonImage('icon', component),
    ]);

    return (editor) => {
        // Check whether we are editing a question.
        const body = document.querySelector('body#page-question-type-multianswer form, ' +
          'body#page-question-type-multianswerwiris form');
        // And if the editor is used on the question text.
        if (!body || editor.id.indexOf('questiontext') === -1) {
            return;
        }
        // Only if both conditions are valid, then continue setting up the plugin.

        // Register the Moodle SVG as an icon suitable for use as a TinyMCE toolbar button.
        editor.ui.registry.addIcon(icon, buttonImage.html);

        // Register the clozeedit Toolbar Button.
        editor.ui.registry.addToggleButton(clozeeditButtonName, {
            icon,
            tooltip: clozeButtonText,
            onAction: () => displayDialogue(editor),
            onSetup: (api) => {
                editor.on('click', () => {
                     api.setActive(resolveSubquestion() !== false);
                });
              }
        });

        // Register the menu item.
        editor.ui.registry.addMenuItem(clozeeditButtonName, {
            icon,
            text: clozeButtonText,
            onAction: () => displayDialogue(editor),
        });

        editor.on('init', () => onInit(editor));
        editor.on('PreProcess', format => onProcess(format, 'PreProcess'));
        editor.on('PostProcess', format => onProcess(format, 'PostProcess'));
        editor.on('blur', () => onBlur());
    };
};

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
 * @module      tiny_cloze
 * @copyright   2023 MoodleDACH
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getLanguageList, showAllLanguages} from './options';
import {component} from './common';
import {get_strings as getStrings} from 'core/str';

/**
 * Get the setup function for the button and the menu entry.
 *
 * This is performed in an async function which ultimately returns the registration function as the
 * Tiny.AddOnManager.Add() function does not support async functions.
 *
 * @returns {function} The registration function to call within the Plugin.add function.
 */
export const getSetup = async() => {
    const [
        buttonText,
        tooltip,
    ] = await getStrings(['multilang2:language', 'multilang2:desc'].map((key) => ({key, component})));

    return (editor) => {

        const languageList = getLanguageList(editor);
        // If there is just one language, we don't need the plugin.
        if (languageList.length < 2) {
            return;
        }

        editor.ui.registry.addToggleButton(component, {
            icon: 'language',
            tooltip: tooltip,
        });

        editor.on('init', () => {
            onInit(editor);
        });
    };
};

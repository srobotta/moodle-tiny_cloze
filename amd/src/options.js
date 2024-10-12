// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Options helper for tiny_cloze plugin.
 *
 * @module      tiny_cloze
 * @copyright   2024 Stephan Robotta <stephan.robotta@bfh.ch>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getPluginOptionName} from 'editor_tiny/options';
import {pluginName} from './common';

const multianswerrgx = getPluginOptionName(pluginName, 'multianswerrgx');

/**
 * Register the options for the Tiny Cloze question plugin.
 *
 * @param {tinymce.Editor} editor
 */
export const register = (editor) => {
    editor.options.register(multianswerrgx, {
        processor: 'boolean',
        "default": false,
    });
};

export const hasQtypeMultianswerrgx = (editor) => editor.options.get(multianswerrgx);
export const disableQtypeMultianswerrgx = (editor) => editor.options.set(multianswerrgx, false);
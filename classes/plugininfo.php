<?php
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
 * Tiny Cloze Editor plugin for Moodle.
 *
 * @package     tiny_cloze
 * @copyright   2023 MoodleDACH
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace tiny_cloze;

use context;
use editor_tiny\editor;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_configuration;
use editor_tiny\plugin_with_menuitems;

class plugininfo extends plugin implements plugin_with_buttons, plugin_with_menuitems, plugin_with_configuration {

    /**
     * @return string[]
     */
    public static function get_available_buttons(): array {
        return [
            'tiny_cloze',
        ];
    }

    /**
     * @return string[]
     */
    public static function get_available_menuitems(): array {
        return [
            'tiny_cloze',
        ];
    }

    /**
     * Returns the configuration values the plugin needs to take into consideration
     *
     * @param context $context
     * @param array $options
     * @param array $fpoptions
     * @param editor|null $editor
     * @return array
     * @throws \dml_exception
     */
    public static function get_plugin_configuration_for_context(context $context, array $options, array $fpoptions,
            ?editor $editor = null): array {

        $config = [];

        $singleno = ['option' => get_string('answersingleno', 'qtype_multichoice')];
        $singleyes = ['option' => get_string('answersingleyes', 'qtype_multichoice')];
        $selectinline = ['option' => get_string('layoutselectinline', 'qtype_multianswer')];
        $horizontal = ['option' => get_string('layouthorizontal', 'qtype_multianswer')];
        $vertical = ['option' => get_string('layoutvertical', 'qtype_multianswer')];
        $shuffle = ['option' => get_string('shufflewithin', 'mod_quiz')];
        $multihorizontal = ['option' => get_string('layoutmultiple_horizontal', 'qtype_multianswer')];
        $multivertical = ['option' => get_string('layoutmultiple_vertical', 'qtype_multianswer')];

        $config['qtypes'] = [
                [
                        'type' => 'MULTICHOICE',
                        'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$selectinline, $singleyes]
                ],
                [
                        'type' => 'MULTICHOICE_H',
                        'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$horizontal, $singleyes]
                ],
                [
                        'type' => 'MULTICHOICE_V',
                        'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$vertical, $singleyes]
                ],
                [
                        'type' => 'MULTICHOICE_S', 'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$selectinline, $shuffle, $singleyes]
                ],
                [
                        'type' => 'MULTICHOICE_HS', 'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$horizontal, $shuffle, $singleyes]
                ],
                [
                        'type' => 'MULTICHOICE_VS', 'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$vertical, $shuffle, $singleyes]
                ],
                [
                        'type' => 'MULTIRESPONSE', 'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$multivertical, $singleno]
                ],
                [
                        'type' => 'MULTIRESPONSE_H', 'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$multihorizontal, $singleno]
                ],
                [
                        'type' => 'MULTIRESPONSE_S', 'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$multivertical, $shuffle, $singleno]
                ],
                [
                        'type' => 'MULTIRESPONSE_HS', 'name' => get_string('multichoice', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                        'options' => [$multihorizontal, $shuffle, $singleno]
                ],
                [
                        'type' => 'NUMERICAL', 'name' => get_string('numerical', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_numerical')
                ],
                [
                        'type' => 'SHORTANSWER', 'name' => get_string('shortanswer', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_shortanswer'),
                        'options' => ['option' => get_string('caseno', 'mod_quiz')]
                ],
                [
                        'type' => 'SHORTANSWER_C', 'name' => get_string('shortanswer', 'mod_quiz'),
                        'summary' => get_string('pluginnamesummary', 'qtype_shortanswer'),
                        'options' => ['option' => get_string('caseyes', 'mod_quiz')]
                ],
        ];

        return $config;
    }
}

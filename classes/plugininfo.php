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
use editor_tiny\plugin_with_menuitems;

class plugininfo extends plugin implements plugin_with_buttons, plugin_with_menuitems {

    public static function get_available_buttons(): array {
        return [
            'tiny_cloze/plugin',
        ];
    }

    public static function get_available_menuitems(): array {
        return [
            'tiny_cloze/plugin',
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
        $shuffle = array('option' => get_string('shufflewithin', 'mod_quiz'));
        $multihorizontal = array('option' => get_string('layoutmultiple_horizontal', 'qtype_multianswer'));
        $multivertical = array('option' => get_string('layoutmultiple_vertical', 'qtype_multianswer'));

        $config['qtypes'] = [
            [
                'type' => 'MULTICHOICE',
                'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($selectinline, $singleyes)
            ],
            [
                'type' => 'MULTICHOICE_H',
                'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($horizontal, $singleyes)
            ],
            [
                'type' => 'MULTICHOICE_V',
                'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($vertical, $singleyes)
            ],
            array('type' => 'MULTICHOICE_S', 'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($selectinline, $shuffle, $singleyes)
            ),
            array('type' => 'MULTICHOICE_HS', 'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($horizontal, $shuffle, $singleyes)
            ),
            array('type' => 'MULTICHOICE_VS', 'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($vertical, $shuffle, $singleyes)
            ),
            array('type' => 'MULTIRESPONSE', 'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($multivertical, $singleno)
            ),
            array('type' => 'MULTIRESPONSE_H', 'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($multihorizontal, $singleno)
            ),
            array('type' => 'MULTIRESPONSE_S', 'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($multivertical, $shuffle, $singleno)
            ),
            array('type' => 'MULTIRESPONSE_HS', 'name' => get_string('multichoice', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_multichoice'),
                'options' => array($multihorizontal, $shuffle, $singleno)
            ),
            array('type' => 'NUMERICAL', 'name' => get_string('numerical', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_numerical')),
            array('type' => 'SHORTANSWER', 'name' => get_string('shortanswer', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_shortanswer'),
                'options' => array('option' => get_string('caseno', 'mod_quiz'))),
            array('type' => 'SHORTANSWER_C', 'name' => get_string('shortanswer', 'mod_quiz'),
                'summary' => get_string('pluginnamesummary', 'qtype_shortanswer'),
                'options' => array('option' => get_string('caseyes', 'mod_quiz'))),
        ];

        return $config;
    }
}

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
 * Plugin tiny_cloze for TinyMCE v6 in Moodle.
 *
 * @module      tiny_cloze/ui
 * @copyright   2023 MoodleDACH
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import ModalEvents from 'core/modal_events';
import ModalFactory from 'core/modal_factory';
import Modal from "core/modal";
import Mustache from 'core/mustache';
import {get_string} from 'core/str';
import {component} from './common';

// Helper functions.
//const trim = v => v.toString().replace(/^\s+/, '').replace(/\s+$/, '');
const isNull = a => a === null || a === undefined;
const strdecode = t => String(t).replace(/\\(#|\}|~)/g, '$1');
const strencode = t => String(t).replace(/(#|\}|~)/g, '\\$1');
const indexOfNode = (list, node) => {
  for (let i = 0; i < list.length; i++) {
    if (list[i] === node) {
      return i;
    }
  }
  return -1;
};
const getFractionOptions = s => {
  let html = '<option value="">' + STR.incorrect + '</option><option value="="';
  if (s === '=') {
    html += ' selected="selected"';
  }
  html += '>' + STR.correct + '</option>';
  FRACTIONS.map((item) => {
    html += '<option value="' + item.value + '"';
    if (item.value.toString() === s) {
      html += ' selected="selected"';
    }
    html += '>' + item.value + '%</option>';
  });
  return html;
};

// Marker class and the whole span element that is used to encapsulate the cloze question text.
const markerClass = 'cloze-question-marker';
const markerSpan = '<span contenteditable="false" class="' + markerClass + '" data-mce-contenteditable="false">';
const markerNewPos = '{cloze_question_new_marker}';
// Regex to recognize the question string in the text e.g. {1:NUMERICAL:...} or {:MULTICHOICE:...}
// eslint-disable-next-line max-len
const reQtype = /\{([0-9]*):(MULTICHOICE(_H|_V|_S|_HS|_VS)?|MULTIRESPONSE(_H|_S|_HS)?|NUMERICAL|SHORTANSWER(_C)?|SAC?|NM|MWC?|MC(V|H|VS|HS)?|MR(V|H|VS|HS)?):(.*?)\}/g;

// CSS classes that are used in the modal dialogue.
const CSS = {
  ANSWER: 'tiny_cloze_answer',
  ANSWERS: 'tiny_cloze_answers',
  ADD: 'tiny_cloze_add',
  CANCEL: 'tiny_cloze_cancel',
  DELETE: 'tiny_cloze_delete',
  FEEDBACK: 'tiny_cloze_feedback',
  FRACTION: 'tiny_cloze_fraction',
  LEFT: 'tiny_cloze_col0',
  LOWER: 'tiny_cloze_down',
  RIGHT: 'tiny_cloze_col1',
  MARKS: 'tiny_cloze_marks',
  DUPLICATE: 'tiny_cloze_duplicate',
  RAISE: 'tiny_cloze_up',
  SUBMIT: 'tiny_cloze_submit',
  SUMMARY: 'tiny_cloze_summary',
  TOLERANCE: 'tiny_cloze_tolerance',
  TYPE: 'tiny_cloze_qtype'
};
const TEMPLATE = {
    FORM: '<div class="tiny_cloze">' +
      '<p>{{name}} ({{qtype}})</p>' +
      '<form name="tiny_cloze_form">' +
      '<div class="row ml-0">' +
      '<div class="form-group">' +
      '<label for="{{elementid}}_mark">{{STR.defaultmark}}</label>' +
      '<input id="{{elementid}}_mark" type="text" value="{{marks}}" ' +
      'class="{{CSS.MARKS}} form-control d-inline mx-1" />' +
      '<a class="{{CSS.ADD}}" title="{{STR.addmoreanswerblanks}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/add', 'core') + '"></a>' +
      '</div>' +
      '</div>' +
      '<div class="{{CSS.ANSWERS}} mb-3">' +
      '<ol class="pl-3">{{#answerdata}}' +
      '<li class="mt-3"><div class="row ml-0">' +
      '<div class="{{CSS.LEFT}} form-group">' +
      '<label for="{{id}}_answer">{{STR.answer}}</label>' +
      '<input id="{{id}}_answer" type="text" value="{{answer}}" ' +
      'class="{{CSS.ANSWER}} form-control d-inline mx-2" />' +
      '</div>' +
      '<div class="{{CSS.LEFT}} form-group">' +
      '<a class="{{CSS.ADD}}" title="{{STR.addmoreanswerblanks}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/add', 'core') + '"></a>' +
      '<a class="{{CSS.DELETE}}" title="{{STR.delete}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/delete', 'core') + '"></a>' +
      '<a class="{{CSS.RAISE}}" title="{{STR.up}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/up', 'core') + '"></a>' +
      '<a class="{{CSS.LOWER}}" title="{{STR.down}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/down', 'core') + '"></a>' +
      '</div>' +
      '</div>' +
      '{{#numerical}}' +
      '<div class="row">' +
      '<div class="{{CSS.RIGHT}} form-group">' +
      '<label for="{{id}}_tolerance">{{{STR.tolerance}}}</label>' +
      '<input id="{{id}}_tolerance" type="text" value="{{tolerance}}" ' +
      'class="{{CSS.TOLERANCE}} form-control d-inline mx-2" />' +
      '</div>' +
      '</div>' +
      '{{/numerical}}' +
      '<div class="row">' +
      '<div class="{{CSS.RIGHT}} form-group">' +
      '<label for="{{id}}_feedback">{{STR.feedback}}</label>' +
      '<input id="{{id}}_feedback" type="text" value="{{feedback}}" ' +
      'class="{{CSS.FEEDBACK}} form-control d-inline mx-2" />' +
      '</div>' +
      '<div class="{{CSS.RIGHT}} form-group">' +
      '<label id="{{id}}_grade">{{STR.grade}}</label>' +
      '<select id="{{id}}_grade" class="{{CSS.FRACTION}} custom-select mx-2">' +
      '{{{fractionOptions}}}' +
      '</select>' +
      '</div>' +
      '</div></li>' +
      '{{/answerdata}}</ol></div>' +
      '</form>' +
      '</div>',
    TYPE: '<div class="tiny_cloze mt-0 mx-2 mb-2">' +
      '<p>{{STR.chooseqtypetoadd}}</p>' +
      '<form name="tiny_cloze_form">' +
      '<div class="{{CSS.TYPE}} form-check">' +
      '{{#types}}' +
      '<div class="option">' +
      '<input name="qtype" id="qtype_qtype_{{type}}" value="{{type}}" type="radio" class="form-check-input">' +
      '<label for="qtype_qtype_{{type}}">' +
      '<span class="typename">{{type}}</span>' +
      '<span class="{{CSS.SUMMARY}}"><h6>{{name}}</h6><p>{{summary}}</p>' +
      '<ul>{{#options}}' +
      '<li>{{.}}</li>' +
      '{{/options}}</ul>' +
      '</span>' +
      '</label></div>' +
      '{{/types}}</div>' +
      '</form></div>',
    FOOTER: '<button type="button" class="btn btn-secondary" data-action="cancel">{{cancel}}</button>' +
      '<button type="button" class="btn btn-primary" data-action="save">{{submit}}</button>',
  };
  const FRACTIONS = [
    {value: 100},
    {value: 50},
    {value: 33.33333},
    {value: 25},
    {value: 20},
    {value: 16.66667},
    {value: 14.28571},
    {value: 12.5},
    {value: 11.11111},
    {value: 10},
    {value: 5},
    {value: 0},
    {value: -5},
    {value: -10},
    {value: -11.11111},
    {value: -12.5},
    {value: -14.28571},
    {value: -16.66667},
    {value: -20},
    {value: -25},
    {value: -33.333},
    {value: -50},
    {value: -100},
  ];

// Language strings used in the modal dialogue.
let STR = {};
const getStr = async() => {
  const res = await Promise.all([
    get_string('answer', 'question'),
    get_string('chooseqtypetoadd', 'question'),
    get_string('defaultmark', 'question'),
    get_string('feedback', 'question'),
    get_string('correct', 'question'),
    get_string('incorrect', 'question'),
    get_string('addmoreanswerblanks', 'qtype_calculated'),
    get_string('delete', 'core'),
    get_string('up', 'core'),
    get_string('down', 'core'),
    get_string('tolerance', 'qtype_calculated'),
    get_string('grade', 'grades'),
    get_string('caseno', 'mod_quiz'),
    get_string('caseyes', 'mod_quiz'),
    get_string('answersingleno', 'qtype_multichoice'),
    get_string('answersingleyes', 'qtype_multichoice'),
    get_string('layoutselectinline', 'qtype_multianswer'),
    get_string('layouthorizontal', 'qtype_multianswer'),
    get_string('layoutvertical', 'qtype_multianswer'),
    get_string('shufflewithin', 'mod_quiz'),
    get_string('layoutmultiple_horizontal', 'qtype_multianswer'),
    get_string('layoutmultiple_vertical', 'qtype_multianswer'),
    get_string('pluginnamesummary', 'qtype_multichoice'),
    get_string('pluginnamesummary', 'qtype_shortanswer'),
    get_string('pluginnamesummary', 'qtype_numerical'),
    get_string('multichoice', component),
    get_string('multiresponse', component),
    get_string('numerical', 'mod_quiz'),
    get_string('shortanswer', 'mod_quiz'),
    get_string('cancel', 'core'),
    get_string('select', component),
    get_string('insert', component),
    get_string('pluginname', component),
  ]);
  [
    'answer',
    'chooseqtypetoadd',
    'defaultmark',
    'feedback',
    'correct',
    'incorrect',
    'addmoreanswerblanks',
    'delete',
    'up',
    'down',
    'tolerance',
    'grade',
    'caseno',
    'caseyes',
    'singleno',
    'singleyes',
    'selectinline',
    'horizontal',
    'vertical',
    'shuffle',
    'multi_horizontal',
    'multi_vertical',
    'summary_multichoice',
    'summary_shortanswer',
    'summary_numerical',
    'multichoice',
    'multiresponse',
    'numerical',
    'shortanswer',
    'btn_cancel',
    'btn_select',
    'btn_insert',
    'title',
  ].map((l, i) => {
    STR[l] = res[i];
  });
};
const getQuestionTypes = function() {
  return [
    {
      'type': 'MULTICHOICE',
      'abbr': ['MC'],
      'name': STR.multichoice,
      'summary': STR.summary_multichoice,
      'options': [STR.selectinline, STR.singleyes],
    },
    {
      'type': 'MULTICHOICE_H',
      'abbr': ['MCH'],
      'name': STR.multichoice,
      'summary': STR.summary_multichoice,
      'options': [STR.horizontal, STR.singleyes],
    },
    {
      'type': 'MULTICHOICE_V',
      'abbr': ['MCV'],
      'name': STR.multichoice,
      'summary': STR.summary_multichoice,
      'options': [STR.vertical, STR.singleyes],
    },
    {
      'type': 'MULTICHOICE_S',
      'abbr': ['MCS'],
      'name': STR.multichoice,
      'summary': STR.summary_multichoice,
      'options': [STR.selectinline, STR.shuffle, STR.singleyes],
    },
    {
      'type': 'MULTICHOICE_HS',
      'abbr': ['MCHS'],
      'name': STR.multichoice,
      'summary': STR.summary_multichoice,
      'options': [STR.horizontal, STR.shuffle, STR.singleyes],
    },
    {
      'type': 'MULTICHOICE_VS',
      'abbr': ['MCVS'],
      'name': STR.multichoice,
      'summary': STR.summary_multichoice,
      'options': [STR.vertical, STR.shuffle, STR.singleyes],
    },
    {
      'type': 'MULTIRESPONSE',
      'abbr': ['MR'],
      'name': STR.multiresponse,
      'summary': STR.summary_multichoice,
      'options': [STR.multi_vertical, STR.singleno],
    },
    {
      'type': 'MULTIRESPONSE_H',
      'abbr': ['MRH'],
      'name': STR.multiresponse,
      'summary': STR.summary_multichoice,
      'options': [STR.multi_horizontal, STR.singleno],
    },
    {
      'type': 'MULTIRESPONSE_S',
      'abbr': ['MRS'],
      'name': STR.multiresponse,
      'summary': STR.summary_multichoice,
      'options': [STR.multi_vertical, STR.shuffle, STR.singleno],
    },
    {
      'type': 'MULTIRESPONSE_HS',
      'abbr': ['MRHS'],
      'name': STR.multiresponse,
      'summary': STR.summary_multichoice,
      'options': [STR.multi_horizontal, STR.shuffle, STR.singleno],
    },
    {
      'type': 'NUMERICAL',
      'abbr': ['NM'],
      'name': STR.numerical,
      'summary': STR.summary_numerical,
    },
    {
      'type': 'SHORTANSWER',
      'abbr': ['SA', 'MW'],
      'name': STR.shortanswer,
      'summary': STR.summary_shortanswer,
      'options': [STR.caseno],
    },
    {
      'type': 'SHORTANSWER_C',
      'abbr': ['SAC', 'MWC'],
      'name': STR.shortanswer,
      'summary': STR.summary_shortanswer,
      'options': [STR.caseyes],
    },
  ];
};

/**
 * The editor instance that is injected via the onInit() function.
 *
 * @type tinymce.Editor
 * @private
 */
let _editor = null;

/**
 * Remember the blur event to reapply the marker <span>s because they get lost in the first place.
 * @type {boolean}
 * @private
 */
let _isBlurred = false;

/**
 * A reference to the currently open form.
 *
 * @param _form
 * @type Node
 * @private
 */
let _form = null;

/**
 * An array containing the current answers options
 *
 * @param _answerdata
 * @type Array
 * @private
 */
let _answerdata = [];

/**
 * The sub question type to be edited
 *
 * @param _qtype
 * @type String
 * @private
 */
let _qtype = null;

/**
 * Remember the pos of the selected node.
 * @type {number}
 * @private
 */
let _selectedOffset = -1;

/**
 * The maximum marks for the sub question
 *
 * @param _marks
 * @type Integer
 * @private
 */
let _marks = 1;

/**
 * The modal dialogue to be displayed when designing the cloze question types.
 * @type {null}
 */
let _modal = null;

/**
 * Inject the editor instance and add markers to the cloze question texts.
 * @param {tinymce.Editor} ed
 */
const onInit = function(ed) {
  _editor = ed;
  ed.dom.addStyle('.' + markerClass + '.new { display:none;}');
  _addMakers();
  getStr();
};

/**
 * Create the modal.
 * @return {Promise<void>}
 * @private
 */
const _createModal = async function() {
  // Create the modal dialogue. Depending on whether we have a selected node or not, the content is different.
  _modal = await ModalFactory.create({
    type: Modal.TYPE,
    title: STR.title,
    templateContext: {
      elementid: _editor.id
    },
    removeOnClose: true,
    large: true,
  });
};

/**
 * Display modal dialogue to edit a cloze question. Either a form is displayed to edit subquestion or a list
 * of possible questions is show.
 *
 * @method displayDialogue
 * @private
 */
const displayDialogue = async function() {
  await _createModal();

  // Resolve whether cursor is in a subquestion.
  var subquestion = resolveSubquestion();
  if (subquestion) {
    // Subquestion found, remember which node of the marker nodes is selected.
    _selectedOffset = indexOfNode(_editor.dom.select('.' + markerClass), subquestion);
    _parseSubquestion(subquestion.innerHTML);
    _setDialogueContent(_qtype);
  } else {
    // No subquestion found, no offset to remember, but we place a marker at the position where the question
    // will be inserted later.
    _selectedOffset = -1;
    _editor.insertContent(markerSpan.replace(markerClass, markerClass + ' new') + markerNewPos + '</span>');
    _setDialogueContent();
  }
};

/**
 * Search for cloze questions based on a regular expression. All the matching snippets at least contain the cloze
 * question definition. Although Moodle does not support encapsulated other functions within curly brackets, we
 * still try to find the correct closing bracket. The so extracted cloze question is surrounded by a marker span
 * element, that contains attributes so that the content inside the span cannot be modified by the editor (in the
 * textarea). Also, this makes it a lot easier to select the question, edit it in the dialogue and replace the result
 * in the existing text area.
 */
const _addMakers = function() {

  let content = _editor.getContent();
  let newContent = '';

  // Check if there is already a marker span. In this case we do not have to do anything.
  if (content.indexOf(markerClass) !== -1) {
    return;
  }

  let m;
  do {
    m = content.match(reQtype);
    if (!m) { // No match of a cloze question, then we are done.
      newContent += content;
      break;
    }
    // Copy the current match to the new string preceded with the <span>.
    const pos = content.indexOf(m[0]);
    newContent += content.substring(0, pos) + markerSpan + content.substring(pos, pos + m[0].length);
    content = content.substring(pos + m[0].length);

    // Count the { in the string, should be just one (the very first one at position 0).
    let level = (m[0].match(/\{/g) || []).length;
    if (level === 1) {
      // If that's the case, we close the span and the cloze question text is the innerHTML of that marker span.
      newContent += '</span>';
      continue; // Look for the next matching cloze question.
    }
    // If there are more { than } in the string, then we did not find the corresponding } that belongs to the cloze string.
    while (level > 1) {
      const a = content.indexOf('{');
      const b = content.indexOf('}');
      if (a > -1 && b > -1 && a < b) { // The { is before another } so remember to find as many } until we back at level 1.
        level++;
        newContent = content.substring(0, a);
        content = content.substring(a + 1);
      } else if (b > -1) {  // We found a closing } to a previously {.
        newContent = content.substring(0, b);
        content = content.substring(b + 1);
        level--;
      } else {
        level = 1; // Should not happen, just to stop the endless loop.
      }
    }
    newContent += '</span>';
  } while (m);
  newContent = newContent.replace(markerNewPos, markerSpan.replace(markerClass, markerClass + ' new') + markerNewPos + '</span>');
  _editor.setContent(newContent);
};

/**
 * Look for the marker span elements around a cloze question and remove that span. Also the marker for a new
 * node to be inserted would be removed here as well.
 */
const _removeMarkers = function() {
  for (const span of _editor.dom.select('span.' + markerClass)) {
    _editor.dom.setOuterHTML(span, span.innerHTML);
  }
};

/**
 * Parsing the content and adding or removing the markers. This happens when the editor mode is switched from WYSIWYG
 * to source mode and vice versa. Also when saving the content the markers must be removed. During blur the content
 * is also modified, here we have to add the markers again (the blurred flag was set before by the blur event).
 * @param {object} content
 * @param {string} event
 */
const onProcess = function(content, event) {
  if (!isNull(content.save) && content.save === true) {
    if (event === 'PostProcess') {
      // When the blur event was triggered, the editor is still there, we need to reapply
      // the previously removed styling. If this was a submit event, then do not reapply the
      // styling to prevent that this is saved in the database.
      if (_isBlurred) {
        _addMakers();
        _isBlurred = false;
      }
    } else if (!_modal) {
      _removeMarkers();
    }
  }
};

/**
 * Notice when the editor content is blurred, because the focus left the editor window.
 */
const onBlur = function() {
  _isBlurred = true;
};

/**
 * Set the dialogue content for the tool, attaching any required events. Either the modal dialogue displays
 * a list of the question types for the form for a particular question to edit. The set content is also
 * called when the form has changed (up or down move, deletion and adding a response). We must be aware of that
 * an event to the dialogue buttons must attached once only. Therefore when the form content is modified, only
 * the form events for the answers are set again, the general events are nor (nomodalevents is true then).
 *
 * @method _setDialogueContent
 * @param {String} qtype The question type to be used
 * @param {boolean} nomodalevents Optional do not attach events.
 * @return {Node} The content to place in the dialogue.
 * @private
 */
const _setDialogueContent = function(qtype, nomodalevents) {
  const footer = Mustache.render(TEMPLATE.FOOTER, {
    cancel: STR.btn_cancel,
    submit: !qtype ? STR.btn_select : STR.btn_insert,
  });
  let contentText;
  if (!qtype) {
    contentText = Mustache.render(TEMPLATE.TYPE, {
      CSS: CSS,
      STR: STR,
      qtype: _qtype,
      types: getQuestionTypes()
    });
  } else {
    contentText = Mustache.render(TEMPLATE.FORM, {
      CSS: CSS,
      STR: STR,
      answerdata: _answerdata,
      elementid: crypto.randomUUID(),
      qtype: _qtype,
      name: getQuestionTypes().filter(q => _qtype === q.type)[0].name,
      marks: _marks,
      numerical: (_qtype === 'NUMERICAL' || _qtype === 'NM')
    });
  }
  _modal.setBody(contentText);
  _modal.setFooter(footer);
  _modal.show();
  const $root = _modal.getRoot();
  _form = $root.get(0).querySelector('form');

  if (!nomodalevents) {
    _modal.registerEventListeners();
    _modal.registerCloseOnSave();
    _modal.registerCloseOnCancel();
    $root.on(ModalEvents.cancel, _cancel);

    if (!qtype) { // For the question list we need the choice handler only and we are done.
      $root.on(ModalEvents.save, _choiceHandler);
      return;
    } // Handler to add the question string to the editor content.
    $root.on(ModalEvents.save, _setSubquestion);
  }
  // The form needs events for the icons to move up/down, add or delete a response.
  const getTarget = e => {
    let p = e.target;
    while (!isNull(p) && p.nodeType === 1 && p.tagName !== 'A') {
      p = p.parentNode;
    }
    if (isNull(p.classList)) {
      return null;
    }
    return p;
  };

  _form.addEventListener('click', e => {
    const p = getTarget(e);
    if (isNull(p)) {
      return;
    }
    if (p.classList.contains(CSS.DELETE)) {
      e.preventDefault();
      _deleteAnswer(p);
      return;
    }
    if (p.classList.contains(CSS.ADD)) {
      e.preventDefault();
      _addAnswer(p);
      return;
    }
    if (p.classList.contains(CSS.LOWER)) {
      e.preventDefault();
      _lowerAnswer(p);
      return;
    }
    if (p.classList.contains(CSS.RAISE)) {
      e.preventDefault();
      _raiseAnswer(p);
    }
  });
  _form.addEventListener('keyup', e => {
    const p = getTarget(e);
    if (isNull(p)) {
      return;
    }
    if (p.classList.contains(CSS.ANSWER) || p.classList.contains(CSS.FEEDBACK)) {
      e.preventDefault();
      _addAnswer(p);
    }
  });
};

/**
 * Handle question choice.
 *
 * @method _choiceHandler
 * @private
 * @param {Event} e Event from button click in chooser
 */
const _choiceHandler = function(e) {
  e.preventDefault();
  let qtype = _form.querySelector('input[name=qtype]:checked');
  if (qtype) {
    _qtype = qtype.value;
  }
  _answerdata = [
    {
      id: crypto.randomUUID(),
      answer: '',
      feedback: '',
      fraction: 100,
      fractionOptions: getFractionOptions('100'),
      tolerance: 0
    }
  ];
  _modal.destroy();
  // Our choice is stored in _qtype. We need to create the modal dialogue with the form now.
  _createModal().then(function () {
    _setDialogueContent(_qtype);
    _form.querySelector('.' + CSS.ANSWER).focus();
  });
};

/**
 * Parse question and set properties found.
 *
 * @method _parseSubquestion
 * @private
 * @param {String} question The question string
 */
const _parseSubquestion = function(question) {
  _answerdata = []; // Flush answers to have an empty dialogue if something goes wrong parsing the question string.
  const parts = reQtype.exec(question);
  reQtype.lastIndex = 0; // Reset lastIndex so that the next match starts from the beginning of the question string.
  if (!parts) {
    return;
  }
  _marks = parts[1];
  _qtype = parts[2];
  // Convert the short notation to the long form e.g. SA to SHORTANSWER.
  if (_qtype.length < 5) {
    getQuestionTypes().map((l) => {
      for (const a of l.abbr) {
        if (a === _qtype) {
          _qtype = l.type;
          return;
        }
      }
    });
  }
  const answers = parts[8].match(/(\\.|[^~])*/g);
  if (!answers) {
    return;
  }
  answers.forEach(function(answer) {
    const options = /^(%(-?[.0-9]+)%|(=?))((\\.|[^#])*)#?(.*)/.exec(answer);
    if (options && options[4]) {
      const frac = options[3] ? (options[3] === '=' ? '=' : 100) : options[2] || 0;
      if (_qtype === 'NUMERICAL' || _qtype === 'NM') {
        const tolerance = /^([^:]*):?(.*)/.exec(options[4])[2] || 0;
        _answerdata.push({
          id: crypto.randomUUID(),
          answer: strdecode(options[4].replace(/:.*/, '')),
          feedback: strdecode(options[6]),
          tolerance: tolerance,
          fraction: frac,
          fractionOptions: getFractionOptions(frac),
        });
        return;
      }
      _answerdata.push({
        answer: strdecode(options[4]),
        id: crypto.randomUUID(),
        feedback: strdecode(options[6]),
        fraction: frac,
        fractionOptions: getFractionOptions(frac),
      });
    }
  });
};

/**
 * Insert a new set of answer blanks below the button.
 *
 * @method _addAnswer
 * @param {Node} a Node that is the referred element
 * @private
 */
const _addAnswer = function(a) {
  let index = indexOfNode(_form.querySelectorAll('.' + CSS.ADD), a);
  if (index === -1) {
    index = indexOfNode(_form.querySelectorAll('.' + CSS.ANSWER + ', .' + CSS.FEEDBACK), a);
    if (index !== -1) {
      index = Math.floor(index / 2) + 1;
    }
  }
  let fraction = '';
  if (a.closest('li')) {
    fraction = a.closest('li').querySelector('.' + CSS.FRACTION).value;
    index = indexOfNode(_form.querySelectorAll('li'), a.closest('li')) + 1;
  }
  let tolerance = 0;
  if (a.closest('li') && a.closest('li').querySelector('.' + CSS.TOLERANCE)) {
    tolerance = a.closest('li').querySelector('.' + CSS.TOLERANCE).value;
  }
  _getFormData();
  _answerdata.splice(index, 0, {
    id: crypto.randomUUID(),
    answer: '',
    feedback: '',
    fraction: fraction,
    fractionOptions: getFractionOptions(fraction),
    tolerance: tolerance
  });
  _setDialogueContent(_qtype, true);
  _form.querySelectorAll('.' + CSS.ANSWER).item(index).focus();
};

/**
 * Delete set of answer next to the button.
 *
 * @method _deleteAnswer
 * @param {Node} a Node that is the referred element
 * @private
 */
const _deleteAnswer = function(a) {
  let index = indexOfNode(_form.querySelectorAll('.' + CSS.DELETE), a);
  if (index === -1) {
    index = indexOfNode(_form.querySelectorAll('li'), a.closest('li'));
  }
  _getFormData();
  _answerdata.splice(index, 1);
  _setDialogueContent(_qtype, true);
  const answers = _form.querySelectorAll('.' + CSS.ANSWER);
  index = Math.min(index, answers.length - 1);
  answers.item(index).focus();
};

/**
 * Lower answer option
 *
 * @method _lowerAnswer
 * @param {Node} a Node that is the referred element
 * @private
 */
const _lowerAnswer = function(a) {
  const li = a.closest('li');
  li.before(li.nextSibling);
  li.querySelector('.' + CSS.ANSWER).focus();
};

/**
 * Raise answer option
 *
 * @method _raiseAnswer
 * @param {Node} a Node that is the referred element
 * @private
 */
const _raiseAnswer = function(a) {
  const li = a.closest('li');
  li.after(li.previousSibling);
  li.querySelector('.' + CSS.ANSWER).focus();
};

/**
 * Reset and hide form.
 *
 * @method _cancel
 * @param {Event} e Event from button click
 * @private
 */
const _cancel = function(e) {
  e.preventDefault();
  // In case there is a marker where the new question should be inserted in the text it needs to be removed.
  for (const span of _editor.dom.select('.' + markerClass + '.new')) {
    span.remove();
  }
  _modal.hide();
};

/**
 * Insert question string into editor content and reset and hide form.
 *
 * @method _setSubquestion
 * @param {Event} e Event from button click
 * @private
 */
const _setSubquestion = function(e) {
  e.preventDefault();
  _getFormData();

  // Build the parser function from the data, that is going to be placed into the editor content.
  let question = '{' + _marks + ':' + _qtype + ':';

  for (let i = 0; i < _answerdata.length; i++) {
    question += _answerdata[i].fraction && !isNaN(_answerdata[i].fraction)
      ? '%' + _answerdata[i].fraction + '%' : _answerdata[i].fraction;
    question += strencode(_answerdata[i].answer);
    if (_answerdata[i].tolerance) {
      question += ':' + _answerdata[i].tolerance;
    }
    if (_answerdata[i].feedback) {
      question += '#' + strencode(_answerdata[i].feedback);
    }
    if (i < _answerdata.length - 1) {
      question += '~';
    }
  }
  question += '}';

  _modal.destroy();
  _modal = null;
  _editor.focus();
  if (_selectedOffset > -1) { // We have to replace one of the marker spans (the innerHTML contains the question string).
    _editor.dom.select('.' + markerClass)[_selectedOffset].innerHTML = question;
  } else {
    // Find the new maker, add the question string and remove the new flag.
    const newEl = _editor.dom.select('.' + markerClass + '.new');
    if (newEl.length > 0) {
      newEl[0].innerHTML = question;
      newEl[0].classList.remove('new');
    }
  }
};

/**
 * Read the form data, process it and store the result in the internal  _answerdata array.
 *
 * @method _getFormData
 * @private
 */
const _getFormData = function() {
  _answerdata = [];
  let answer;
  const answers = _form.querySelectorAll('.' + CSS.ANSWER);
  const feedbacks = _form.querySelectorAll('.' + CSS.FEEDBACK);
  const fractions = _form.querySelectorAll('.' + CSS.FRACTION);
  const tolerances = _form.querySelectorAll('.' + CSS.TOLERANCE);
  for (let i = 0; i < answers.length; i++) {
    answer = answers.item(i).value;
    if (_qtype === 'NM' || _qtype === 'NUMERICAL') {
      answer = Number(answer);
    }
    _answerdata.push({
      answer: answer,
      id: crypto.randomUUID(),
      feedback: feedbacks.item(i).value,
      fraction: fractions.item(i).value,
      fractionOptions: getFractionOptions(fractions.item(i).value),
      tolerance: !isNull(tolerances.item(i)) ? tolerances.item(i).value : 0
    });
    _marks = _form.querySelector('.' + CSS.MARKS).value;
  }
};

/**
 * Check whether cursor is in a subquestion and return subquestion text if
 * true.
 *
 * @method resolveSubquestion
 * @return {Mixed} The selected node of with the subquestion if found, false otherwise.
 */
const resolveSubquestion = function() {
  let span = _editor.selection.getStart();
  if (!isNull(span.classList) && span.classList.contains(markerClass)) {
    return span;
  }
  _editor.dom.getParents(span, elm => {
    // Are we in a span that encapsulates the cloze question?
    if (!isNull(elm.classList) && elm.classList.contains(markerClass)) {
      return elm;
    }
  });
  return false;
};

export {
  displayDialogue,
  resolveSubquestion,
  onInit,
  onProcess,
  onBlur
};

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
import Modal from 'core/modal';
import ModalFactory from 'core/modal_factory';
import Mustache from 'core/mustache';
import {get_strings as getStrings} from 'core/str';
import {component} from './common';

// Helper functions.
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
const getUuid = function() {
  if (!isNull(crypto.randomUUID)) {
    return crypto.randomUUID();
  }
  return 'ed-cloze-' + Math.floor(Math.random() * 100000).toString();
};
// Grade Selector value when custom percentage is selected.
const selectCustomPercent = '__custom__';
// This is a specific helper function to return the options html for the fraction select element.
const getFractionOptions = s => {
  const attrSel = ' selected="selected"';
  let isSel = s === '=' ? attrSel : '';
  let html = `<option value="">${STR.incorrect}</option><option value="="${isSel}>${STR.correct}</option>`;
  FRACTIONS.forEach(item => {
    isSel = item.value.toString() === s ? attrSel : '';
    html += `<option value="${item.value}"${isSel}>${item.value}%</option>`;
  });
  isSel = s !== '' && html.indexOf(attrSel) === -1 ? attrSel : '';
  html += `<option value="${selectCustomPercent}"${isSel}>${STR.custom_grade}</option>`;
  return html;
};
// Check if the value is a custom grade value (in order to show the input field).
const isCustomGrade = s => {
  if (s === '=' || s === '') {
    return false;
  }
  let found = false;
  FRACTIONS.forEach(item => {
    if (item.value.toString() === s) {
      found = true;
    }
  });
  return !found;
};
// Marker class and the whole span element that is used to encapsulate the cloze question text.
const markerClass = 'cloze-question-marker';
const markerSpan = '<span contenteditable="false" class="' + markerClass + '" data-mce-contenteditable="false">';
// Regex to recognize the question string in the text e.g. {1:NUMERICAL:...} or {:MULTICHOICE:...}
// eslint-disable-next-line max-len
const reQtype = /\{([0-9]*):(MULTICHOICE(_H|_V|_S|_HS|_VS)?|MULTIRESPONSE(_H|_S|_HS)?|NUMERICAL|SHORTANSWER(_C)?|SAC?|NM|MWC?|M[CR](V|H|VS|HS)?):(.*?)\}/g;

// CSS classes that are used in the modal dialogue.
const CSS = {
  ANSWER: 'tiny_cloze_answer',
  ANSWERS: 'tiny_cloze_answers',
  ADD: 'tiny_cloze_add',
  CANCEL: 'tiny_cloze_cancel',
  DELETE: 'tiny_cloze_delete',
  FEEDBACK: 'tiny_cloze_feedback',
  FRACTION: 'tiny_cloze_fraction',
  FRAC_CUSTOM: 'tiny_cloze_frac_custom',
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
      M.util.image_url('t/add', 'core') + '" alt="{{STR.addmoreanswerblanks}}"></a>' +
      '</div>' +
      '<div class="msg-error hidden"></div>' +
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
      M.util.image_url('t/add', 'core') + '" alt="{{STR.addmoreanswerblanks}}"></a>' +
      '<a class="{{CSS.DELETE}}" title="{{STR.delete}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/delete', 'core') + '" alt="{{STR.delete}}"></a>' +
      '<a class="{{CSS.RAISE}}" title="{{STR.up}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/up', 'core') + '" alt="{{STR.up}}"></a>' +
      '<a class="{{CSS.LOWER}}" title="{{STR.down}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/down', 'core') + '" alt="{{STR.down}}"></a>' +
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
      '<div class="{{CSS.RIGHT}} form-group{{^isCustomGrade}} hidden{{/isCustomGrade}}">' +
      '<input id="{{id}}_grade_custom" type="text"{{#isCustomGrade}} value="{{fraction}}"{{/isCustomGrade}} ' +
      'class="{{CSS.FRAC_CUSTOM}} form-control d-inline mx-2" style="width: 4rem;" />%' +
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
    {value: 0},
  ];

// Language strings used in the modal dialogue.
const STR = {};
const getStr = async() => {
  getStrings([
    {key: 'answer', component: 'question'},
    {key: 'chooseqtypetoadd', component: 'question'},
    {key: 'defaultmark', component: 'question'},
    {key: 'feedback', component: 'question'},
    {key: 'correct', component: 'question'},
    {key: 'incorrect', component: 'question'},
    {key: 'addmoreanswerblanks', component: 'qtype_calculated'},
    {key: 'delete', component: 'core'},
    {key: 'up', component: 'core'},
    {key: 'down', component: 'core'},
    {key: 'tolerance', component: 'qtype_calculated'},
    {key: 'grade', component: 'grades'},
    {key: 'caseno', component: 'mod_quiz'},
    {key: 'caseyes', component: 'mod_quiz'},
    {key: 'answersingleno', component: 'qtype_multichoice'},
    {key: 'answersingleyes', component: 'qtype_multichoice'},
    {key: 'layoutselectinline', component: 'qtype_multianswer'},
    {key: 'layouthorizontal', component: 'qtype_multianswer'},
    {key: 'layoutvertical', component: 'qtype_multianswer'},
    {key: 'shufflewithin', component: 'mod_quiz'},
    {key: 'layoutmultiple_horizontal', component: 'qtype_multianswer'},
    {key: 'layoutmultiple_vertical', component: 'qtype_multianswer'},
    {key: 'pluginnamesummary', component: 'qtype_multichoice'},
    {key: 'pluginnamesummary', component: 'qtype_shortanswer'},
    {key: 'pluginnamesummary', component: 'qtype_numerical'},
    {key: 'multichoice', component},
    {key: 'multiresponse', component},
    {key: 'numerical', component: 'mod_quiz'},
    {key: 'shortanswer', component: 'mod_quiz'},
    {key: 'cancel', component: 'core'},
    {key: 'select', component},
    {key: 'insert', component},
    {key: 'pluginname', component},
    {key: 'customgrade', component},
    {key: 'err_custom_rate', component},
    {key: 'err_empty_answer', component},
    {key: 'err_none_correct', component},
  ]).then(function() {
    const args = Array.from(arguments);
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
      'custom_grade',
      'err_custom_rate',
      'err_empty_answer',
      'err_none_correct',
    ].map((l, i) => {
      STR[l] = args[0][i];
      return ''; // Make the linter happy.
    });
    return ''; // Make the linter happy.
  }).catch(() => {
    return '';
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
 * @type Modal|null
 */
let _modal = null;

/**
 * Inject the editor instance and add markers to the cloze question texts.
 * @param {tinymce.Editor} ed
 */
const onInit = function(ed) {
  _editor = ed; // The current editor instance.
  // Add the marker spans.
  _addMarkers();
  // And get the language strings.
  getStr();
};

/**
 * Create the modal.
 * @return {Promise<void>}
 * @private
 */
const _createModal = async function() {
  // Create the modal dialogue. Depending on whether we have a selected node or not, the content is different.
  const cfg = {
    title: STR.title,
    templateContext: {
      elementid: _editor.id
    },
    removeOnClose: true,
    large: true,
  };
  if (typeof Modal.create === 'function') {
    _modal = await Modal.create(cfg);
  } else {
    _modal = await ModalFactory.create(cfg);
  }
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
    // No subquestion found, no offset to remember.
    _selectedOffset = -1;
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
const _addMarkers = function() {

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
      } else if (b > -1) { // We found a closing } to a previously {.
        newContent = content.substring(0, b);
        content = content.substring(b + 1);
        level--;
      } else {
        level = 1; // Should not happen, just to stop the endless loop.
      }
    }
    newContent += '</span>';
  } while (m);
  _editor.setContent(newContent);
};

/**
 * Look for the marker span elements around a cloze question and remove that span. Also, the marker for a new
 * node to be inserted would be removed here as well.
 */
const _removeMarkers = function() {
  for (const span of _editor.dom.select('span.' + markerClass)) {
    _editor.dom.setOuterHTML(span, span.classList.contains('new') ? '' : span.innerHTML);
  }
};

/**
 * When the source code view dialogue is show, we must remove the spans around the cloze question strings
 * from the editor content and add them again when the dialogue is closed.
 * Since this event is also triggered when the editor data is saved, we use this function to remove the
 * highlighting content at that time.
 * @param {object} content
 */
const onBeforeGetContent = function(content) {
  if (!isNull(content.source_view) && content.source_view === true) {
    // If the user clicks on 'Cancel' or the close button on the html
    // source code dialog view, make sure we re-add the visual styling.
    var onClose = function() {
      _editor.off('close', onClose);
      _addMarkers();
    };
    _editor.on('CloseWindow', () => {
      onClose();
    });
    // Remove markers only if modal is not called, otherwise we will lose our new question marker.
    if (!_modal) {
      _removeMarkers();
    }
  }
};

/**
 * Fires when the form containing the editor is submitted.
 */
const onSubmit = function() {
  _removeMarkers();
};

/**
 * Set the dialogue content for the tool, attaching any required events. Either the modal dialogue displays
 * a list of the question types for the form for a particular question to edit. The set content is also
 * called when the form has changed (up or down move, deletion and adding a response). We must be aware of that
 * an event to the dialogue buttons must be attached once only. Therefore, when the form content is modified, only
 * the form events for the answers are set again, the general events are nor (nomodalevents is true then).
 *
 * @method _setDialogueContent
 * @param {String} qtype The question type to be used
 * @param {boolean} nomodalevents Optional do not attach events.
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
      elementid: getUuid(),
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

    if (!qtype) { // For the question list we need the choice handler only, and we are done.
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
  _form.querySelectorAll('.' + CSS.FRACTION).forEach((sel) => {
    sel.addEventListener('change', e => {
      const id = e.target.getAttribute('id');
      if (e.target.value === selectCustomPercent) {
        document.getElementById(id + '_custom').parentNode.classList.remove('hidden');
      } else {
        document.getElementById(id + '_custom').parentNode.classList.add('hidden');
      }
    });
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
  const max = (_qtype.indexOf('SHORTANSWER') !== -1 || _qtype === 'NUMERICAL') ? 1 : 3;
  const blankAnswer = {
    id: getUuid(),
    answer: '',
    feedback: '',
    fraction: 100,
    fractionOptions: getFractionOptions(max === 1 ? '=' : ''),
    tolerance: 0,
    isCustomGrade: false,
  };
  _answerdata = [];
  for (let x = 0; x < max; x++) {
    _answerdata.push({...blankAnswer, id: getUuid()});
  }
  _modal.destroy();
  // Our choice is stored in _qtype. We need to create the modal dialogue with the form now.
  _createModal().then(() => {
    _setDialogueContent(_qtype);
    _form.querySelector('.' + CSS.ANSWER).focus();
    return ''; // Make the linter happy.
  }).catch(() => {
      return '';
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
    getQuestionTypes().forEach(l => {
      for (const a of l.abbr) {
        if (a === _qtype) {
          _qtype = l.type;
          return;
        }
      }
    });
  }
  const answers = parts[7].match(/(\\.|[^~])*/g);
  if (!answers) {
    return;
  }
  answers.forEach(function(answer) {
    const options = /^(%(-?[.0-9]+)%|(=?))((\\.|[^#])*)#?(.*)/.exec(answer);
    if (options && options[4]) {
      let frac = '';
      if (options[3]) {
        frac = options[3] === '=' ? '=' : 100;
      } else if (options[2]) {
        frac = options[2];
      }
      if (_qtype === 'NUMERICAL' || _qtype === 'NM') {
        const tolerance = /^([^:]*):?(.*)/.exec(options[4])[2] || 0;
        _answerdata.push({
          id: getUuid(),
          answer: strdecode(options[4].replace(/:.*/, '')),
          feedback: strdecode(options[6]),
          tolerance: tolerance,
          fraction: frac,
          fractionOptions: getFractionOptions(frac),
          isCustomGrade: isCustomGrade(frac),
        });
        return;
      }
      _answerdata.push({
        answer: strdecode(options[4]),
        id: getUuid(),
        feedback: strdecode(options[6]),
        fraction: frac,
        fractionOptions: getFractionOptions(frac),
        isCustomGrade: isCustomGrade(frac),
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
    if (fraction === selectCustomPercent) {
      fraction = a.closest('li').querySelector('.' + CSS.FRAC_CUSTOM).value;
    }
    index = indexOfNode(_form.querySelectorAll('li'), a.closest('li')) + 1;
  }
  let tolerance = 0;
  if (a.closest('li') && a.closest('li').querySelector('.' + CSS.TOLERANCE)) {
    tolerance = a.closest('li').querySelector('.' + CSS.TOLERANCE).value;
  }
  _processFormData();
  _answerdata.splice(index, 0, {
    id: getUuid(),
    answer: '',
    feedback: '',
    fraction: fraction,
    fractionOptions: getFractionOptions(fraction),
    tolerance: tolerance,
    isCustomGrade: isCustomGrade(fraction)
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
  _processFormData();
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
  _modal.destroy();
  _editor.focus();
  _modal = null;
};

/**
 * Insert question string into editor content and reset and hide form. If the form contains an error
 * nothing happens.
 *
 * @method _setSubquestion
 * @param {Event} e Event from button click
 * @private
 */
const _setSubquestion = function(e) {
  e.preventDefault();
  // Check if there are any errors and if so, fill the error container with the
  // messages and return without going any further and closing the dialogue.
  const errMsg = _form.querySelector('.msg-error');
  const formErrors = _processFormData(true);
  if (formErrors.length > 0) {
    const unique = formErrors.filter((value, index, array) => array.indexOf(value) === index);
    errMsg.innerHTML = '<ul><li>' + unique.join('</li><li>') + '</li></ul>';
    errMsg.classList.remove('hidden');
    return;
  } else {
    errMsg.classList.add('hidden');
  }
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
    // Just add the question text with markup.
    _editor.insertContent(markerSpan + question + '</span>');
  }
};

/**
 * Read the form data, process it and store the result in the internal  _answerdata array.
 * Also, is validation is enabled, the custom_grade field is in use and does not contain
 * a number, then the field is marked as an error and the return value is false.
 *
 * @method _processFormData
 * @param {boolean} validate
 * @return {Array}
 * @private
 */
const _processFormData = function(validate) {
  _answerdata = [];
  let answer;
  let hasErrors = [];
  let foundCorrect = false;
  const answers = _form.querySelectorAll('.' + CSS.ANSWER);
  const feedbacks = _form.querySelectorAll('.' + CSS.FEEDBACK);
  const fractions = _form.querySelectorAll('.' + CSS.FRACTION);
  const customGrades = _form.querySelectorAll('.' + CSS.FRAC_CUSTOM);
  const tolerances = _form.querySelectorAll('.' + CSS.TOLERANCE);
  for (let i = 0; i < answers.length; i++) {
    answers.item(i).classList.remove('error');
    customGrades.item(i).classList.remove('error');
    answer = answers.item(i).value;
    if (_qtype === 'NM' || _qtype === 'NUMERICAL') {
      answer = Number(answer);
    }
    const currentAnswer = {
      answer: answer,
      id: getUuid(),
      feedback: feedbacks.item(i).value,
      fraction: fractions.item(i).value === selectCustomPercent ? customGrades.item(i).value : fractions.item(i).value,
      fractionOptions: getFractionOptions(fractions.item(i).value),
      tolerance: !isNull(tolerances.item(i)) ? tolerances.item(i).value : 0,
      isCustomGrade: fractions.item(i).value === selectCustomPercent
    };
    if (validate) {
      if (currentAnswer.isCustomGrade &&
        (isNaN(currentAnswer.fraction) || currentAnswer.fraction < -100 || currentAnswer.fraction > 100
          || currentAnswer.fraction.trim() === '')
      ) {
        hasErrors.push(STR.err_custom_rate);
        customGrades.item(i).classList.add('error');
      }
      // Check for non-empty value in the original input.
      if (answers.item(i).value.trim() === '') {
        answers.item(i).classList.add('error');
        hasErrors.push(STR.err_empty_answer);
      }
      if (currentAnswer.fraction === '100' || currentAnswer.fraction === '=') {
        foundCorrect = true;
      }
    }
    _answerdata.push(currentAnswer);
    _marks = _form.querySelector('.' + CSS.MARKS).value;
  }
  if (validate && !foundCorrect) {
    hasErrors.push(STR.err_none_correct);
  }
  return hasErrors;
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
    return false;
  });
  return false;
};

export {
  displayDialogue,
  resolveSubquestion,
  onInit,
  onBeforeGetContent,
  onSubmit,
};

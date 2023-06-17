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

import ModalFactory from 'core/modal_factory';
import Modal from "./modal";
import Mustache from 'core/mustache';
import {get_string} from 'core/str';
import {getQuestionTypes} from './options';
import {component} from './common';

// Helper functions.
const trim = v => v.toString().replace(/^\s+/, '').replace(/\s+$/, '');
const isNull = a => a === null || a === undefined;
const strdecode = t => String(t).replace(/\\(#|\}|~)/g, '$1');
const strencode = t => String(t).replace(/(#|\}|~)/g, '\\$1');

// Marker class and the whole span element that is used to encapsulate the cloze question text.
const markerClass = 'cloze-question-marker';
const markerSpan = '<span contenteditable="false" class="' + markerClass + '" data-mce-contenteditable="false">';
// Regex to recognize the question string in the text e.g. {1:NUMERICAL:...} or {:MULTICHOICE:...}
const reQtype = /\{([0-9]*):(MULTICHOICE(_H|_V|_S|_HS|_VS)?|MULTIRESPONSE(_H|_S|_HS)?|NUMERICAL|SHORTANSWER(_C)?|SA|NM):(.*?)\}/g;
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
      '<p class="ml-2">{{qtype}}</p>' +
      '<form class="tiny_form">' +
      '<div class="row ml-0">' +
      '<div class="form-group">' +
      '<label for="{{elementid}}_mark">{{get_string "defaultmark" "question"}}</label>' +
      '<input id="{{elementid}}_mark" type="text" value="{{marks}}" ' +
      'class="{{CSS.MARKS}} form-control d-inline mx-1" />' +
      '<a class="{{CSS.ADD}}" title="{{get_string "addmoreanswerblanks" "qtype_calculated"}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/add', 'core') + '"></a>' +
      '</div>' +
      '</div>' +
      '<div class="{{CSS.ANSWERS}} mb-3">' +
      '<ol class="pl-3">{{#answerdata}}' +
      '<li class="mt-3"><div class="row ml-0">' +
      '<div class="{{CSS.LEFT}} form-group">' +
      '<label for="{{id}}_answer">{{get_string "answer" "question"}}</label>' +
      '<input id="{{id}}_answer" type="text" value="{{answer}}" ' +
      'class="{{CSS.ANSWER}} form-control d-inline mx-2" />' +
      '</div>' +
      '<div class="{{CSS.LEFT}} form-group">' +
      '<a class="{{CSS.ADD}}" title="{{get_string "addmoreanswerblanks" "qtype_calculated"}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/add', 'core') + '"></a>' +
      '<a class="{{CSS.DELETE}}" title="{{get_string "delete" "core"}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/delete', 'core') + '"></a>' +
      '<a class="{{CSS.RAISE}}" title="{{get_string "up" "core"}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/up', 'core') + '"></a>' +
      '<a class="{{CSS.LOWER}}" title="{{get_string "down" "core"}}">' +
      '<img class="icon_smallicon" src="' +
      M.util.image_url('t/down', 'core') + '"></a>' +
      '</div>' +
      '</div>' +
      '{{#if ../numerical}}' +
      '<div class="row">' +
      '<div class="{{CSS.RIGHT}} form-group">' +
      '<label for="{{id}}_tolerance">{{{get_string "tolerance" "qtype_calculated"}}}</label>' +
      '<input id="{{id}}_tolerance" type="text" value="{{tolerance}}" ' +
      'class="{{CSS.TOLERANCE}} form-control d-inline mx-2" />' +
      '</div>' +
      '</div>' +
      '{{/if}}' +
      '<div class="row">' +
      '<div class="{{CSS.RIGHT}} form-group">' +
      '<label for="{{id}}_feedback">{{get_string "feedback" "question"}}</label>' +
      '<input id="{{id}}_feedback" type="text" value="{{feedback}}" ' +
      'class="{{CSS.FEEDBACK}} form-control d-inline mx-2" />' +
      '</div>' +
      '<div class="{{CSS.RIGHT}} form-group">' +
      '<label id="{{id}}_grade">{{get_string "grade" "grades"}}</label>' +
      '<select id="{{id}}_grade" class="{{CSS.FRACTION}} custom-select mx-2" selected="selected">' +
      '{{#if fraction}}' +
      '<option value="{{fraction}}">{{fraction}}%</option>' +
      '{{/if}}' +
      '<option value="">{{get_string "incorrect" "question"}}</option>' +
      '{{#../fractions}}' +
      '<option value="{{fraction}}">{{fraction}}%</option>' +
      '{{/../fractions}}' +
      '</select>' +
      '</div>' +
      '</div></li>' +
      '{{/answerdata}}</ol></div>' +
      '<p class="mb-0"><button type="submit" class="{{CSS.SUBMIT}} btn btn-primary mr-1" ' +
      'title="{{get_string "common:insert" "editor_tinymce"}}">' +
      '{{get_string "common:insert" "editor_tinymce"}}</button>' +
      '<button type="submit" class="{{CSS.CANCEL}} btn btn-secondary">{{get_string "cancel" "core"}}</button></p>' +
      '</form>' +
      '</div>',
    OUTPUT: '&#123;{{marks}}:{{qtype}}:{{#answerdata}}~{{#if fraction}}%{{../fraction}}%{{/if}}{{answer}}' +
      '{{#if tolerance}}:{{tolerance}}{{/if}}' +
      '{{#if feedback}}#{{feedback}}{{/if}}{{/answerdata}}&#125;',
    TYPE: '<div class="tiny_cloze mt-0 mx-2 mb-2">' +
      '<p>{{get_string "chooseqtypetoadd" "question"}}</p>' +
      '<form name="tiny_form">' +
      '<div class="{{CSS.TYPE}} form-check">' +
      '{{#types}}' +
      '<div class="option">' +
      '<input name="qtype" id="qtype_qtype_{{type}}" value="{{type}}" type="radio" class="form-check-input">' +
      '<label for="qtype_qtype_{{type}}">' +
      '<span class="typename">{{type}}</span>' +
      '<span class="{{CSS.SUMMARY}}"><h6>{{name}}</h6><p>{{summary}}</p>' +
      '<ul>{{#options}}' +
      '<li>{{option}}</li>' +
      '{{/options}}</ul>' +
      '</span>' +
      '</label></div>' +
      '{{/types}}</div>' +
      '<p class="mb-0"><button type="submit" class="{{CSS.SUBMIT}} btn btn-primary mr-1" ' +
      'title="{{get_string "add" "core"}}">{{get_string "add" "core"}}</button>' +
      '{{#qtype}}<button type="submit" class="{{CSS.DUPLICATE}} btn btn-secondary mr-1">' +
      '{{get_string "duplicate" "core"}}</button>{{/qtype}}' +
      '<button type="submit" class="{{CSS.CANCEL}} btn btn-secondary">{{get_string "cancel" "core"}}</button></p>' +
      '</form></div>',
  };
  const FRACTIONS = [{fraction: 100},
    {fraction: 50},
    {fraction: 33.33333},
    {fraction: 25},
    {fraction: 20},
    {fraction: 16.66667},
    {fraction: 14.28571},
    {fraction: 12.5},
    {fraction: 11.11111},
    {fraction: 10},
    {fraction: 5},
    {fraction: 0},
    {fraction: -5},
    {fraction: -10},
    {fraction: -11.11111},
    {fraction: -12.5},
    {fraction: -14.28571},
    {fraction: -16.66667},
    {fraction: -20},
    {fraction: -25},
    {fraction: -33.333},
    {fraction: -50},
    {fraction: -100},
  ];

  let editor = null;

  let isBlurred = false;
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

  let _answerDefault = '';
  /**
   * The sub question type to be edited
   *
   * @param _qtype
   * @type String
   * @private
   */
  let _qtype = null;

  /**
   * The text initial selected to use as answer default
   *
   * @param _selectedText
   * @type String
   * @private
   */
  let _selectedText = null;


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
let modal = null;

  /**
   * The selection object returned by the browser.
   *
   * @type Range|null
   * @default null
   */
  let _currentSelection = null;

/**
 * Inject the editor instance and add markers to the cloze question texts.
 * @param {tinymce.Editor} ed
 */
const onInit = function(ed) {
    editor = ed;
    addMakers();
  };

/**
 * Display form to edit subquestions.
 *
 * @method displayDialogue
 * @private
 */
const displayDialogue = async function() {
  // Store the current selection.
  _currentSelection = editor.selection.getContent();
  if (trim(_currentSelection) !== '') {
    // Save selected string to set answer default answer.
    _selectedText = _currentSelection.toString();
  }
  modal = await ModalFactory.create({
    type: Modal.TYPE,
    title: get_string('button_clozeedit', component),
    templateContext: {
      elementid: editor.id
    },
    removeOnClose: true,
    large: true,
  });

  // Resolve whether cursor is in a subquestion.
  var subquestion = resolveSubquestion(editor);
  if (subquestion) {
    _parseSubquestion(subquestion);
    modal.setBody(_getDialogueContent(null, _qtype));
  } else {
    const text = _getDialogueContent();
    modal.setBody(text);
  }
  modal.show();
};

/**
 * Search for cloze questions based on a regular expression. All the matching snippets at least contain the cloze
 * question definition. Although Moodle does not support encapsulated other functions within curly brackets, we
 * still try to find the correct closing bracket. The so extracted cloze question is surrounded by a marker span
 * element, that contains attributes so that the content inside the span cannot be modified by the editor (in the
 * textarea). Also, this makes it a lot easier to select the question, edit it in the dialogue and replace the result
 * in the existing text area.
 */
const addMakers = function() {

  let content = editor.getContent();
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
    content = content.substring(pos + m[0].length + 1);

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
  editor.setContent(newContent);
};

/**
 * Look for the marker span elements around a cloze question and remove that span.
 */
const removeMarkers = function() {
  for (const span of editor.dom.select('span.' + markerClass)) {
    editor.dom.setOuterHTML(span, span.innerHTML);
  }
};

/**
 *
 * @param {object} content
 * @param {string} event
 */
const onProcess = function(content, event) {
  if (!isNull(content.save) && content.save === true) {
    if (event === 'PostProcess') {
      // When the blur event was triggered, the editor is still there, we need to reapply
      // the previously removed styling. If this was a submit event, then do not reapply the
      // styling to prevent that this is saved in the database.
      if (isBlurred) {
        addMakers();
        isBlurred = false;
      }
    } else {
      removeMarkers();
    }
  }
};
/**
 * Notice when the editor content is blurred, because the focus left the editor window.
 */
const onBlur = function() {
  isBlurred = true;
};


  /**
   * Return the dialogue content for the tool, attaching any required
   * events.
   *
   * @method _getDialogueContent
   * @param {Event} e The event causing content to change
   * @param {String} qtype The question type to be used
   * @return {Node} The content to place in the dialogue.
   * @private
   */
  const _getDialogueContent = function(e, qtype) {

    if (_form) {
      //_form.remove().destroy(true);
    }

    if (!qtype) {
      const contentText = Mustache.render(TEMPLATE.TYPE, {CSS: CSS,
        qtype: _qtype,
        types: getQuestionTypes(editor)
      });
      const dom = new DOMParser();
      const content = dom.parseFromString(contentText, 'text/html').body.firstElementChild;
      _form = content;

      content.addEventListener('click', _choiceHandler,
        '.' + CSS.SUBMIT + ', .' + CSS.DUPLICATE);
      content.querySelector('.' + CSS.CANCEL).addEventListener('click', _cancel);
      return content.outerHTML;
    }

    const contentText = Mustache.render(TEMPLATE.FORM, {CSS: CSS,
      answerdata: _answerdata,
      elementid: crypto.randomUUID(),
      fractions: FRACTIONS,
      qtype: _qtype,
      marks: _marks,
      numerical: (_qtype === 'NUMERICAL' || _qtype === 'NM')
    });

    const dom = new DOMParser();
    const content = dom.parseFromString(contentText, 'text/html').body.firstElementChild;
    _form = content;

    content.querySelector('.' + CSS.SUBMIT).addEventListener('click', _setSubquestion);
    content.querySelector('.' + CSS.CANCEL).addEventListener('click', _cancel);
    content.addEventListener('click', e => {
      if (e.target.classList.contains(CSS.DELETE)) {
        _deleteAnswer(e);
        return;
      }
      if (e.target.classList.contains(CSS.ADD)) {
        _addAnswer(e);
        return;
      }
      if (e.target.classList.contains(CSS.LOWER)) {
        _lowerAnswer(e);
        return;
      }
      if (e.target.classList.contains(CSS.RAISE)) {
        _raiseAnswer(e);
        return;
      }
    });
    content.addEventListener('keyup', e => {
      if (e.target.classList.contains(CSS.ANSWER) || e.target.classList.contains(CSS.FEEDBACK)) {
        _addAnswer(e);
      }
    });
    return content.outerHTML;
  };

  /**
   * Find the correct answer default for the current question type
   *
   * @method _getAnswerDefault
   * @private
   * @return {String} Default answer
   */
  const _getAnswerDefault = function() {
    switch (_qtype) {
      case 'SHORTANSWER':
      case 'SA':
      case 'NUMERICAL':
      case 'NM':
        _answerDefault = 100;
        break;
      default:
        _answerDefault = '';
    }
    return _answerDefault;
  };

  /**
   * Handle question choice
   *
   * @method _choiceHandler
   * @private
   * @param {Event} e Event from button click in chooser
   */
  const _choiceHandler = function(e) {
    e.preventDefault();
    let qtype = _form.querySelector('input[name=qtype]:checked');
    if (qtype) {
      _qtype = qtype.get('value');
      _getAnswerDefault();
    }
    if (e && e.currentTarget && e.currentTarget.hasClass(CSS.SUBMIT)) {
      _answerdata = [
        {
          id: crypto.randomUUID(),
          answer: _selectedText,
          feedback: '',
          fraction: 100,
          tolerance: 0
        }
      ];
    }
    modal.setBody(_getDialogueContent(e, _qtype));
    _form.querySelector('.' + CSS.ANSWER).focus();
  };

  /**
   * Parse question and set properties found
   *
   * @method _parseSubquestion
   * @private
   * @param {String} question The question string
   */
  const _parseSubquestion = function(question) {
    const parts = reQtype.exec(question);
    if (!parts) {
      return;
    }
    _marks = parts[1];
    _qtype = parts[2];
    _getAnswerDefault();
    _answerdata = [];
    const answers = parts[6].match(/(\\.|[^~])*/g);
    if (!answers) {
      return;
    }
    answers.forEach(function(answer) {
      const options = /^(%(-?[.0-9]+)%|(=?))((\\.|[^#])*)#?(.*)/.exec(answer);
      if (options && options[4]) {
        if (_qtype === 'NUMERICAL' ||_qtype === 'NM') {
          const tolerance = /^([^:]*):?(.*)/.exec(options[4])[2] || 0;
          _answerdata.push({
            id: crypto.randomUUID(),
            answer: strdecode(options[4].replace(/:.*/, '')),
            feedback: strdecode(options[6]),
            tolerance: tolerance,
            fraction: options[3] ? 100 : options[2] || 0
          });
          return;
        }
        _answerdata.push({
          answer: strdecode(options[4]),
          id: crypto.randomUUID(),
          feedback: strdecode(options[6]),
          fraction: options[3] ? 100 : options[2] || 0
        });
      }
    });
  };

  /**
   * Insert a new set of answer blanks before the button.
   *
   * @method _addAnswer
   * @param {Event} e Event from button click or return
   * @private
   */
  const _addAnswer = function(e) {
    e.preventDefault();
    let index = _form.querySelectorAll('.' + CSS.ADD).indexOf(e.target);
    if (index === -1) {
      index = _form.querySelectorAll('.' + CSS.ANSWER + ', .' + CSS.FEEDBACK).indexOf(e.target);
      if (index !== -1) {
        index = Math.floor(index / 2) + 1;
      }
    }
    if (e.target.closest('li')) {
      _answerDefault = e.target.closest('li').querySelector('.' + CSS.FRACTION).getDOMNode().value;
      index = _form.querySelectorAll('li').indexOf(e.target.closest('li')) + 1;
    }
    let tolerance = 0;
    if (e.target.closest('li') && e.target.closest('li').querySelector('.' + CSS.TOLERANCE)) {
      tolerance = e.target.closest('li').querySelector('.' + CSS.TOLERANCE).getDOMNode().value;
    }
    _getFormData();
    _answerdata.splice(index, 0, {
      id: crypto.randomUUID(),
      answer: '',
      feedback: '',
      fraction: _answerDefault,
      tolerance: tolerance
    });
    modal.setBody(_getDialogueContent(e, _qtype));
    _form.querySelectorAll('.' + CSS.ANSWER).item(index).focus();
  };

  /**
   * Delete set of answer blanks before the button.
   *
   * @method _deleteAnswer
   * @param {Event} e Event from button click
   * @private
   */
  const _deleteAnswer = function(e) {
    e.preventDefault();
    let index = _form.querySelectorAll('.' + CSS.DELETE).indexOf(e.target);
    if (index === -1) {
      index = _form.querySelectorAll('li').indexOf(e.target.closest('li'));
    }
    _getFormData();
    _answerdata.splice(index, 1);
    modal.setBody(_getDialogueContent(e, _qtype));
    const answers = _form.querySelectorAll('.' + CSS.ANSWER);
    index = Math.min(index, answers.size() - 1);
    answers.item(index).focus();
  };

  /**
   * Lower answer option
   *
   * @method _lowerAnswer
   * @param {Event} e Event from button click
   * @private
   */
  const _lowerAnswer = function(e) {
    e.preventDefault();
    const li = e.target.closest('li');
    li.insertBefore(li.next(), li);
    li.querySelector('.' + CSS.ANSWER).focus();
  };

  /**
   * Raise answer option
   *
   * @method _raiseAnswer
   * @param {Event} e Event from button click
   * @private
   */
  const _raiseAnswer = function(e) {
    e.preventDefault();
    const li = e.target.closest('li');
    li.insertBefore(li, li.previous());
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
    modal.hide();
  };

  /**
   * Insert content into editor and reset and hide form.
   *
   * @method _setSubquestion
   * @param {Event} e Event from button click
   * @param {tinymce.Editor} editor
   * @private
   */
  const _setSubquestion = function(e, editor) {
    e.preventDefault();
    _getFormData();

    _answerdata.forEach(function(option) {
      option.answer = strencode(option.answer);
      option.feedback = strencode(option.feedback);
    });

    const question = Mustache.render(TEMPLATE.OUTPUT,
        {CSS: CSS,
          answerdata: _answerdata,
          qtype: _qtype,
          marks: _marks
        });

    modal.hide();
    editor.focus();
    editor.setSelection(_currentSelection);

    // Save the selection before inserting the new question.
    let selection = window.rangy.saveSelection();
    editor.insertContent(question);
    //host.insertContentAtFocusPoint(question);

    // Select the inserted text.
    window.rangy.restoreSelection(selection);
  };

  /**
   * Read and process the current data in the form.
   *
   * @method _setSubquestion
   * @chainable
   * @return {Object} self
   * @private
   */
  const _getFormData = function() {
    _answerdata = [];
    let answer;
    const answers = _form.querySelectorAll('.' + CSS.ANSWER);
    const feedbacks = _form.querySelectorAll('.' + CSS.FEEDBACK);
    const fractions = _form.querySelectorAll('.' + CSS.FRACTION);
    const tolerances = _form.querySelectorAll('.' + CSS.TOLERANCE);
    for (let i = 0; i < answers.size(); i++) {
      answer = answers.item(i).getDOMNode().value;
      if (this._qtype === 'NM' || this._qtype === 'NUMERICAL') {
        answer = Number(answer);
      }
      _answerdata.push({answer: answer,
        id: crypto.randomUUID(),
        feedback: feedbacks.item(i).getDOMNode().value,
        fraction: fractions.item(i).getDOMNode().value,
        tolerance: tolerances.item(i) ? tolerances.item(i).getDOMNode().value : 0}
      );
      _marks = _form.querySelector('.' + CSS.MARKS).getDOMNode().value;
    }
  };

  /**
   * Check whether cursor is in a subquestion and return subquestion text if
   * true.
   *
   * @method resolveSubquestion
   * @return {Mixed} The selected innerHTML of the selected node with the subquestion if found, false otherwise.
   */
  const resolveSubquestion = function() {
    let span = false;
    editor.dom.getParents(editor.selection.getStart(), elm => {
      // Are we in a span that encapsulates the cloze question?
      if (!isNull(elm.classList) && elm.classList.contains(markerClass)) {
        span = elm.innerHTML;
      }
    });
    return span;
  };

export {
  displayDialogue,
  resolveSubquestion,
  onInit,
  onProcess,
  onBlur
};

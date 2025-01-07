import * as assert from 'assert';
import * as jsdom from 'jsdom';
import * as cloze from './src/cloze.mjs';


describe('Test function hasClass()', function () {
  describe('create <i class="tiny_cloze_add">+</i>', function () {
    const dom = new jsdom.JSDOM(`<!DOCTYPE html><i class="tiny_cloze_add">+</i>`);
    const n = dom.window.document.querySelector('i');
    it('Check for existing class property ADD of CSS object.', function () {
      assert.equal(cloze.hasClass(n, 'ADD'), true);
    });
    it('Check for missing class property DELETE of CSS object.', function () {
      assert.equal(cloze.hasClass(n, 'DELETE'), false);
    });
  });
});

describe('Test function indexOfNode()', function () {
  describe('create <i>1</i><i>2</i><i>3</i>', function () {
    const dom = new jsdom.JSDOM(`<!DOCTYPE html><i>1</i><i>2</i><i>3</i>`);
    const list = Array.from(dom.window.document.querySelectorAll('i'));
    it('Check for index of <i>2</i>.', function () {
      assert.equal(cloze.indexOfNode(list, list[1]), 1);
    });
    it('Check for index of newly created node.', function () {
      assert.equal(cloze.indexOfNode(list, dom.window.document.createElement('i')), -1);
    });
  });
});

describe('Test function getUuid()', function () {
  const len = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? 36 : 14;
  it(`Check for length ${len}.`, function () {
    assert.equal(cloze.getUuid().length, len);
  });
  it('Check for pattern.', function () {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      assert.match(cloze.getUuid(), /^[0-9a-f]{8}\-([0-9a-f]{4}\-){3}[0-9a-f]{12}$/);
    } else {
      assert.match(cloze.getUuid(), /^ed-cloze-\d{5}$/);
    }
  });

});

'use strict';
/* The convention in the Redux docs is to name your actions in all caps.
   I don't like it, it makes me feel like I'm writing C again. But I would use
   it if I was working with other Redux devs, I guess. */
const Add_child = 'Add_child';
const Start_editing = 'Start_editing';
const Edit = 'Edit';
const Finish_editing = 'Finish_editing';

function addChild(path) {
  return { type: Add_child, path }
}

function startEditing(path) {
  return { type: Start_editing, path }
}

function finishEditing(path, content) {
  return { type: Finish_editing, path, content }
}

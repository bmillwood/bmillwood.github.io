'use strict';

function newNode(initialContent) {
  return {
    nextFreeChild: 0,
    content: initialContent,
    editing: false,
    children: {},
    childrenIds: [],
  };
}

const initialState = newNode("root");

// f is always passed a *fresh* node, so it's OK to mutate it.
function editAt(root, path, f) {
  const newRoot = Object.assign({}, root);
  let node = newRoot;
  for(let i = 0; i < path.length; i++) {
    const ci = path[i];
    node.children = Object.assign({}, node.children);
    node.children[ci] = Object.assign({}, node.children[ci]);
    node = node.children[ci];
  }
  f(node);
  return newRoot;
}

function getAt(root, path) {
  let node = root;
  for(let i = 0; i < path.length; i++) {
    node = node.children[path[i]];
  }
  return node;
}

function addChildAt(root, path) {
  return editAt(root, path, function(node) {
    node.children = Object.assign({}, node.children);
    const newPath = path.concat([node.nextFreeChild]);
    node.children[node.nextFreeChild] = newNode(newPath.toString());
    node.childrenIds = [node.nextFreeChild].concat(node.childrenIds);
    node.nextFreeChild += 1;
  });
}

function editableList(state = initialState, action) {
  switch(action.type) {
    case Add_child:
      return addChildAt(state, action.path);
    case Start_editing:
      return editAt(state, action.path, node => node.editing = true);
    case Finish_editing:
      return editAt(state, action.path, function(node) {
        node.content = action.content;
        node.editing = false;
      });
    default:
      return state;
  }
}

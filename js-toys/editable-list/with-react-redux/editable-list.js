'use strict';
const connect = window.ReactRedux.connect;

const mapStateToProps = (state, { path }) => {
  return {
    editing: getAt(state, path).editing,
    content: getAt(state, path).content,
    children: getAt(state, path).childrenIds.map(i =>
      <EditableListAt path={path.concat([i])} />)
  }
}

const mapDispatchToProps = (dispatch, { path }) => {
  return {
    handleKey: keypress => {
      if(keypress.key == "Enter") {
        dispatch(finishEditing(path, keypress.target.value));
      }
    },
    startEditing: () => dispatch(startEditing(path)),
    addChild: () => dispatch(addChild(path))
  }
}

const EditableListAt = connect(mapStateToProps, mapDispatchToProps)(ELNode);

const createStore = window.Redux.createStore;
const store = createStore(editableList);

const Provider = window.ReactRedux.Provider;

ReactDOM.render(
  <Provider store={store}><EditableListAt path={[]} /></Provider>
  , document.getElementById('reactContainer')
);

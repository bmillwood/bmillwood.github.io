'use strict';
const createStore = window.Redux.createStore;

function ELNode(props) {
  let content;
  if(props.editing) {
    content = (
      <input type="text"
      defaultValue={props.content}
      onKeyPress={props.handleKey}
      onChange={props.handleChange}
      />
    );
  } else {
    content = (
      <span>
      <button className="edit" onClick={props.startEditing}>edit</button>
      <button className="child" onClick={props.addChild}>child</button>
      {props.content}
      </span>
    );
  }
  if(props.children.length == 0) {
    return <div>{content}</div>;
  } else {
    const children = props.children.map(child => <li>{child}</li>);
    return (
      <div>
      {content}
      <ul>
      {children}
      </ul>
      </div>
    );
  }
}

function newNode(initialContent) {
  return {
    nextFreeChild: 0,
    content: initialContent,
    editing: false,
    children: {},
    childrenIds: [],
  };
}

class EditableList extends React.Component {
  constructor(props) {
    super(props);
    const root = newNode('root');
    this.state = { root: root };
  }

  getAt(path) {
    let node = this.state.root;
    for(let i = 0; i < path.length; i++) {
      node = node.children[path[i]];
    }
    return node;
  }

  editAt(path, f) {
    const newRoot = Object.assign({}, this.state.root);
    let node = newRoot;
    for(let i = 0; i < path.length; i++) {
      const ci = path[i];
      node.children = Object.assign({}, node.children);
      node.children[ci] = Object.assign({}, node.children[ci]);
      node = node.children[ci];
    }
    f(node);
    this.setState({root: newRoot});
  }

  addChild(path) {
    this.editAt(path, function(node) {
      node.children = Object.assign({}, node.children);
      const newPath = path.concat([node.nextFreeChild]);
      node.children[node.nextFreeChild] = newNode(newPath.toString());
      node.childrenIds = [node.nextFreeChild].concat(node.childrenIds);
      node.nextFreeChild += 1;
    });
  }

  handleKey(path, key) {
    if(key.key == "Enter") {
      this.editAt(path, node => node.editing = false);
    }
  }

  handleChange(path, change) {
    const value = change.target.value;
    this.editAt(path, node => node.content = value);
  }

  startEditing(path) {
    this.editAt(path, node => node.editing = true);
  }

  elNodeAt(path) {
    const node = this.getAt(path);
    const children = node.childrenIds.map(id => this.elNodeAt(path.concat([id])));
    return (
      <ELNode
      content={node.content}
      editing={node.editing}
      children={children}
      handleKey={key => this.handleKey(path, key)}
      handleChange={change => this.handleChange(path, change)}
      startEditing={() => this.startEditing(path)}
      addChild={() => this.addChild(path)}
      />
    );
  }

  render() {
    return this.elNodeAt([]);
  }
}

ReactDOM.render(<EditableList />, document.getElementById('reactContainer'));

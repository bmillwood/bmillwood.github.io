'use strict';
function ELNode(props) {
  let content;
  if(props.editing) {
    content = (
      <input type="text"
      defaultValue={props.content}
      onKeyPress={props.handleKey}
      />
    );
  } else {
    content = (
      <span>
      <button className="add child" onClick={props.addChild}>child</button>
      <button className="edit" onClick={props.startEditing}>edit</button>
      {" " + props.content}
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

// TODO: ELNode.propTypes

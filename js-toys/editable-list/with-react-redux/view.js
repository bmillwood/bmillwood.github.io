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

// TODO: ELNode.propTypes

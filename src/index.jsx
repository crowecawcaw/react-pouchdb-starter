import React from 'react'
import {render} from 'react-dom'
import PouchDB from 'pouchdb'

import update from 'react-addons-update'

require('file?name=[name].[ext]!./index.html');

class App extends React.Component{
  constructor(props){
    super(props)
    this.state = {docs: []};
    this.db = new PouchDB('db')
    this. onUpdatedOrInserted = this. onUpdatedOrInserted.bind(this);
    this. onDeleted = this. onDeleted.bind(this);
    this. insertRandomDoc = this. insertRandomDoc.bind(this);
    this. updateRandomDoc = this. updateRandomDoc.bind(this);
    this. deleteRandomDoc = this. deleteRandomDoc.bind(this);

  }
  componentWillMount(){
    var _this=this;

    this.db.allDocs({include_docs: true}).then(function (res) {
      _this.setState({
        docs: res.rows.map(function (row) { return row.doc; })
      })

      _this.db.changes({live: true, since: 'now', include_docs: true}).on('change', function (change) {
        if (change.deleted) {
          // change.id holds the deleted id
          _this.onDeleted(change.id);
        } else { // updated/inserted
          // change.doc holds the new doc
          _this.onUpdatedOrInserted(change.doc);
        }
      }).on('error', console.log.bind(console));
    })
  }

 binarySearch(arr, docId) {
  var low = 0, high = arr.length, mid;
  while (low < high) {
    mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
    arr[mid]._id < docId ? low = mid + 1 : high = mid
  }
  return low;
 }

  onDeleted(id) {
    var index = this.binarySearch(this.state.docs, id);
    var doc = this.state.docs[index];
    if (doc && doc._id === id) {
      this.setState({
        docs: update(this.state.docs, {$splice: [[index, 1]]})
      })
    }
  }

  onUpdatedOrInserted(newDoc) {
    var index = this.binarySearch(this.state.docs, newDoc._id);
    var doc = this.state.docs[index];
    if (doc && doc._id === newDoc._id) { // update
      
      this.setState({
        docs: update(this.state.docs, {[index]: {$set: newDoc}})
      })
    } else { // insert
      this.setState({
        docs: update(this.state.docs, {$splice: [[index, 0, newDoc]]})
      })
    }
  }



 insertRandomDoc() {
  this.db.put({_id: Date.now().toString()}).catch(console.log.bind(console));
}

 updateRandomDoc() {
  var _this=this;
   if (!this.state.docs.length) {
    return;
  }
  var randomDoc = this.state.docs[Math.floor(Math.random() * this.state.docs.length)];
  this.db.get(randomDoc._id).then(function (doc) {
    if (!doc.updatedCount) {
      doc.updatedCount = 0;
    }
    doc.updatedCount++;
    return _this.db.put(doc);
  }).catch(console.log.bind(console));
}

 deleteRandomDoc() {
  var _this = this;
   if (!this.state.docs.length) {
    return
  }
  var randomDoc = this.state.docs[Math.floor(Math.random() * this.state.docs.length)]
  this.db.get(randomDoc._id).then(function (doc) {
    return _this.db.remove(doc);
  }).catch(console.log.bind(console));
}


render() {
    var rows=this.state.docs.map(function(row, i){
      return (<p key={i}>{JSON.stringify(row)}</p>)
    })
    return (
      <div>
        Hello
        <button onClick={this.insertRandomDoc}>Insert</button>
        <button onClick={this.updateRandomDoc}>Update</button>
        <button onClick={this.deleteRandomDoc}>Delete</button>
        {rows}
      </div>
    )
  }
}

render(<App/>, document.getElementById('app'));

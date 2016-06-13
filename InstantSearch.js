import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { observable, computed } from 'mobx'
import { observer } from 'mobx-react'
import { zip } from 'ramda'
import Rx from 'rx'
/* actually we don't need rx-dom, if we're using fetch(), however I cannot get CORS right so I use it just for jsonpRequest */
import 'rx-dom'


function searchWiki(text) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(text)}&callback=JSONPCallback`
  return Rx.DOM.jsonpRequest(url).retry(3)
}


const searchState = new class SearchState {
  @observable results = []
  @computed get total() { return this.results.length }

  update(data) {
    this.results = zip(data[1], data[3])
  }
}

@observer
class InstantSearch extends React.Component {
  constructor() {
    super()
    this.input$ = new Rx.Subject()
    this.input$
      .pluck('target', 'value')
      .filter(text => text.length > 2)
      .debounce(500)
      .distinctUntilChanged()
      .flatMapLatest(searchWiki)
      .subscribe(
        data => this.update(data.response)
      )
  }

  update(data) {
    this.props.searchState.update(data)
  }

  render () {
    const state = this.props.searchState;
    return (
      <div>
        <h1>Instant Search (results: {state.total})</h1>
        <input type='text' onKeyUp={e => this.input$.onNext(e)}  />
        <ul>
          {state.results.map(result => <li key={result[1]}><a href={result[1]}>{result[0]}</a></li>)}
        </ul>
      </div>
    )
  }
}


ReactDOM.render(
  <InstantSearch searchState={searchState}/>,
  document.getElementById('app')
)

import React, { Component } from 'react';

import Routes from './Routes';
import Head from './components/layout/Head';
import Foot from './components/layout/Foot';

class App extends Component {
  render() {
    return (
      <div>
        <Head />
        <Routes />
        <Foot />
      </div>
    );
  }
}

export default App;

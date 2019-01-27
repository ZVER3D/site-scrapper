import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Scrapper from './components/Scrapper';

const Routes = () => (
  <Switch>
    <Route path="/" exact />
    <Route path="/scrapper" component={Scrapper} />
  </Switch>
);

export default Routes;
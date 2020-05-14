import React from 'react';
import { HashRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import DependencyGraph from './dependency-graph';

export default () => {
    return (
        <Router>
            <Switch>
                <Route path="/packages/:relations/:pkgs">
                    <DependencyGraph/>
                </Route>
                <Route path="*">
                    <Redirect to="/packages/imports,depends/dplyr,tibble"/>
                </Route>
            </Switch>
        </Router>
    );
};

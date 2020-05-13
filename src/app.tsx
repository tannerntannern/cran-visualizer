import React from 'react';
import { HashRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import DependencyGraph from './dependency-graph';

export default () => {
    return (
        <Router>
            <Switch>
                <Route path="/packages/:pkgs">
                    <DependencyGraph/>
                </Route>
                <Route path="*">
                    <Redirect to="/packages/dplyr,tibble"/>
                </Route>
            </Switch>
        </Router>
    );
};

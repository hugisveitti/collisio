import React, { useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import UserProvider from "./providers/UserProvider";

import TestContainer from "./testMode/TestContainer";

const TestApp = () => {
  return (
    <React.Fragment>
      <UserProvider>
        <Router basename="/test">
          <Switch>
            <Route path="/" component={TestContainer} />
          </Switch>
        </Router>
      </UserProvider>
    </React.Fragment>
  );
};

ReactDOM.render(<TestApp />, document.getElementById("root"));

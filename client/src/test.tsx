import React, { useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import TestContainer from "./testMode/TestContainer";

const TestApp = () => {
  return (
    <React.Fragment>
      <Router basename="/test">
        <Switch>
          <Route path="/" component={TestContainer} />
        </Switch>
      </Router>
    </React.Fragment>
  );
};

ReactDOM.render(<TestApp />, document.getElementById("root"));

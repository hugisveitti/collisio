import React, { useEffect } from "react";
import { startSpeedTest } from "../test-courses/speedTestScene";

interface ISpeedTestContainer {}

const SpeedTestContainer = (props: ISpeedTestContainer) => {
  useEffect(() => {
    startSpeedTest();
  }, []);

  return null;
};

export default SpeedTestContainer;

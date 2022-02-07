import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import React, { useState } from "react";
import { getStyledColors } from "../../providers/theme";

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
};

interface IMyTabs {
  tabs: { label: string; renderElement: () => JSX.Element }[];
  onTabChange?: (newTab: number) => void;
  subtabs?: boolean;
}

const MyTabs = (props: IMyTabs) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const { color, backgroundColor } = getStyledColors("black");

  const handleChange = (
    event: React.SyntheticEvent,
    newSelectedTab: number
  ) => {
    setSelectedTab(newSelectedTab);
    if (props.onTabChange) {
      props.onTabChange(newSelectedTab);
    }
  };

  return (
    <div style={{ color, backgroundColor, padding: 10 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          {props.tabs.map((tab, i) => (
            <Tab
              key={tab.label}
              label={tab.label}
              {...a11yProps(i)}
              style={{ color, fontSize: props.subtabs ? 11 : "inherit" }}
            />
          ))}
        </Tabs>
      </Box>
      {props.tabs.map((t, i) => {
        if (selectedTab === i) {
          return (
            <React.Fragment key={t.label}>{t.renderElement()}</React.Fragment>
          );
        }
        return null;
      })}
    </div>
  );
};

export default MyTabs;

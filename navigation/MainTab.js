import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import PersonalCalendarScreen from "../screens/PersonalCalendar";
import SettingsScreen from "../screens/SettingScreen";
import GroupListScreen from "../screens/GroupListScreen";

import MainTabStyles from "../styles/MainTabStyles";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: MainTabStyles.container,
        tabBarIcon: ({ focused }) => {
          let iconSource;

          if (Route.name === "PersonalCalendar") {
            iconSource = focused
              ? require("../assets/Tab/PersonalCalendarTabbed.png")
              : require("../assets/Tab/PersonalCalendarUnTabbed.png");
          } else if (Route.name === "Settings") {
            iconSource = focused
              ? require("../assets/Tab/SettingsTabbed.png")
              : require("../assets/Tab/SettingUnTabbed.png");
          } else if (Route.name === "GroupList") {
            iconSource = focused
              ? require("../assets/Tab/GroupCalendarTabbed.png")
              : require("../assets/Tab/GroupCalendarUnTabbed.png");
          }

          return <Image source={iconSource} />;
        },
      }}
    >
      <Tab.Screen name="PersonalCalendar" component={PersonalCalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="GroupList" component={GroupListScreen} />
    </Tab.Navigator>
  );
}

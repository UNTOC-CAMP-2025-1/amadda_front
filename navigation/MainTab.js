import React from "react";
import { Image } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import PersonalCalendarScreen from "../screens/PersonalCalendar";
import SettingsScreen from "../screens/SettingScreen";
import GroupListScreen from "../screens/GroupListScreen";

import MainTabStyles from "../styles/MainTabStyles";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: MainTabStyles.container,
        tabBarItemStyle: MainTabStyles.tabBarItem,
        tabBarIconStyle: MainTabStyles.tabBarIcon,
        tabBarIcon: ({ focused }) => {
          let iconSource;

          if (route.name === "PersonalCalendar") {
            iconSource = focused
              ? require("../assets/Tab/PersonalCalendarTabbed.png")
              : require("../assets/Tab/PersonalCalendarUnTabbed.png");
          } else if (route.name === "GroupList") {
            iconSource = focused
              ? require("../assets/Tab/GroupCalendarTabbed.png")
              : require("../assets/Tab/GroupCalendarUnTabbed.png");
          } else if (route.name === "Settings") {
            iconSource = focused
              ? require("../assets/Tab/SettingsTabbed.png")
              : require("../assets/Tab/SettingUnTabbed.png");
          }

          return (
            <Image source={iconSource} style={MainTabStyles.tabBarImage} />
          );
        },
      })}
    >
      <Tab.Screen name="PersonalCalendar" component={PersonalCalendarScreen} />
      <Tab.Screen name="GroupList" component={GroupListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

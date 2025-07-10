import "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";

import LoginScreen from "./screens/LoginScreen";
import FindPwScreen from "./screens/FindPwScreen";
import SignUpScreen from "./screens/SignUpScreen";

import DeluserScreen from "./screens/DeluserScreen";
import MainTab from "./navigation/MainTab";
import ChangePwScreen from "./screens/changePwScreen";
import { AuthProvider } from "./context/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { API_BASE_URL } from "@env";
import RootNavigator from "./RootNavigator";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

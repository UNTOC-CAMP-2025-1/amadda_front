import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import FindPwScreen from "./screens/FindPwScreen";
import SignUpScreen from "./screens/SignUpScreen";
import MainTab from "./navigation/MainTab";
import DeluserScreen from "./screens/DeluserScreen";
import ChangePwScreen from "./screens/changePwScreen";
import { AuthContext } from "./context/AuthContext";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ animation: "none" }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen
            name="LoginScreen"
            options={{ headerShown: false }}
            component={LoginScreen}
          />
          <Stack.Screen
            name="FindPw"
            component={FindPwScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" options={{ headerShown: false }}>
            {() => <MainTab />}
          </Stack.Screen>
          <Stack.Screen
            name="ChangePw"
            component={ChangePwScreen}
            options={{
              title: "비밀번호 변경",
            }}
          />
          <Stack.Screen
            name="Deluser"
            options={{ title: "회원 탈퇴" }}
            component={DeluserScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

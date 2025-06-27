import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Button } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { themeColors, categories, groups } from "../Colors";

import styles from "../styles/LoginScreenStyles";

const LoginScreen = (props) => {
  return (
    <View style={styles.container}>
      <Button title="hi" onPress={props.onLogin} />
    </View>
  );
};

export default LoginScreen;

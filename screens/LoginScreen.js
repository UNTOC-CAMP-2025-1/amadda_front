import React, { useState, useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/LoginScreenStyles";
import { API_BASE_URL } from "@env";
import api from "../api"; // axios 인스턴스 사용

const LoginScreen = ({ onLogin }) => {
  const navigation = useNavigation();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const { setUserInfo, setIsLoggedIn } = useContext(AuthContext);


  const login = async () => {
    const formData = new URLSearchParams();
    formData.append("grant_type", "password"); // 필수
    formData.append("username", id);
    formData.append("password", pw);

    try {
      const response = await api.post(
        "/users/login",
        formData, // 여기 중요
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      const result = response.data; // axios는 자동 JSON 파싱
      console.log("로그인 응답 result:", result);

      if (response.status === 200 && result.access_token) {
        await SecureStore.setItemAsync("accessToken", String(result.access_token));
        await SecureStore.setItemAsync("refreshToken", String(result.refresh_token));

        const protectedRes = await api.get("/users/info");
        const protectedData = protectedRes.data;

        console.log("보호된 유저 데이터:", protectedData);
        setUserInfo(protectedData);
        setIsLoggedIn(true);
      } else {
        console.log("로그인 실패: 응답 비정상 또는 토큰 없음");
        alert("로그인 실패: " + JSON.stringify(result));
      }
    } catch (err) {
      console.error("로그인 요청 실패:", err);
      alert("서버 연결 실패");
    }
  };

  return (
    <View style={styles.fullcontainer}>
      <View style={styles.container_logo}>
        <Image source={require("../assets/Tab/Logo.png")} style={styles.logo} />
        <Text style={styles.logo_name}>Amadda</Text>
      </View>

      <View style={styles.container_login1}>
        <Image
          source={require("../assets/images/personIcon.png")}
          style={styles.Login_idpw}
        />
        <TextInput
          placeholder="ID"
          style={styles.input}
          value={id}
          onChangeText={setId}
          maxLength={20}
        />
      </View>

      <View style={styles.container_login1}>
        <Image
          source={require("../assets/images/Lock.png")}
          style={styles.Login_idpw}
        />
        <TextInput
          placeholder="PW"
          style={styles.input}
          secureTextEntry
          value={pw}
          onChangeText={setPw}
          maxLength={16}
        />
      </View>

      <View style={styles.container_login2}>
        <TouchableOpacity style={styles.Button} onPress={login}>
          <Text style={styles.ButtonText}>로그인</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container_fpw_join}>
        <TouchableOpacity onPress={() => navigation.navigate("FindPw")}>
          <Text style={styles.fpw}>비밀번호를 잊으셨나요?</Text>
        </TouchableOpacity>
        <Text />
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.join}>회원이 아니신가요?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

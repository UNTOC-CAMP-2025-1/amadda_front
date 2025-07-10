import React, { useState, useEffect, useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api";
import { API_BASE_URL } from "@env";
import * as SecureStore from "expo-secure-store";

import styles from "../styles/DeluserScreenStyles";
import { AuthContext } from "../context/AuthContext";

const DeluserScreen = () => {
  const navigation = useNavigation();
  const { setIsLoggedIn } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  useEffect(() => {
    let timerId;

    const checkAndStartTimer = async () => {
      const storedEmail = await AsyncStorage.getItem("emailAddress");
      if (!storedEmail) return;

      try {
        const ttlRes = await api.get("/email/ttl", {
          params: { email: storedEmail },
        },
      {
        headers: { Authorization: undefined }
      });

        if (ttlRes.data.success) {
          const ttl = ttlRes.data.ttl;
          if (ttl <= 0) {
            await expireEmail(storedEmail);
            return;
          }

          // ttl 초 후에 만료 처리
          timerId = setTimeout(async () => {
            await expireEmail(storedEmail);
          }, ttl * 1000);
        }
      } catch (err) {
        console.error("TTL 초기화 오류:", err);
      }
    };

    checkAndStartTimer();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const deluser = async () => {
    Alert.alert(
      "앱 탈퇴",
      "정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "확인",
          style: "destructive",
          onPress: async () => {
            try {

              const response = await api.post("/users/del_user");
              console.log("앱 탈퇴 응답:", response.status, response.data);

              if (response.status === 200){
              // regardless of result, clear tokens
              await SecureStore.deleteItemAsync("accessToken");
              await SecureStore.deleteItemAsync("refreshToken");
              Alert.alert("탈퇴 완료", "회원 탈퇴가 완료되었습니다.");
              setIsLoggedIn(false); // 로그인 상태 해제
              } else {
                Alert.alert("탈퇴 실패", response.data|| "다시 시도해주세요.");
                return;
              }
              // navigation.reset({
              //   index: 0,
              //   routes: [{ name: "LoginScreen" }], // LoginScreen으로 이동
              // });
            } catch (error) {
              console.error("탈퇴 네트워크 오류:", error);
              Alert.alert("오류", "서버에 연결할 수 없습니다.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.changePWmainContainer}>
      {/* 로고
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/Lock.png")}
          style={styles.lockLogoImage}
        />
        <Text style={styles.logoText}>비밀번호 변경</Text>
      </View> */}

      {/* 입력 영역 */}
      <View style={styles.inputsWrapper}>
        {/* 이메일 */}
        <View style={styles.inputRow}>
          <Image
            source={require("../assets/images/personIcon.png")}
            style={styles.personIcon}
          />
          <ImageBackground
            source={require("../assets/images/emailInput.png")}
            style={styles.inputBackground}
            imageStyle={styles.inputBackgroundImage}
          >
            <TextInput
              placeholder="이메일"
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              maxLength={20}
            />
          </ImageBackground>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              if (!email) {
                alert("이메일을 입력해주세요.");
                return;
              }
              try {
                const res = await api.post(
                  "/email/request",
                  { email },
                );

                // 상태 코드가 200이면 성공 처리
                if (res.status === 200) {
                  Alert.alert("메일 발송 완료", "인증 메일이 발송되었습니다.");
                  const sendTime = Date.now();
                  await AsyncStorage.multiSet([
                    ["emailSendTime", sendTime.toString()],
                    ["emailAddress", email],
                  ]);
                } else {
                  alert("예상치 못한 응답이 왔습니다.");
                }
              } catch (err) {
                if (err.response?.status === 422) {
                  alert("잘못된 이메일 형식입니다.");
                } else {
                  console.error("서버 응답 상태:", err.response?.status);
                  console.error("서버 응답 데이터:", err.response?.data);
                  alert("서버 오류가 발생했습니다.");
                }
              }
            }}
          >
            <Text style={styles.actionButtonText}>메일 발송</Text>
          </TouchableOpacity>
        </View>

        {/* 인증 코드 */}
        <View style={styles.inputRow}>
          <Image
            source={require("../assets/images/checkPersonIcon.png")}
            style={styles.personIcon}
          />
          <ImageBackground
            source={require("../assets/images/codeInput.png")}
            style={styles.inputBackground}
            imageStyle={styles.inputBackgroundImage}
          >
            <TextInput
              placeholder="인증 코드"
              style={styles.textInput}
              value={code}
              onChangeText={setCode}
              editable={!codeVerified}
              maxLength={6}
            />
          </ImageBackground>
          {codeVerified ? (
            <Image
              source={require("../assets/images/checkBoxIcon.png")}
              style={styles.inputIconRight}
            />
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={async () => {
                if (!email || !code) {
                  alert("이메일과 인증 코드를 입력해주세요.");
                  return;
                }
                try {
                  const res = await api.post(
                    "/email/verify",
                    { email, code },
                  );
                  if (res.status === 200) {
                    setCodeVerified(true);
                    Alert.alert("인증 완료", "인증이 완료되었습니다.");
                  } else {
                    // 혹시 다른 2xx 상태가 있을 경우 대비
                    alert("예상치 못한 응답이 왔습니다.");
                  }
                } catch (err) {
                  // 상태 코드로 분기
                  if (err.response?.status === 409) {
                    setCodeVerified(true);
                    alert("이미 인증된 이메일입니다.");
                  } else if (err.response?.status === 422) {
                    alert("인증 코드가 올바르지 않습니다.");
                  } else if (err.response?.status === 400) {
                    alert("인증 코드가 일치하지 않습니다.");
                  } else {
                    console.error("서버 응답 상태:", err.response?.status);
                    console.error("서버 응답 데이터:", err.response?.data);
                    alert("서버 오류가 발생했습니다.");
                  }
                }
              }}
            >
              <Text style={styles.actionButtonText}>확인</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonPart}>
          {/* 회원가입 버튼 */}
          <TouchableOpacity style={styles.delButton} onPress={deluser}>
            <Text style={styles.joinButtonText}>탈퇴</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default DeluserScreen;

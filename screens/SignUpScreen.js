import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from "react-native";
import styles from "../styles/SignUpScreenStyles";
import api from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@env";

const SignUpScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let timerId;

    const checkAndStartTimer = async () => {
      const storedEmail = await AsyncStorage.getItem("emailAddress");
      if (!storedEmail) return;

      try {
        const ttlRes = await api.get(`${API_BASE_URL}/email/ttl`, {
          params: { email: storedEmail },
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

  return (
    <View style={styles.mainContainer}>
      {/* 로고 */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/Tab/Logo.png")}
          style={styles.logoImage}
        />
        <Text style={styles.logoText}>Amadda</Text>
      </View>

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
                  `${API_BASE_URL}/email/request`,
                  { email },
                  {
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
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
                    `${API_BASE_URL}/email/verify`,
                    { email, code },
                    {
                      headers: {
                        "Content-Type": "application/json",
                      },
                    }
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

        {/* 계정 이름 */}
        <View style={styles.inputRow}>
          <Image
            source={require("../assets/images/personIcon.png")}
            style={styles.personIcon}
          />
          <ImageBackground
            source={require("../assets/images/nameInput.png")}
            style={styles.inputBackground}
            imageStyle={styles.inputBackgroundImage}
          >
            <TextInput
              placeholder="계정 이름"
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              maxLength={9}
            />
          </ImageBackground>
        </View>

        {/* 비밀번호 */}
        <View style={styles.inputRow}>
          <Image
            source={require("../assets/images/Lock.png")}
            style={styles.lockIcon}
          />
          <ImageBackground
            source={require("../assets/images/PWInput.png")}
            style={styles.inputBackground}
            imageStyle={styles.inputBackgroundImage}
          >
            <TextInput
              placeholder="비밀번호"
              secureTextEntry
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              maxLength={16}
            />
          </ImageBackground>
        </View>

        {/* 비밀번호 확인 */}
        <View style={styles.inputRow}>
          <Image
            source={require("../assets/images/Lock.png")}
            style={styles.lockIcon}
          />
          <ImageBackground
            source={require("../assets/images/codeInput.png")}
            style={styles.inputBackground}
            imageStyle={styles.inputBackgroundImage}
          >
            <TextInput
              placeholder="비밀번호 확인"
              secureTextEntry
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              maxLength={16}
            />
          </ImageBackground>
          <Image
            source={
              confirmPassword !== "" &&
              password !== "" &&
              password === confirmPassword
                ? require("../assets/images/checkBoxIcon.png")
                : require("../assets/images/checkBoxOutlineIcon.png")
            }
            style={styles.inputIconRight}
          />
        </View>
        {/* 회원가입 버튼 */}
        <View style={styles.buttonPart}>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={async () => {
              if (!email || !username || !password || !confirmPassword) {
                alert("모든 항목을 입력해주세요.");
                return;
              }
              if (password !== confirmPassword) {
                alert("비밀번호가 일치하지 않습니다.");
                return;
              }
              if (!codeVerified) {
                alert("이메일 인증을 완료해주세요.");
                return;
              }
              try {
                const res = await api.post(
                  `${API_BASE_URL}/users/register`,
                  {
                    name: username,
                    email,
                    password,
                  },
                  {
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );
                Alert.alert("회원가입 성공", "회원가입이 완료되었습니다.", {
                  cancelable: false,
                });
                navigation.navigate("LoginScreen");
              } catch (err) {
                console.error(err);
                alert("서버 오류가 발생했습니다.");
              }
            }}
          >
            <Text style={styles.joinButtonText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 하단 링크 */}
      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => navigation.navigate("FindPw")}>
          <Text style={styles.footerLinkText}>비밀번호를 잊으셨나요?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
          <Text style={styles.footerLinkText}>로그인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUpScreen;

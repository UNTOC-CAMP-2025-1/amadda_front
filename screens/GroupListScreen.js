import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  FlatList,
  ImageBackground,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import Swipeable from "react-native-gesture-handler/Swipeable";
import api from "../api";

import * as SecureStore from "expo-secure-store";
import styles from "../styles/GroupListScreenStyles";
import Header from "../components/header";
import { groups } from "../Colors";
import { AuthContext } from "../context/AuthContext";

const GroupListScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState("create"); // "create" or "join"
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  //const [groupCode, setGroupCode] = useState(generateRandomCode());
  const [groupPassword, setGroupPassword] = useState("");
  const [groupList, setGroupList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const openModal = () => {
    //setGroupCode(generateRandomCode());
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setGroupName("");
    setGroupCode("");
    setGroupPassword("");
  };

  const ensureValidAccessToken = async () => {
    try {
      // 1. 유효성 검사
      await api.get("/users/verify_token");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // 2. 만료됐으면 새로 발급
        console.log("Access Token 만료, 새로 발급 요청");
        try {
          const refreshResponse = await api.post("users/refresh_token");
          const newAccessToken = refreshResponse.data.accessToken;
          await SecureStore.setItemAsync("accessToken", newAccessToken);
          console.log("Access Token 재발급 완료");
        } catch (refreshError) {
          console.error("토큰 재발급 실패:", refreshError);
          throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
        }
      } else {
        throw error;
      }
    }
  };


  const handleCreateGroup = async () => {
    if (groupName.trim() === "") {
      Alert.alert("그룹명 미입력", "그룹 이름을 입력해주세요.", [{ text: "확인" }]);
      return;
    }
    if (groupPassword.trim() === "") {
      Alert.alert("비밀번호 미입력", "비밀번호를 입력해주세요.", [{ text: "확인" }]);
      return;
    }

    console.log("보내는 데이터:", {
      name: groupName,
      password: groupPassword,
      group_color: "group10"
    });

    try {
      const response = await api.post("/group/create_group", {
        name: groupName,
        password: groupPassword,
        group_color: "group10",
      });

      // 응답 예시: { code: "QWE789" }
      const newCode = response.data.code;

      const newGroup = {
        name: groupName,
        creator: userInfo?.name,
        code: newCode,
        password: groupPassword,
        colorKey: "group10",
      };
      const updatedGroups = [...groupList, newGroup];
      setGroupList(updatedGroups);
      closeModal();
    } catch (error) {
      console.error("그룹 생성 실패:", error);
      console.error("그룹 생성 실패:", error.response.data);
      Alert.alert("에러", "그룹 생성에 실패했습니다.");
    }
  };

  const handleJoinGroup = async () => {
    if (groupCode.trim() === "" || groupPassword.trim() === "") {
      Alert.alert("입력 필요", "코드와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const response = await api.post(
        "/group/register",
        {
          code: groupCode,
          password: groupPassword,
        },
      );

      // 성공 처리
      await loadGroups();
      closeModal();
    } catch (error) {
      console.error("그룹 참가 실패:", error);

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail || "";

        if (status === 404) {
          Alert.alert("오류", "존재하지 않는 그룹 코드입니다.");
          return;
        }
        if (status === 401 && error.includes("비밀번호")) {
          Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
          return;
        }
        if (status === 401 && detail.includes("이미")) {
          Alert.alert("오류", "이미 그룹에 참가해 있습니다.");
          return;
        }

        Alert.alert("에러", "그룹 참가에 실패했습니다.");
      } else if (error.request) {
        console.error("요청은 갔는데 응답이 없음:", error.request);
        Alert.alert("네트워크 에러", "서버로부터 응답이 없습니다.");
      } else {
        console.error("Axios 설정 중 문제:", error.message);
        Alert.alert("에러", "요청을 보내는 중 오류가 발생했습니다.");
      }
    }
  };

  const loadGroups = async () => {
    try {
      const infoResponse = await api.get("/users/info");
      const myGroupCodes = infoResponse.data.groups || [];

      if (myGroupCodes.length === 0) {
        setGroupList([]);
        return;
      }

      const detailedGroups = await Promise.all(
        myGroupCodes.map(async (g) => {
          const detailResponse = await api.get("/group/search_group", {
            params: { code: g.code },
          });
          const groupData = detailResponse.data;

          return {
            name: groupData.name,
            creator: groupData.created_at,
            code: groupData.code || g.code,
            colorKey: groupData.group_color
          };
        })
      );

      setGroupList(detailedGroups);
    } catch (error) {
      console.error("그룹 리스트 불러오기 실패:", error.response?.data || error.message);
      Alert.alert("에러", "그룹 리스트를 불러오지 못했습니다.");
    }
  };


  const renderRightActions = (group) => {
    return (
      <TouchableOpacity
        style={styles.leaveButton}
        onPress={() => handleLeaveGroup(group)}
      >
        <Text style={styles.leaveButtonText}>나가기</Text>
      </TouchableOpacity>
    );
  };

  const handleLeaveGroup = async (group) => {
    try {
      // 1. 유효성 검사 + 토큰 재발급
      await ensureValidAccessToken();

      // 2. 최신 토큰 꺼내오기
      const token = await SecureStore.getItemAsync("accessToken");

      // 3. 권한 확인 요청
      const authResponse = await api.get("/group/my_auth", {
        params: { code: group.code },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const auth = authResponse.data;
      console.log("권한 상태:", auth);
      if (auth === 0) {
        // 그룹 생성자인 경우 그룹 삭제 로직
        Alert.alert(
          "그룹 삭제",
          `"${group.name}" 그룹의 생성자입니다.\n이 그룹을 삭제하려면 확인 버튼을 누르세요.`,
          [
            { text: "취소", style: "cancel" },
            {
              text: "확인",
              style: "destructive",
              onPress: () => {
                Alert.prompt(
                  "그룹 이름 확인",
                  `그룹 이름을 정확히 입력하면 삭제됩니다.`,
                  [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: async (inputText) => {
                        if (inputText.trim() !== group.name) {
                          Alert.alert("오류", "입력한 이름이 그룹 이름과 일치하지 않습니다.");
                          return;
                        }
                        try {
                          const response = await api.post("/group/del_group", {
                            code: group.code,
                          });
                          if (response.status === 200) {
                            await loadGroups();
                            Alert.alert("완료", `"${group.name}" 그룹이 삭제되었습니다.`);
                          } else {
                            Alert.alert("에러", "그룹 삭제에 실패했습니다.");
                          }
                        } catch (error) {
                          console.error("그룹 삭제 실패:", error.response.data);
                          Alert.alert("에러", "그룹 삭제 중 오류가 발생했습니다.");
                        }
                      },
                    },
                  ],
                  "plain-text"
                );
              },
            },
          ]
        );
      } else {
            // detail에 따라 판단 가능 (원하면 조건 추가 가능)
          Alert.alert(
            "그룹 나가기",
            `"${group.name}" 그룹을 나가시겠습니까?`,
            [
              { text: "취소", style: "cancel" },
              {
                text: "나가기",
                style: "destructive",
                onPress: async () => {
                  try {
                    const response = await api.post("/group/out_group", {
                      code: group.code,
                    });
                    if (response.status === 200) {
                      await loadGroups();
                      Alert.alert("완료", `"${group.name}" 그룹에서 나갔습니다.`);
                    } else {
                      Alert.alert("에러", "그룹 나가기 실패");
                    }
                  } catch (error) {
                    console.error("그룹 나가기 실패:", error.response.data);
                    Alert.alert("에러", "그룹 나가기에 실패했습니다.");
                  }
                },
              },
            ]
          );
      }
    } catch(error) {
    // 여기로 들어오면 권한이 없다는 뜻임
    console.error("권한 확인 실패:", error.response?.data || error.message);
  }
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* 리스트 헤더 */}
      <View style={styles.topBar}>
        <Text style={styles.headText}>그룹</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
          {isSearchVisible && (
            <View style={{ width: "60%" }}>
              <TextInput
                placeholder="검색"
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
                maxLength={9}
              />
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => setIsSearchVisible(!isSearchVisible)}
              style={styles.addButton}
            >
              <Image
                source={require("../assets/images/searchIcon.png")}
                style={styles.searchIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={openModal} style={styles.addButton}>
              <Text style={styles.addButtonText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 모달 */}
     <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            {/* 탭 */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedTab === "create" && styles.tabSelected,
                ]}
                onPress={() => setSelectedTab("create")}
              >
                <Text style={[styles.tabText,
                  selectedTab === "create" && styles.tabTextSelected
                ]}>그룹 생성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedTab === "join" && styles.tabSelected,
                ]}
                onPress={() => setSelectedTab("join")}
              >
                <Text style={[styles.tabText,
                  selectedTab === "join" && styles.tabTextSelected
                ]}>그룹 참가</Text>
              </TouchableOpacity>
            </View>
            {/* 내용 */}
            {selectedTab === "create" ? (
              <View>
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>그룹명</Text>
                <ImageBackground
                  source={require("../assets/images/inputBox.png")}
                  style={styles.inputBackground}
                  imageStyle={{ borderRadius: 7 }}
                  >
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  style={styles.input}
                  maxLength={10}
                />
                </ImageBackground>
                </View>
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>그룹 비밀번호</Text>
                <ImageBackground
                  source={require("../assets/images/inputBox.png")}
                  style={styles.inputBackground}
                  imageStyle={{ borderRadius: 7 }}
                  >
                <TextInput
                  value={groupPassword}
                  onChangeText={setGroupPassword}
                  style={styles.input}
                  maxLength={10}
                />
                </ImageBackground>
                </View>
                {/*<View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>그룹 코드</Text>
                <ImageBackground
                  source={require("../assets/images/inputBox.png")}
                  style={styles.inputBackground}
                  imageStyle={{ borderRadius: 7 }}
                  >
                <TextInput
                  value={groupCode}
                  editable={false}
                  style={styles.input}
                />
                <TouchableOpacity onPress={handleCopyCode}>
                  <ImageBackground source={require("../assets/images/Copy.png")} style={styles.copyIcon} />
                </TouchableOpacity>
                </ImageBackground>
                </View>
                */}
                <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCreateGroup}
                >
                  <Text style={styles.actionButtonText}>생성</Text>
                </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>그룹 코드</Text>
                <ImageBackground
                  source={require("../assets/images/inputBox.png")}
                  style={styles.inputBackground}
                  imageStyle={{ borderRadius: 7 }}
                  >
                <TextInput
                  onChangeText={setGroupCode}
                  style={styles.input}
                  maxLength={6}
                />
                </ImageBackground>
                </View>
                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>그룹 비밀번호</Text>
                <ImageBackground
                  source={require("../assets/images/inputBox.png")}
                  style={styles.inputBackground}
                  imageStyle={{ borderRadius: 7 }}
                  >
                <TextInput
                  value={groupPassword}
                  onChangeText={setGroupPassword}
                  style={styles.input}
                  maxLength={10}
                />
                </ImageBackground>
                </View>
                <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleJoinGroup}
                >
                  <Text style={styles.actionButtonText}>참가</Text>
                </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
      <FlatList
        data={groupList.filter(
          (item) =>
            item.name.toLowerCase().includes(searchText.toLowerCase()) ||
            item.creator.toLowerCase().includes(searchText.toLowerCase())
        )}
        keyExtractor={(item, index) => item.code || index.toString()}
        renderItem={({ item }) => {
          const colorTheme = groups[item.colorKey] || groups["group1"];
          return (
            <Swipeable renderRightActions={() => renderRightActions(item)}>
            <TouchableOpacity style={styles.groupItem}>
              <View 
                style={[styles.groupIconContainer, 
                { backgroundColor: colorTheme.checkbox }]}>
                  <Image
                    source={require("../assets/images/groupIcon.png")}
                    style={styles.groupIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: colorTheme.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.groupCreator, { color: colorTheme.text }]}>
                    {item.creator}
                  </Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
      />
    </View>
  );
};

export default GroupListScreen;

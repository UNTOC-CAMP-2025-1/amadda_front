import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";

import styles from "../styles/GroupScreenStyles";
import { themeColors, groups } from "../Colors";
import Header from "../components/header";
import api from "../api";
import Calendar from "../components/calendar";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";

const GroupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { group } = route.params; // group.code 존재

  const [isPermissionModalVisible, setIsPermissionModalVisible] =
    useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState("그룹원");
  const [groupPassword, setGroupPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState(group.name);

  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [memberListModalVisible, setMemberListModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [selectedColorKey, setSelectedColorKey] = useState("group1");
  const [myRole, setMyRole] = useState(); // 내 권한 ( 0/1/2 )
  const [members, setMembers] = useState([]);

  const [groupUUID, setGroupUUID] = useState("");
  const [todos, setTodos] = useState({});

  const openMenuModal = () => {
    // 다른 모달 닫기
    setMemberListModalVisible(false);
    setAddMemberModalVisible(false);
    setColorModalVisible(false);
    setIsPermissionModalVisible(false);

    // 메뉴 모달 열기
    setMenuModalVisible(true);
  };

  const closeMenuModal = () => setMenuModalVisible(false);

  const fetchAuth = async () => {
    try {
      const res = await api.get("/group/my_auth", {
        params: { code: group.code },
      });
      setMyRole(res.data);
    } catch (err) {
      console.error("권한 확인 실패:", err);
    }
  };

  const fetchGroupPassword = async () => {
    try {
      const res = await api.get("/group/group_pass", {
        params: { code: group.code },
      });
      setGroupPassword(res.data.password); // 서버에서 받아온 평문 비밀번호
      console.log(res.data);
    } catch (err) {
      console.error("그룹 비밀번호 가져오기 실패:", err);
      console.error("그룹 비밀번호 가져오기 실패:", err.data);
      console.error("그룹 비밀번호 가져오기 실패:", err.status);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get("/group/group_members", {
        params: { code: group.code },
      });

      const sorted = res.data.sort((a, b) => {
        if (a.auth !== b.auth) return a.auth - b.auth;
        return a.name.localeCompare(b.name, "ko");
      });
      setMembers(sorted);
    } catch (err) {
      console.error("그룹 멤버 조회 실패:", err);
    }
  };

  const handleSavePermission = async () => {
    if (!selectedMember) return;
    const roleInt = selectedRole === "관리자" ? 1 : 2;

    try {
      await api.post("/group/update_auth", {
        code: group.code,
        uuid: selectedMember.uuid,
        auth: roleInt,
      });
      console.log("권한 변경 완료");
      fetchMembers();
      setIsPermissionModalVisible(false);
    } catch (err) {
      console.error("권한 변경 실패:", err);
    }
  };

  const canEditPermission = () => {
    if (!selectedMember) return false;
    if (selectedMember.auth === 0) return false;
    if (myRole === 0) return true;
    if (myRole === 1 && selectedMember.auth === 2) return true;
    return false;
  };

  const saveGroupName = async () => {
    const trimmedName = groupNameInput.trim();
    console.log("최종 전송 그룹 이름:", trimmedName);

    if (trimmedName === "") {
      Alert.alert("이름 입력 오류", "그룹 이름을 입력해주세요.");
      setIsEditingGroupName(false);
      setGroupNameInput(group.name);
      return;
    }

    try {
      // 요청 보내기
      await api.post("/group/change_info", {
        name: trimmedName,
        password: groupPassword,
        group_color: group.colorKey,
      });

      Alert.alert("변경 완료", "그룹 이름이 변경되었습니다.");
      setIsEditingGroupName(false);
      // 여기서 group.name을 업데이트하고 싶다면 navigation.goBack() 후 다시 진입하는 게 안전
    } catch (error) {
      if (error.response) {
        console.error("서버 응답 오류:", error.response.data);
        console.error("서버 응답 오류:", error.status);
        console.error("서버 응답 오류:", error.response);
        Alert.alert(
          "업데이트 실패",
          error.response.data?.detail || "그룹 이름 변경 실패"
        );
      } else {
        console.error("네트워크 오류:", error);
        Alert.alert("오류", "서버에 연결할 수 없습니다.");
      }
      setIsEditingGroupName(false);
      setGroupNameInput(group.name);
    }
  };

  const handleLeaveGroup = async (group) => {
    if (myRole === 0) {
      // 그룹장일 경우 그룹 삭제
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
                        Alert.alert(
                          "오류",
                          "입력한 이름이 그룹 이름과 일치하지 않습니다."
                        );
                        return;
                      }
                      try {
                        const response = await api.post("/group/del_group", {
                          code: group.code,
                        });
                        if (response.status === 200) {
                          Alert.alert(
                            "완료",
                            `"${group.name}" 그룹이 삭제되었습니다.`
                          );
                          navigation.navigate("GroupListScreen", {
                            refresh: true,
                          });
                        } else {
                          Alert.alert("에러", "그룹 삭제에 실패했습니다.");
                        }
                      } catch (error) {
                        console.error(
                          "그룹 삭제 실패:",
                          error.response?.data || error.message
                        );
                        Alert.alert(
                          "에러",
                          "그룹 삭제 중 오류가 발생했습니다."
                        );
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
      // 그룹원/관리자일 경우 그룹 나가기
      Alert.alert("그룹 나가기", `"${group.name}" 그룹을 나가시겠습니까?`, [
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
                Alert.alert("완료", `"${group.name}" 그룹에서 나갔습니다.`);
                navigation.navigate("GroupListScreen", { refresh: true });
              } else {
                Alert.alert("에러", "그룹 나가기에 실패했습니다.");
              }
            } catch (error) {
              console.error(
                "그룹 나가기 실패:",
                error.response?.data || error.message
              );
              Alert.alert("에러", "그룹 나가기에 실패했습니다.");
            }
          },
        },
      ]);
    }
  };

  const handleCopyGroupInfo = () => {
    const textToCopy = `그룹 코드: ${group.code}\n그룹 비밀번호: ${groupPassword}`;
    Clipboard.setStringAsync(textToCopy);
    Alert.alert("복사 완료", "그룹 정보가 클립보드에 복사되었습니다.");
  };

  // 캘린더 핸들러 시작

  const getCategoryTag = () => {
    const colorNum = group.colorKey.replace("group", "");
    return `${group.name}-${colorNum}`;
  };

  const handleAddTodo = async (newTodo) => {
    try {
      // 1, 새 일정 post
      const response = await api.post("/plan/push_plan", {
        name: newTodo.name,
        category: getCategoryTag(),
        date: newTodo.date,
        create_at: group.code,
      });

      Alert.alert("그룹 일정 추가 성공", "일정을 추가했습니다!");

      // 2, 렌더할 새 일정 추가
      const addedTodo = {
        uuid: response.data.uuid,
        name: response.data.name,
        category: response.data.category,
        isActive: !response.data.is_active,
        isGroup: true,
      };

      // 4, 새 일정 렌더
      setTodos((prev) => {
        const dateKey = response.data.date.split("T")[0];
        const updated = { ...prev };
        if (!updated[dateKey]) updated[dateKey] = [];
        updated[dateKey].push(addedTodo);

        return updated;
      });
    } catch (err) {
      console.log("그룹 일정 추가 실패", err.response);
    }
  };

  const handleDeleteTodo = async (uuid, dateKey) => {
    try {
      const response = await api.post("/plan/del_group_plan", {
        code: group.code,
        uuid: uuid,
      });

      Alert.alert("그룹 일정 삭제", "그룹 일정 삭제 완료!");
    } catch (err) {
      console.log("그룹 플랜 삭제 실패", err.response);
      Alert.alert("그룹 일정 삭제", "그룹 일정 삭제 실패\n다시 시도해주세요");
      return;
    }

    // 삭제 성공한 경우에만 state 업데이트
    setTodos((prev) => {
      const filtered = prev[dateKey].filter((item) => item.uuid !== uuid);
      return {
        ...prev,
        [dateKey]: filtered,
      };
    });
  };

  // 기본 State 초기화
  useEffect(() => {
    fetchAuth();
    fetchMembers();
    fetchGroupPassword();
  }, []);

  // 기본 setTodos 호출
  useEffect(() => {
    const loadAllGroupPlan = async () => {
      try {
        const tempTodos = {};

        const groupRes = await api.get("/plan/group_plans", {
          params: {
            code: group.code,
          },
          headers: {
            Authorization: `Bearer ${groupUUID}`,
          },
        });
        // console.log("그룹 플랜 요청", groupRes);
        const groupTodos = groupRes.data;

        groupTodos.forEach((todo) => {
          const dateKey = todo.date.split("T")[0];
          if (!tempTodos[dateKey]) {
            tempTodos[dateKey] = [];
          }

          tempTodos[dateKey].push({
            uuid: todo.uuid,
            name: todo.name,
            category: todo.category,
            isActive: !todo.is_active,
            isGroup: true,
          });
        });

        setTodos(tempTodos);
        // console.log("퍼스널", tempTodos); // 테스트
      } catch (error) {
        console.log("그룹 플랜 업데이트 실패", error);
      }
    };
    loadAllGroupPlan();
  }, []);

  useEffect(() => {
    if (members.length > 0 && !groupUUID) {
      const leader = members.find((member) => member.auth === 0);
      if (leader) {
        setGroupUUID(leader.uuid);
        // console.log("그룹장의 UUID:", leader.uuid);
      }
    }
  }, [members]);

  return (
    <View style={styles.container}>
      <Header />

      {/* 상단 헤더 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Image
            source={require("../assets/images/backArrow.png")}
            style={styles.iconImage}
          />
        </TouchableOpacity>

        <Text style={styles.headText}>{group.name}</Text>

        <TouchableOpacity onPress={openMenuModal} style={styles.iconButton}>
          <Image
            source={require("../assets/images/menuIcon.png")}
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

      <Calendar
        todoData={todos}
        onAddTodo={handleAddTodo}
        onDeleteTodo={handleDeleteTodo}
        onToggleTodo={() => {}}
        permission={myRole}
        personal={false}
      />

      {/* 메뉴 모달 */}
      {menuModalVisible && (
        <TouchableWithoutFeedback onPress={closeMenuModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuModalContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuModalVisible(false);
                    setMemberListModalVisible(true);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={require("../assets/images/groupIcon.png")}
                      style={styles.icon}
                    />
                    <Text style={styles.menuItemText}>그룹원 목록</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuModalVisible(false);
                    setAddMemberModalVisible(true);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={require("../assets/images/infoIcon.png")}
                      style={styles.infoIcon}
                    />
                    <Text style={styles.menuItemText}>그룹 정보</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuModalVisible(false);
                    setColorModalVisible(true);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={require("../assets/images/penIcon.png")}
                      style={styles.icon}
                    />
                    <Text style={styles.menuItemText}>그룹색 변경</Text>
                  </View>
                </TouchableOpacity>
                {myRole !== undefined && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuModalVisible(false);
                      handleLeaveGroup(group);
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Image
                        source={
                          myRole === 0
                            ? require("../assets/images/trashIcon.png")
                            : require("../assets/images/logoutIcon.png")
                        }
                        style={styles.trashIcon}
                      />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: themeColors.sunday },
                        ]}
                      >
                        {myRole === 0 ? "그룹 삭제" : "그룹 나가기"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* 그룹원 목록 모달 */}
      {memberListModalVisible && (
        <TouchableWithoutFeedback
          onPress={() => setMemberListModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuModalContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderBottomColor: themeColors.text,
                    borderBottomWidth: 1.5,
                  }}
                >
                  <Image
                    source={require("../assets/images/groupIcon.png")}
                    style={styles.icon}
                  />
                  <Text style={styles.menuItemText}>그룹원 목록</Text>
                </View>
                <ScrollView style={{ maxHeight: 300 }}>
                  {members.map((member) => {
                    const icon =
                      member.auth === 0
                        ? require("../assets/images/startIcon.png")
                        : member.auth === 1
                        ? require("../assets/images/shieldIcon.png")
                        : require("../assets/images/authPersonIcon.png");

                    return (
                      <TouchableOpacity
                        key={member.uuid}
                        style={styles.menuItem}
                        onPress={() => {
                          setSelectedMember(member);
                          setSelectedRole(
                            member.auth === 0
                              ? "그룹장"
                              : member.auth === 1
                              ? "관리자"
                              : "그룹원"
                          );
                          setIsPermissionModalVisible(true);
                        }}
                      >
                        <Image source={icon} style={styles.subIcon} />
                        <Text style={styles.itemText}>{member.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* 권한 설정 모달 */}
      <Modal
        visible={isPermissionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPermissionModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setIsPermissionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.authModalHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={
                        selectedMember?.auth === 0
                          ? require("../assets/images/startIcon.png")
                          : selectedMember?.auth === 1
                          ? require("../assets/images/shieldIcon.png")
                          : require("../assets/images/authPersonIcon.png")
                      }
                      style={[styles.subIcon, { marginRight: 6 }]}
                    />
                    <Text style={[styles.inputLabel, { fontSize: 20 }]}>
                      {selectedMember?.name}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    borderBottomColor: themeColors.highlight,
                    borderBottomWidth: 1,
                    marginVertical: 10,
                  }}
                />
                <Text style={styles.infoLabel}>그룹 권한</Text>
                {canEditPermission() ? (
                  <View style={styles.inputBackground}>
                    <Picker
                      selectedValue={selectedRole}
                      onValueChange={(value) => setSelectedRole(value)}
                      style={{ flex: 1, color: themeColors.highlight }}
                      dropdownIconColor={themeColors.highlight}
                    >
                      <Picker.Item label="그룹원" value="그룹원" />
                      <Picker.Item label="관리자" value="관리자" />
                    </Picker>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.infoInputRow,
                      { justifyContent: "center", paddingHorizontal: 10 },
                    ]}
                  >
                    <Text
                      style={{ color: themeColors.highlight, fontSize: 16 }}
                    >
                      {selectedMember?.auth === 0
                        ? "그룹장"
                        : selectedMember?.auth === 1
                        ? "관리자"
                        : "그룹원"}
                    </Text>
                  </View>
                )}
                <View style={styles.buttonContainer}>
                  {canEditPermission() && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleSavePermission}
                    >
                      <Text style={styles.actionButtonText}>저장</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 그룹 정보 모달 */}
      <Modal
        visible={addMemberModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setAddMemberModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.groupInfoModal}>
                <View
                  style={{
                    borderBottomColor: themeColors.text,
                    borderBottomWidth: 2,
                  }}
                >
                  <Text
                    style={[
                      styles.inputLabel,
                      { fontSize: 18, marginBottom: 12 },
                    ]}
                  >
                    그룹 정보
                  </Text>
                </View>
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>그룹 이름</Text>
                  <View style={styles.infoInputRow}>
                    {isEditingGroupName ? (
                      <TextInput
                        placeholder={group.name}
                        value={groupNameInput}
                        onChangeText={setGroupNameInput}
                        onBlur={saveGroupName}
                        autoFocus
                        style={styles.infoText}
                        maxLength={20}
                      />
                    ) : (
                      <>
                        <Text style={styles.infoText}>{groupNameInput}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setGroupNameInput(""); // SettingScreen처럼 초기화
                            setIsEditingGroupName(true);
                          }}
                        >
                          <Image
                            source={require("../assets/images/pencilIcon.png")}
                            style={{ width: 20, height: 20 }}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>그룹 코드</Text>
                  <View style={styles.infoInputRow}>
                    <Text style={styles.infoText}>{group.code}</Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>그룹 비밀번호</Text>
                  <View style={styles.infoInputRow}>
                    <Text style={styles.infoText}>
                      {showPassword
                        ? groupPassword
                        : "*".repeat(groupPassword.length)}
                    </Text>
                    <TouchableOpacity
                      style={styles.iconButtonSmall}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Image
                        source={
                          showPassword
                            ? require("../assets/images/eyeOffIcon.png")
                            : require("../assets/images/eyeIcon.png")
                        }
                        style={{ width: 24, height: 24, resizeMode: "contain" }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyGroupInfo}
                >
                  <Text style={styles.copyButtonText}>복사</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* 그룹 색 변경 모달 */}
      <Modal
        visible={colorModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setColorModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setColorModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>그룹 색상 변경</Text>
                </View>
                <View style={styles.colorGrid}>
                  {Object.keys(groups).map((key) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSelectedColorKey(key)}
                      style={styles.colorCircleWrapper}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: groups[key].checkbox },
                        ]}
                      >
                        {selectedColorKey === key && (
                          <Image
                            source={require("../assets/images/checkIcon.png")}
                            style={styles.checkMark}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    onPress={() => setColorModalVisible(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.actionButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      // 여기에서 색상 변경 로직 호출
                      console.log("선택된 색상:", selectedColorKey);
                      setColorModalVisible(false);
                    }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>변경</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default GroupScreen;

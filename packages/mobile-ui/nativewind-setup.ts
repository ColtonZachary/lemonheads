import { cssInterop } from "nativewind";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
} from "react-native";

cssInterop(Pressable, { className: "style" });
cssInterop(RNText, { className: "style" });
cssInterop(TextInput, { className: "style" });
cssInterop(View, { className: "style" });
cssInterop(KeyboardAvoidingView, { className: "style" });
cssInterop(ScrollView, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

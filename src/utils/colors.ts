import { styleText } from "node:util";

export default {
  red: (text: string) => styleText("red", text),
  redBold: (text: string) => styleText(["red", "bold"], text),
  blue: (text: string) => styleText("blue", text),
  boldYellow: (text: string) => styleText(["bold", "yellow"], text),
  underItalic: (text: string) => styleText(["underline", "italic"], text),
  bold: (text: string) => styleText("bold", text),
  italic: (text: string) => styleText("italic", text),
  gray: (text: string) => styleText("gray", text),
  green: (text: string) => styleText("green", text),
  whiteBold: (text: string) => styleText(["white", "bold"], text),
};

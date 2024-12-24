import { load } from "@tauri-apps/plugin-store";
import { create } from "zustand";

type State = {
  windowMovement: string;
};
type Actions = {
  updateWindowMovement: (state: string) => void;
};

const store = await load("store.json");
const windowMovement: string =
  (await store.get("window-movement")) || "titleBar";

export const useSettingsStore = create<State & Actions>((set) => ({
  windowMovement: windowMovement,
  updateWindowMovement: async (state) => {
    set({ windowMovement: state });
    await store.set("window-movement", state);
    await store.save();
  },
}));

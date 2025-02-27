import { open } from "@tauri-apps/plugin-dialog";
import * as path from "@tauri-apps/api/path";
import { SelectedFileList } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { ACCEPTED_EXTENSIONS } from "./constants";

export async function getFiles(directory?: boolean): Promise<SelectedFileList> {
  const files =
    (await open({
      filters: [
        {
          name: "Clipic",
          extensions: ACCEPTED_EXTENSIONS,
        },
      ],
      multiple: true,
      directory: directory || false,
    })) || [];

  if (directory) {
    return await invoke("read_opened_directories", { directories: files });
  } else {
    return await toFileList(files);
  }
}

export const toFileList = async (
  array: string[]
): Promise<SelectedFileList> => {
  return await Promise.all(
    array.map(async (file) => {
      return {
        fileName: await path.basename(file),
        filePath: file,
        fileExtension: await path.extname(file),
        thumbnailPath: null,
        duration: null,
      };
    })
  );
};

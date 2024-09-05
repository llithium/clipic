import { open } from "@tauri-apps/plugin-dialog";
import * as path from "@tauri-apps/api/path";
import { SelectedFileList } from "@/hooks/usePlayerStore";
import { invoke } from "@tauri-apps/api/core";

export async function getFiles(directory?: boolean): Promise<SelectedFileList> {
  const files =
    (await open({
      filters: [
        {
          name: "Video",
          extensions: [
            "mp4",
            "avi",
            "mkv",
            "mov",
            "flv",
            "webm",
            "wmv",
            "mpeg",
            "mkv",
            "m4v",
          ],
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

const toFileList = async (array: string[]): Promise<SelectedFileList> => {
  return await Promise.all(
    array.map(async (file) => {
      return {
        fileName: await path.basename(file),
        filePath: file,
        fileExtension: await path.extname(file),
      };
    })
  );
};

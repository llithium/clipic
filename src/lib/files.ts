import { open } from "@tauri-apps/plugin-dialog";
import * as path from "@tauri-apps/api/path";
import { SelectedFileList } from "@/hooks/usePlayerStore";

export async function getFiles() {
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
          ],
        },
      ],
      multiple: true,
      directory: false,
    })) || [];

  const fileList: SelectedFileList = await toFileList(files);
  return fileList;
}

const toFileList = async (array: string[]) => {
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

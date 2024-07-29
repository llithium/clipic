import { Button } from "@/components/ui/button";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [currentFileList, setCurrentFileList] = useState<string[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string>();

  async function handleFiles() {
    const fileList: string[] = await invoke("open_file_picker");
    setCurrentFileList(fileList);
  }
  useEffect(() => {
    currentFileList && setCurrentVideo(convertFileSrc(currentFileList[0]));
  }, [currentFileList]);
  return (
    <div>
      <Button onClick={handleFiles}>Files</Button>
      {currentFileList?.length > 0 ? (
        <video autoPlay controls src={currentVideo}></video>
      ) : null}
    </div>
  );
}

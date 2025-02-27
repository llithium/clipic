export type SelectedFileList = SelectedFile[];
export interface SelectedFile {
  fileName: string;
  filePath: string;
  fileExtension: string;
  thumbnailPath?: string | null;
  duration?: number | null;
}
export interface CurrentVideo {
  name: string;
  url: string;
  extension: string;
}

export enum OpenComponent {
  None,
  Home,
  Settings,
  Video,
}

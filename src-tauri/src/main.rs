// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    fs::{self, read_dir},
    os::windows::process::CommandExt,
    path::PathBuf,
    process::Command,
};

use anyhow::anyhow;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::task::{self, JoinHandle};

const EXTENSIONS: [&str; 17] = [
    "mp4", "webm", "ogg", "mov", "avi", "mkv", "m4v", "flv", "wmv", "3gp", "mpeg", "mpg", "mp3",
    "wav", "m4a", "aac", "flac",
];
const THUMBNAIL_LIMIT: usize = 200;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct File {
    file_name: String,
    file_path: PathBuf,
    file_extension: String,
    thumbnail_path: Option<PathBuf>,
    duration: Option<u32>,
}

struct AppData {
    opened_file_args: Option<Vec<File>>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_opened_directories,
            get_opened_file_args,
            generate_thumbnails
        ])
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            let mut file_list: Vec<File> = vec![];

            if args.len() > 1 {
                let file_path = PathBuf::from(&args[1]);
                let file = File {
                    file_name: file_path
                        .file_name()
                        .unwrap_or_default()
                        .to_owned()
                        .into_string()
                        .unwrap_or_default(),
                    file_path: file_path.clone(),
                    file_extension: file_path
                        .extension()
                        .unwrap_or_default()
                        .to_owned()
                        .to_string_lossy()
                        .to_string(),
                    thumbnail_path: None,
                    duration: None,
                };
                file_list.push(file);
                app.manage(AppData {
                    opened_file_args: Some(file_list),
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn read_opened_directories(directories: Vec<PathBuf>) -> Result<Vec<File>, ()> {
    let mut file_list = vec![];
    for dir in directories {
        let entries = if let Ok(entries) = read_dir(dir) {
            entries
        } else {
            return Err(());
        };
        for entry in entries {
            let entry = if let Ok(entry) = entry {
                entry
            } else {
                return Err(());
            };

            if !EXTENSIONS.contains(
                &entry
                    .path()
                    .extension()
                    .unwrap_or_default()
                    .to_str()
                    .unwrap_or_default(),
            ) {
                break;
            };

            let file = File {
                file_name: entry.file_name().into_string().unwrap_or_default(),
                file_path: entry.path(),
                file_extension: entry
                    .path()
                    .extension()
                    .unwrap_or_default()
                    .to_owned()
                    .to_string_lossy()
                    .to_string(),
                thumbnail_path: None,
                duration: None,
            };
            file_list.push(file)
        }
    }
    Ok(file_list)
}

#[tauri::command]
async fn get_opened_file_args(app: AppHandle) -> Option<Vec<File>> {
    let data = app.state::<AppData>();
    data.opened_file_args.as_ref().map(|files| files.to_vec())
}

#[tauri::command]
async fn generate_thumbnails(app: AppHandle, videos: Vec<File>) -> Result<Vec<File>, tauri::Error> {
    if !check_ffmpeg_installed().map_err(tauri::Error::Anyhow)? {
        return Err(tauri::Error::Anyhow(anyhow!(
            "FFmpeg is not installed or not in PATH."
        )));
    }
    let output_dir = app.path().app_data_dir().unwrap();
    let thumbnails_dir = output_dir.join("thumbnails");
    std::fs::create_dir_all(&thumbnails_dir)?;

    clean_thumbnail_dir(&app)?;
    let mut join_handles: Vec<JoinHandle<Result<File, tauri::Error>>> = Vec::new();
    for file in videos {
        let file_path = file.file_path.clone();
        let file_name = file.file_name.clone();
        let file_name_without_extension = PathBuf::from(file.file_name.clone())
            .file_stem()
            .unwrap_or_default()
            .to_owned()
            .to_string_lossy()
            .to_string();
        let file_extension = file.file_extension.clone();
        let output_dir_clone = output_dir.clone();
        let join_handle: JoinHandle<Result<File, tauri::Error>> = task::spawn(async move {
            let output_path = output_dir_clone.join(format!(
                "{}/thumbnails/{}.webp",
                output_dir_clone.display(),
                file_name_without_extension
            ));

            if output_path.exists() {
                return Ok(File {
                    file_name,
                    file_path,
                    file_extension,
                    thumbnail_path: Some(output_path),
                    duration: None,
                });
            }

            let _output = std::process::Command::new("ffmpeg")
                .arg("-i")
                .arg(&file.file_path)
                .arg("-ss")
                .arg("00:00:01")
                .arg("-vframes")
                .arg("1")
                .arg("-vf")
                .arg("scale=250:-1:force_original_aspect_ratio=decrease")
                .arg("-f")
                .arg("webp")
                .arg(&output_path)
                .creation_flags(0x08000000)
                .output()
                .map_err(|e| {
                    tauri::Error::Anyhow(anyhow!("Thumbnail generation failed {}", e));
                });

            Ok(File {
                file_name,
                file_path,
                file_extension,
                thumbnail_path: Some(output_path),
                duration: None,
            })
        });
        join_handles.push(join_handle);
    }
    let mut thumbnail_paths = Vec::new();

    for handle in join_handles {
        let result = handle
            .await
            .map_err(|e| tauri::Error::Anyhow(anyhow!("Task join error: {}", e)))??;
        thumbnail_paths.push(result);
    }
    Ok(thumbnail_paths)
}

fn clean_thumbnail_dir(app: &AppHandle) -> anyhow::Result<()> {
    let output_dir = app.path().app_data_dir().unwrap();
    let thumbnails_dir = output_dir.join("thumbnails");

    let mut entries: Vec<_> = read_dir(&thumbnails_dir)?
        .filter_map(Result::ok)
        .filter_map(|entry| {
            entry
                .metadata()
                .ok()
                .and_then(|metadata| metadata.created().ok().map(|created| (entry, created)))
        })
        .collect();

    let count = entries.len();

    if count > THUMBNAIL_LIMIT {
        entries.sort_by(|(_, time1), (_, time2)| time1.cmp(time2));

        let num_to_delete = count - THUMBNAIL_LIMIT;

        for i in 0..num_to_delete {
            if let Some((oldest_file, _)) = entries.get(i) {
                let path_to_remove = oldest_file.path();
                fs::remove_file(&path_to_remove)?;
            }
        }
    }
    Ok(())
}

fn check_ffmpeg_installed() -> anyhow::Result<bool> {
    let output = Command::new("ffmpeg")
        .arg("-version")
        .creation_flags(0x08000000)
        .output();

    match output {
        Ok(output) => Ok(output.status.success()),
        Err(e) => Err(anyhow!("Failed to execute ffmpeg: {}", e)),
    }
}

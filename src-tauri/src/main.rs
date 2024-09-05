// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{ffi::OsString, fs::read_dir, path::PathBuf};

const EXTENSIONS: [&str; 9] = [
    "mp4", "avi", "mkv", "mov", "flv", "webm", "wmv", "mpeg", "m4v",
];

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct File {
    file_name: String,
    file_path: PathBuf,
    file_extension: OsString,
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_opened_directories])
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
                file_extension: entry.path().extension().unwrap_or_default().to_owned(),
            };
            file_list.push(file)
        }
    }
    Ok(file_list)
}

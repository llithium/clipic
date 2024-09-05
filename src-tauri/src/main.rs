// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{ffi::OsString, path::PathBuf};
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
    let file_list = directories
        .iter()
        .flat_map(|dir| dir.read_dir().unwrap())
        .map(|entry| {
            let entry = entry.unwrap();
            File {
                file_name: entry.file_name().into_string().unwrap_or_default(),
                file_path: entry.path(),
                file_extension: entry.path().extension().unwrap_or_default().to_owned(),
            }
        })
        .collect();
    Ok(file_list)
}

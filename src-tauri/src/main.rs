// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;

use tauri::api::dialog::blocking::FileDialogBuilder;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_file_picker,
            open_dropped_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
#[derive(Debug, serde::Serialize)]
struct File {
    file_name: String,
    file_path: PathBuf,
    file_extension: String,
}

#[tauri::command]
async fn open_file_picker() -> Result<Vec<File>, ()> {
    match FileDialogBuilder::new()
        .add_filter(
            "video",
            &[
                "mp4", "avi", "mkv", "mov", "flv", "webm", "wmv", "mpeg", "mkv",
            ],
        )
        .pick_files()
    {
        Some(files) => {
            let file_list: Vec<File> = files
                .iter()
                .map(|file| File {
                    file_name: file
                        .file_stem()
                        .unwrap_or_default()
                        .to_str()
                        .unwrap()
                        .to_owned(),
                    file_path: file.clone(),
                    file_extension: file.extension().unwrap().to_str().unwrap().to_string(),
                })
                .collect();
            Ok(file_list)
        }
        None => Err(()),
    }
}

#[tauri::command]
async fn open_dropped_files(files: Vec<PathBuf>) -> Result<Vec<File>, ()> {
    let file_list = files
        .iter()
        .map(|file| File {
            file_name: file
                .file_stem()
                .unwrap_or_default()
                .to_str()
                .unwrap()
                .to_owned(),
            file_path: file.clone(),
            file_extension: file.extension().unwrap().to_str().unwrap().to_string(),
        })
        .collect();
    Ok(file_list)
}

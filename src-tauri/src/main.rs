// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;

use tauri::api::dialog::blocking::FileDialogBuilder;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_file_picker])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn open_file_picker() -> Result<Vec<PathBuf>, ()> {
    match FileDialogBuilder::new().pick_files() {
        Some(files) => Ok(files),
        None => Err(()),
    }
}

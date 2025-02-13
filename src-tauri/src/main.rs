// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{ffi::OsString, fs::read_dir, path::PathBuf};

use tauri::{AppHandle, Manager};

const EXTENSIONS: [&str; 9] = [
    "mp4", "avi", "mkv", "mov", "flv", "webm", "wmv", "mpeg", "m4v",
];

#[derive(Debug, serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct File {
    file_name: String,
    file_path: PathBuf,
    file_extension: OsString,
}

struct AppData {
    opened_file_args: Vec<File>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_opened_directories,
            get_opened_file_args
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
                    file_extension: file_path.extension().unwrap_or_default().to_owned(),
                };
                file_list.push(file);
            }
            app.manage(AppData {
                opened_file_args: file_list,
            });
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
                file_extension: entry.path().extension().unwrap_or_default().to_owned(),
            };
            file_list.push(file)
        }
    }
    Ok(file_list)
}

#[tauri::command]
async fn get_opened_file_args(app: AppHandle) -> Result<Vec<File>, ()> {
    let data = app.state::<AppData>();
    let opened_file_args = &data.opened_file_args;
    Ok(opened_file_args.to_vec())
}

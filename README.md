\# ☁️ Cloud Based Meta File Storage Service



A full-stack cloud-based file storage and sharing application inspired by platforms like Google Drive.



The application allows users to securely manage files and folders, upload files to cloud storage, share files with other users, create public share links, search files, star important files, and manage deleted files through trash and restore functionality.



\---



\## 🚀 Features



\### 🔐 Authentication

\- User registration and login

\- JWT-based authentication

\- Protected API endpoints

\- Secure password hashing



\### 📁 File \& Folder Management

\- Create folders

\- Create nested folders

\- Rename folders

\- Move folders

\- Upload files

\- Download files

\- Rename files

\- Delete files

\- Restore deleted files

\- Permanent file deletion



\### ⭐ File Organization

\- Star / unstar files

\- Search files by name

\- Filter files by content type

\- Sorting

\- Pagination



\### 👥 File Sharing

\- Share files with registered users

\- Viewer permission

\- Editor permission

\- Shared With Me section

\- Download shared files

\- Update sharing permissions

\- Remove sharing access



\### 🔗 Public File Sharing

\- Generate public share links

\- Password-protected public links

\- Link expiration

\- Revoke public links

\- Secure signed download URLs



\### 🗑️ Trash Management

\- Move files to trash

\- Restore files

\- Permanently delete files



\### ☁️ Cloud Storage

\- Supabase Storage integration

\- Private storage bucket

\- Signed upload URLs

\- Signed download URLs



\---



\## 🛠️ Tech Stack



\### Backend

\- Java

\- Spring Boot

\- Spring Security

\- JWT

\- Spring Data JPA

\- Hibernate

\- PostgreSQL

\- Maven



\### Frontend

\- React

\- TypeScript

\- Vite

\- Tailwind CSS

\- Axios

\- React Router



\### Cloud Storage

\- Supabase Storage



\---



\## 🏗️ Architecture



```text

┌──────────────────────┐

│      React UI        │

│   TypeScript/Vite    │

└──────────┬───────────┘

&#x20;          │

&#x20;          │ REST API

&#x20;          ▼

┌──────────────────────┐

│    Spring Boot       │

│       Backend        │

│                      │

│ Spring Security/JWT  │

│ Controllers          │

│ Services             │

│ JPA/Hibernate        │

└───────┬────────┬─────┘

&#x20;       │        │

&#x20;       │        │

&#x20;       ▼        ▼

┌────────────┐ ┌─────────────────┐

│ PostgreSQL │ │ Supabase        │

│            │ │ Storage         │

│ Metadata   │ │ Actual Files    │

└────────────┘ └─────────────────┘


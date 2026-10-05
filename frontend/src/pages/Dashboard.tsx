import { useEffect, useState } from "react";
import api from "../api/axios";
import ShareModal from "../components/ShareModal.tsx";

interface Folder {
  id: number;
  name: string;
}

interface FileItem {
  id: number;
  name: string;
  originalName: string;
  contentType: string;
  size: number;
  starred: boolean;
}

interface SharedFile {
  id: number;
  fileId: number;
  fileName: string;
  originalName: string;
  contentType: string;
  size: number;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  sharedWithId: number;
  sharedWithName: string;
  sharedWithEmail: string;
  permission: "VIEWER" | "EDITOR";
  createdAt: string;
}

interface Breadcrumb {
  id: number | null;
  name: string;
}

function Dashboard() {
  const userName =
    localStorage.getItem("userName") || "User";

  // =========================================================
  // STATE
  // =========================================================

  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] =
    useState<SharedFile[]>([]);


  const [loading, setLoading] = useState(true);

  const [currentFolderId, setCurrentFolderId] =
    useState<number | null>(null);

  const [currentFolderName, setCurrentFolderName] =
    useState("My Drive");

  const [breadcrumbs, setBreadcrumbs] = useState<
    Breadcrumb[]
  >([
    {
      id: null,
      name: "My Drive",
    },
  ]);

  // Views

  const [showTrash, setShowTrash] = useState(false);

  const [showSharedWithMe, setShowSharedWithMe] =
    useState(false);

  const [showStarred, setShowStarred] =
    useState(false);

  // Sharing

  const [shareFile, setShareFile] =
    useState<FileItem | null>(null);

  // Delete / restore

  const [deletingFileId, setDeletingFileId] =
    useState<number | null>(null);

  const [restoringFileId, setRestoringFileId] =
    useState<number | null>(null);

  const [
    permanentlyDeletingFileId,
    setPermanentlyDeletingFileId,
  ] = useState<number | null>(null);

  const [starringFileId, setStarringFileId] =
    useState<number | null>(null);

  // New folder

  const [showNewMenu, setShowNewMenu] =
    useState(false);

  const [showFolderModal, setShowFolderModal] =
    useState(false);

  const [folderName, setFolderName] =
    useState("");

  const [creatingFolder, setCreatingFolder] =
    useState(false);

  // Upload

  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");


  // Search & Filters

const [searchTerm, setSearchTerm] =
  useState("");

const [fileTypeFilter, setFileTypeFilter] =
  useState("");

const [searching, setSearching] =
  useState(false);

  // Pagination

  const [currentPage, setCurrentPage] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const [totalElements, setTotalElements] =
    useState(0);

  const [pageSize, setPageSize] =
    useState(10);

  // Sorting
  const [sortOption, setSortOption] =
    useState("updatedAt,desc");

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  const loadDashboard = async (
    folderId: number | null,
    page = 0,
    size = pageSize,
    sort = sortOption
  ) => {
    try {
      setLoading(true);
      setUploadError("");

      const folderResponse = await api.get(
        "/folders",
        {
          params:
            folderId !== null
              ? {
                  parentId: folderId,
                }
              : {},
        }
      );

      const fileResponse = await api.get(
        "/files",
        {
          params: {
            ...(folderId !== null
              ? {
                  folderId: folderId,
                }
              : {}),
            page,
            size,
            sort,
          },
        }
      );

      console.log(
        "FOLDER API RESPONSE:",
        folderResponse.data
      );

      console.log(
        "FILE API RESPONSE:",
        fileResponse.data
      );

      const folderData = Array.isArray(
        folderResponse.data
      )
        ? folderResponse.data
        : folderResponse.data?.data ||
          folderResponse.data?.folders ||
          folderResponse.data?.content ||
          [];

      const fileData = Array.isArray(
        fileResponse.data
      )
        ? fileResponse.data
        : fileResponse.data?.content ||
          fileResponse.data?.data ||
          fileResponse.data?.files ||
          [];

      const responseTotalPages = Array.isArray(fileResponse.data)
        ? 1
        : Number(fileResponse.data?.totalPages ?? 1);

      const responseTotalElements = Array.isArray(fileResponse.data)
        ? fileData.length
        : Number(
            fileResponse.data?.totalElements ?? fileData.length
          );

      setFolders(folderData);
      setFiles(fileData);
      setCurrentPage(page);
      setTotalPages(Math.max(responseTotalPages, 1));
      setTotalElements(responseTotalElements);
    } catch (error: any) {
      console.error(
        "DASHBOARD LOAD ERROR:",
        error
      );

      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD TRASH
  // =========================================================

  const loadTrash = async () => {
    try {
      setLoading(true);
      setUploadError("");

      const response = await api.get(
        "/files/trash"
      );

      const trashData = Array.isArray(
        response.data
      )
        ? response.data
        : response.data?.data ||
          response.data?.files ||
          response.data?.content ||
          [];

      setFiles(trashData);
      setFolders([]);
    } catch (error: any) {
      console.error(
        "TRASH LOAD ERROR:",
        error
      );

      if (error.response?.status === 401) {
        handleLogout();
        return;
      }

      setUploadError(
        error.response?.data?.message ||
          "Failed to load Trash."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD SHARED WITH ME
  // =========================================================

  const loadSharedFiles = async () => {
    try {
      setLoading(true);
      setUploadError("");

      const response = await api.get(
        "/shares/shared-with-me"
      );

      const sharedData = Array.isArray(
        response.data
      )
        ? response.data
        : response.data?.data ||
          response.data?.shares ||
          response.data?.content ||
          [];

      console.log(
        "SHARED WITH ME RESPONSE:",
        sharedData
      );

      setSharedFiles(sharedData);

      setFolders([]);
      setFiles([]);
    } catch (error: any) {
      console.error(
        "SHARED FILES LOAD ERROR:",
        error
      );

      if (error.response?.status === 401) {
        handleLogout();
        return;
      }

      setUploadError(
        error.response?.data?.message ||
          "Failed to load shared files."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD STARRED FILES
  // =========================================================

  const loadStarredFiles = async () => {
    try {
      setLoading(true);
      setUploadError("");

      const response = await api.get(
        "/files/starred"
      );

      const starredData = Array.isArray(
        response.data
      )
        ? response.data
        : response.data?.data ||
          response.data?.files ||
          response.data?.content ||
          [];

      console.log(
        "STARRED FILES RESPONSE:",
        starredData
      );

      setFiles(starredData);
      setFolders([]);
    } catch (error: any) {
      console.error(
        "STARRED FILES LOAD ERROR:",
        error
      );

      if (error.response?.status === 401) {
        handleLogout();
        return;
      }

      setUploadError(
        error.response?.data?.message ||
          "Failed to load starred files."
      );
    } finally {
      setLoading(false);
    }
  };


// =========================================================
// SEARCH FILES
// =========================================================

const handleSearch = async (
  page = 0,
  size = pageSize,
  sort = sortOption
) => {
  if (
    searchTerm.trim() === "" &&
    fileTypeFilter === ""
  ) {
    await loadDashboard(
      currentFolderId,
      page,
      size,
      sort
    );
    return;
  }

  try {
    setSearching(true);
    setUploadError("");

    // The backend endpoint accepts either "name" or "contentType".
    // If a filename is entered, filename search takes priority.
    const params: any = {
      page,
      size,
      sort,
    };

    if (searchTerm.trim() !== "") {
      params.name = searchTerm.trim();
    } else if (fileTypeFilter !== "") {
      params.contentType = fileTypeFilter;
    }

    const response = await api.get(
      "/files/search",
      {
        params,
      }
    );

    const searchData = Array.isArray(
      response.data
    )
      ? response.data
      : response.data?.content ||
        response.data?.data ||
        response.data?.files ||
        [];

    const responseTotalPages = Array.isArray(response.data)
      ? 1
      : Number(response.data?.totalPages ?? 1);

    const responseTotalElements = Array.isArray(response.data)
      ? searchData.length
      : Number(
          response.data?.totalElements ?? searchData.length
        );

    console.log(
      "SEARCH RESPONSE:",
      response.data
    );

    setFolders([]);
    setFiles(searchData);
    setCurrentPage(page);
    setTotalPages(Math.max(responseTotalPages, 1));
    setTotalElements(responseTotalElements);
  } catch (error: any) {
    console.error(
      "SEARCH ERROR:",
      error
    );

    if (error.response?.status === 401) {
      handleLogout();
      return;
    }

    setUploadError(
      error.response?.data?.message ||
        "Failed to search files."
    );
  } finally {
    setSearching(false);
  }
};

// =========================================================
// CLEAR SEARCH
// =========================================================

const handleClearSearch = async () => {
  setSearchTerm("");
  setFileTypeFilter("");
  setUploadError("");
  await loadDashboard(currentFolderId, 0, pageSize);
};

// =========================================================
// PAGINATION
// =========================================================

const handlePageChange = async (page: number) => {
  if (
    page < 0 ||
    page >= totalPages ||
    page === currentPage ||
    loading ||
    searching
  ) {
    return;
  }

  if (
    searchTerm.trim() !== "" ||
    fileTypeFilter !== ""
  ) {
    await handleSearch(page, pageSize, sortOption);
    return;
  }

  await loadDashboard(
    currentFolderId,
    page,
    pageSize,
    sortOption
  );
};

const handlePageSizeChange = async (
  event: React.ChangeEvent<HTMLSelectElement>
) => {
  const newSize = Number(event.target.value);

  setPageSize(newSize);
  setCurrentPage(0);

  if (
    searchTerm.trim() !== "" ||
    fileTypeFilter !== ""
  ) {
    await handleSearch(0, newSize, sortOption);
    return;
  }

  await loadDashboard(
    currentFolderId,
    0,
    newSize,
    sortOption
  );
};

  // =========================================================
  // SORTING
  // =========================================================

  const handleSortChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newSort = event.target.value;

    setSortOption(newSort);
    setCurrentPage(0);

    if (
      searchTerm.trim() !== "" ||
      fileTypeFilter !== ""
    ) {
      await handleSearch(0, pageSize, newSort);
      return;
    }

    await loadDashboard(
      currentFolderId,
      0,
      pageSize,
      newSort
    );
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDashboard(null, 0, pageSize);
  }, []);

  // =========================================================
  // STAR / UNSTAR FILE
  // =========================================================

  const handleStarToggle = async (file: FileItem) => {
    try {
      setStarringFileId(file.id);

      if (file.starred) {
        await api.delete(`/files/${file.id}/star`);
      } else {
        await api.post(`/files/${file.id}/star`);
      }

      if (showStarred) {
        await loadStarredFiles();
      } else {
        setFiles((previous) =>
          previous.map((item) =>
            item.id === file.id
              ? { ...item, starred: !file.starred }
              : item
          )
        );
      }
    } catch (error: any) {
      console.error(
        "STAR TOGGLE ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update starred status."
      );
    } finally {
      setStarringFileId(null);
    }
  };

  // =========================================================
  // FOLDER CLICK
  // =========================================================

  const handleFolderClick = async (
    folder: Folder
  ) => {
    setShowTrash(false);
    setShowSharedWithMe(false);
    setShowStarred(false);

    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);

    setBreadcrumbs((previous) => [
      ...previous,
      {
        id: folder.id,
        name: folder.name,
      },
    ]);

    await loadDashboard(folder.id, 0, pageSize);
  };

  // =========================================================
  // BREADCRUMB CLICK
  // =========================================================

  const handleBreadcrumbClick = async (
    breadcrumb: Breadcrumb,
    index: number
  ) => {
    setShowTrash(false);
    setShowSharedWithMe(false);
    setShowStarred(false);

    setCurrentFolderId(breadcrumb.id);
    setCurrentFolderName(breadcrumb.name);

    setBreadcrumbs((previous) =>
      previous.slice(0, index + 1)
    );

    await loadDashboard(
      breadcrumb.id,
      0,
      pageSize
    );
  };

  // =========================================================
  // CREATE FOLDER MODAL
  // =========================================================

  const openCreateFolderModal = () => {
    if (
      showTrash ||
      showSharedWithMe ||
      showStarred
    ) {
      return;
    }

    setShowNewMenu(false);
    setFolderName("");
    setShowFolderModal(true);
  };

  // =========================================================
  // CREATE FOLDER
  // =========================================================

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      alert(
        "Please enter a folder name."
      );
      return;
    }

    try {
      setCreatingFolder(true);

      const params: any = {
        name: folderName.trim(),
      };

      if (currentFolderId !== null) {
        params.parentId =
          currentFolderId;
      }

      await api.post(
        "/folders",
        null,
        {
          params,
        }
      );

      setFolderName("");
      setShowFolderModal(false);
      setShowNewMenu(false);

      await loadDashboard(
        currentFolderId,
        currentPage,
        pageSize
      );

      alert(
        "Folder created successfully!"
      );
    } catch (error: any) {
      console.error(
        "CREATE FOLDER ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to create folder. Please try again."
      );
    } finally {
      setCreatingFolder(false);
    }
  };

  // =========================================================
  // FILE UPLOAD
  // =========================================================

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      if (currentFolderId !== null) {
        formData.append(
          "folderId",
          String(currentFolderId)
        );
      }

      console.log(
        "================================="
      );

      console.log(
        "UPLOAD STARTED"
      );

      console.log(
        "File:",
        selectedFile.name
      );

      console.log(
        "Size:",
        selectedFile.size
      );

      console.log(
        "Type:",
        selectedFile.type
      );

      console.log(
        "Folder ID:",
        currentFolderId
      );

      console.log(
        "================================="
      );

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const response = await fetch(
        "http://localhost:8080/api/files/upload",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      console.log(
        "Upload HTTP status:",
        response.status
      );

      const responseText =
        await response.text();

      console.log(
        "Upload response:",
        responseText
      );

      if (!response.ok) {
        let errorMessage =
          "File upload failed.";

        try {
          const errorData =
            JSON.parse(
              responseText
            );

          errorMessage =
            errorData.message ||
            errorData.error ||
            errorMessage;
        } catch {
          if (responseText) {
            errorMessage =
              responseText;
          }
        }

        throw new Error(
          errorMessage
        );
      }

      const uploadedFile =
        responseText
          ? JSON.parse(
              responseText
            )
          : null;

      console.log(
        "UPLOAD SUCCESS:",
        uploadedFile
      );

      await loadDashboard(
        currentFolderId,
        0,
        pageSize
      );

      alert(
        "File uploaded successfully!"
      );
    } catch (error: any) {
      console.error(
        "================================="
      );

      console.error(
        "UPLOAD ERROR:",
        error
      );

      console.error(
        "================================="
      );

      setUploadError(
        error.message ||
          "File upload failed. Please try again."
      );
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  };

  // =========================================================
  // MOVE FILE TO TRASH
  // =========================================================

  const handleDeleteFile = async (
    file: FileItem
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to move "${file.name}" to Trash?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingFileId(
        file.id
      );

      await api.delete(
        `/files/${file.id}`
      );

      const nextPage =
        currentPage > 0 && files.length === 1
          ? currentPage - 1
          : currentPage;

      await loadDashboard(
        currentFolderId,
        nextPage,
        pageSize
      );

      alert(
        "File moved to Trash."
      );
    } catch (error: any) {
      console.error(
        "DELETE FILE ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to move file to Trash."
      );
    } finally {
      setDeletingFileId(null);
    }
  };

  // =========================================================
  // RESTORE FILE
  // =========================================================

  const handleRestoreFile = async (
    file: FileItem
  ) => {
    try {
      setRestoringFileId(
        file.id
      );

      await api.put(
        `/files/${file.id}/restore`
      );

      await loadTrash();

      alert(
        "File restored successfully."
      );
    } catch (error: any) {
      console.error(
        "RESTORE FILE ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to restore file."
      );
    } finally {
      setRestoringFileId(null);
    }
  };

  // =========================================================
  // PERMANENT DELETE
  // =========================================================

  const handlePermanentDeleteFile =
    async (file: FileItem) => {
      const confirmed =
        window.confirm(
          `PERMANENTLY DELETE "${file.name}"?\n\nThis will remove the file from cloud storage and cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setPermanentlyDeletingFileId(
          file.id
        );

        await api.delete(
          `/files/${file.id}/permanent`
        );

        await loadTrash();

        alert(
          "File permanently deleted."
        );
      } catch (error: any) {
        console.error(
          "PERMANENT DELETE ERROR:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to permanently delete file."
        );
      } finally {
        setPermanentlyDeletingFileId(
          null
        );
      }
    };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "userName"
    );

    localStorage.removeItem(
      "userEmail"
    );

    window.location.href =
      "/login";
  };

  // =========================================================
  // MY DRIVE
  // =========================================================

  const handleMyDriveClick =
    async () => {
      setShowTrash(false);
      setShowSharedWithMe(false);
      setShowStarred(false);

      setCurrentFolderId(null);
      setCurrentFolderName(
        "My Drive"
      );

      setBreadcrumbs([
        {
          id: null,
          name: "My Drive",
        },
      ]);

      await loadDashboard(
        null,
        0,
        pageSize
      );
    };

  // =========================================================
  // TRASH
  // =========================================================

  const handleTrashClick =
    async () => {
      setShowNewMenu(false);

      setShowTrash(true);
      setShowSharedWithMe(false);
      setShowStarred(false);

      setCurrentFolderId(null);
      setCurrentFolderName(
        "Trash"
      );

      setBreadcrumbs([
        {
          id: null,
          name: "Trash",
        },
      ]);

      await loadTrash();
    };

  // =========================================================
  // SHARED WITH ME
  // =========================================================

  const handleSharedWithMeClick =
    async () => {
      setShowNewMenu(false);

      setShowTrash(false);
      setShowSharedWithMe(true);
      setShowStarred(false);

      setCurrentFolderId(null);

      setCurrentFolderName(
        "Shared with me"
      );

      setBreadcrumbs([
        {
          id: null,
          name: "Shared with me",
        },
      ]);

      await loadSharedFiles();
    };

  // =========================================================
  // STARRED
  // =========================================================

  const handleStarredClick = async () => {
    setShowNewMenu(false);
    setShowTrash(false);
    setShowSharedWithMe(false);
    setShowStarred(true);

    setCurrentFolderId(null);
    setCurrentFolderName("Starred");

    setBreadcrumbs([
      {
        id: null,
        name: "Starred",
      },
    ]);

    await loadStarredFiles();
  };

  // =========================================================
  // FORMAT FILE SIZE
  // =========================================================

  const formatFileSize = (
    bytes: number
  ) => {
    if (bytes === 0) {
      return "0 Bytes";
    }

    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB",
    ];

    const index = Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    );

    return `${(
      bytes /
      Math.pow(
        1024,
        index
      )
    ).toFixed(
      index === 0 ? 0 : 2
    )} ${units[index]}`;
  };

  // =========================================================
  // FILE ICON
  // =========================================================

  const getFileIcon = (
    contentType: string
  ) => {
    if (
      contentType.includes(
        "pdf"
      )
    ) {
      return "📕";
    }

    if (
      contentType.includes(
        "image"
      )
    ) {
      return "🖼️";
    }

    if (
      contentType.includes(
        "word"
      )
    ) {
      return "📘";
    }

    if (
      contentType.includes(
        "excel"
      ) ||
      contentType.includes(
        "spreadsheet"
      )
    ) {
      return "📗";
    }

    if (
      contentType.includes(
        "powerpoint"
      ) ||
      contentType.includes(
        "presentation"
      )
    ) {
      return "📙";
    }

    if (
      contentType.includes(
        "text"
      )
    ) {
      return "📄";
    }

    if (
      contentType.includes(
        "zip"
      )
    ) {
      return "🗜️";
    }

    return "📄";
  };

  // =========================================================
  // DOWNLOAD SHARED FILE
  // =========================================================

  const handleDownloadSharedFile =
    async (
      sharedFile: SharedFile
    ) => {
      try {
        const response =
          await api.get(
            `/files/${sharedFile.fileId}/download`
          );

        const signedUrl =
          response.data;

        window.open(
          signedUrl,
          "_blank",
          "noopener,noreferrer"
        );
      } catch (error: any) {
        console.error(
          "SHARED FILE DOWNLOAD ERROR:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Failed to download shared file."
        );
      }
    };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor:
          "#f8fafc",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        style={{
          width: "240px",
          backgroundColor:
            "#ffffff",
          borderRight:
            "1px solid #e5e7eb",
          padding: "20px",
          boxSizing:
            "border-box",
          position:
            "relative",
        }}
      >
        {/* Logo */}

        <div
          style={{
            fontSize: "22px",
            fontWeight:
              "bold",
            color:
              "#2563eb",
            marginBottom:
              "30px",
          }}
        >
          ☁ Cloud Storage
        </div>

        {/* New */}

        {!showTrash &&
          !showSharedWithMe &&
          !showStarred && (
            <div
              style={{
                position:
                  "relative",
                marginBottom:
                  "25px",
              }}
            >
              <button
                onClick={() =>
                  setShowNewMenu(
                    !showNewMenu
                  )
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "12px",
                  border: "none",
                  borderRadius:
                    "8px",
                  backgroundColor:
                    "#2563eb",
                  color:
                    "#ffffff",
                  fontSize:
                    "15px",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                }}
              >
                + New
              </button>

              {showNewMenu && (
                <div
                  style={{
                    position:
                      "absolute",
                    top:
                      "50px",
                    left: 0,
                    width:
                      "100%",
                    backgroundColor:
                      "#ffffff",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "8px",
                    boxShadow:
                      "0 5px 15px rgba(0,0,0,0.1)",
                    zIndex:
                      100,
                    overflow:
                      "hidden",
                  }}
                >
                  <label
                    htmlFor="new-menu-file-upload"
                    style={{
                      display:
                        "block",
                      padding:
                        "12px 15px",
                      cursor:
                        uploading
                          ? "not-allowed"
                          : "pointer",
                      color:
                        uploading
                          ? "#9ca3af"
                          : "#111827",
                    }}
                  >
                    {uploading
                      ? "⏳ Uploading..."
                      : "⬆ Upload File"}
                  </label>

                  <input
                    id="new-menu-file-upload"
                    type="file"
                    style={{
                      display:
                        "none",
                    }}
                    onChange={(
                      event
                    ) => {
                      setShowNewMenu(
                        false
                      );

                      handleFileUpload(
                        event
                      );
                    }}
                    disabled={
                      uploading
                    }
                  />

                  <button
                    onClick={
                      openCreateFolderModal
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px 15px",
                      border:
                        "none",
                      backgroundColor:
                        "#ffffff",
                      textAlign:
                        "left",
                      cursor:
                        "pointer",
                      color:
                        "#111827",
                      fontSize:
                        "14px",
                    }}
                  >
                    📁 New Folder
                  </button>
                </div>
              )}
            </div>
          )}

        {/* Navigation */}

        <nav>
          {/* My Drive */}

          <div
            onClick={
              handleMyDriveClick
            }
            style={{
              padding:
                "12px",
              borderRadius:
                "7px",
              cursor:
                "pointer",
              backgroundColor:
                !showTrash &&
                !showSharedWithMe &&
                !showStarred &&
                currentFolderId ===
                  null
                  ? "#eff6ff"
                  : "transparent",
              color:
                !showTrash &&
                !showSharedWithMe &&
                currentFolderId ===
                  null
                  ? "#2563eb"
                  : "#374151",
              fontWeight:
                !showTrash &&
                !showSharedWithMe &&
                currentFolderId ===
                  null
                  ? "bold"
                  : "normal",
              marginBottom:
                "5px",
            }}
          >
            📂 My Drive
          </div>

          {/* Starred */}

          <div
            onClick={
              handleStarredClick
            }
            style={{
              padding:
                "12px",
              borderRadius:
                "7px",
              cursor:
                "pointer",
              backgroundColor:
                showStarred
                  ? "#fffbeb"
                  : "transparent",
              color:
                showStarred
                  ? "#d97706"
                  : "#374151",
              fontWeight:
                showStarred
                  ? "bold"
                  : "normal",
              marginBottom:
                "5px",
            }}
          >
            ⭐ Starred
          </div>

          {/* Shared With Me */}

          <div
            onClick={
              handleSharedWithMeClick
            }
            style={{
              padding:
                "12px",
              borderRadius:
                "7px",
              cursor:
                "pointer",
              backgroundColor:
                showSharedWithMe
                  ? "#eff6ff"
                  : "transparent",
              color:
                showSharedWithMe
                  ? "#2563eb"
                  : "#374151",
              fontWeight:
                showSharedWithMe
                  ? "bold"
                  : "normal",
              marginBottom:
                "5px",
            }}
          >
            👥 Shared with me
          </div>

          {/* Trash */}

          <div
            onClick={
              handleTrashClick
            }
            style={{
              padding:
                "12px",
              borderRadius:
                "7px",
              cursor:
                "pointer",
              backgroundColor:
                showTrash
                  ? "#fef2f2"
                  : "transparent",
              color:
                showTrash
                  ? "#dc2626"
                  : "#374151",
              fontWeight:
                showTrash
                  ? "bold"
                  : "normal",
            }}
          >
            🗑️ Trash
          </div>
        </nav>

        {/* Logout */}

        <div
          style={{
            position:
              "absolute",
            bottom:
              "25px",
            left:
              "20px",
            right:
              "20px",
          }}
        >
          <button
            onClick={
              handleLogout
            }
            style={{
              width:
                "100%",
              padding:
                "11px",
              border:
                "1px solid #e5e7eb",
              borderRadius:
                "7px",
              backgroundColor:
                "#ffffff",
              cursor:
                "pointer",
              color:
                "#dc2626",
              fontWeight:
                "bold",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main
        style={{
          flex: 1,
          padding:
            "25px 35px",
          boxSizing:
            "border-box",
        }}
      >
        {/* Header */}

        <header
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "25px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize:
                  "26px",
                color:
                  "#111827",
              }}
            >
              {currentFolderName}
            </h1>

            <p
              style={{
                marginTop:
                  "6px",
                marginBottom: 0,
                color:
                  "#6b7280",
              }}
            >
              Welcome,{" "}
              {userName}
            </p>
          </div>

          {/* Upload */}

          {!showTrash &&
            !showSharedWithMe &&
            !showStarred && (
              <div>
                <label
                  htmlFor="main-file-upload"
                  style={{
                    display:
                      "inline-block",
                    padding:
                      "10px 18px",
                    backgroundColor:
                      uploading
                        ? "#9ca3af"
                        : "#2563eb",
                    color:
                      "#ffffff",
                    borderRadius:
                      "7px",
                    cursor:
                      uploading
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      "bold",
                  }}
                >
                  {uploading
                    ? "⏳ Uploading..."
                    : "⬆ Upload"}
                </label>

                <input
                  id="main-file-upload"
                  type="file"
                  style={{
                    display:
                      "none",
                  }}
                  onChange={
                    handleFileUpload
                  }
                  disabled={
                    uploading
                  }
                />
              </div>
            )}
        </header>

        {/* Breadcrumbs */}

        {!showTrash &&
          !showSharedWithMe &&
          !showStarred && (
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap:
                  "8px",
                marginBottom:
                  "20px",
                fontSize:
                  "14px",
                color:
                  "#6b7280",
                flexWrap:
                  "wrap",
              }}
            >
              {breadcrumbs.map(
                (
                  breadcrumb,
                  index
                ) => {
                  const isLast =
                    index ===
                    breadcrumbs.length -
                      1;

                  return (
                    <div
                      key={`${breadcrumb.id}-${index}`}
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          "8px",
                      }}
                    >
                      <span
                        onClick={() =>
                          !isLast &&
                          handleBreadcrumbClick(
                            breadcrumb,
                            index
                          )
                        }
                        style={{
                          cursor:
                            isLast
                              ? "default"
                              : "pointer",
                          color:
                            isLast
                              ? "#111827"
                              : "#2563eb",
                          fontWeight:
                            isLast
                              ? "bold"
                              : "normal",
                        }}
                      >
                        {
                          breadcrumb.name
                        }
                      </span>

                      {!isLast && (
                        <span>
                          ›
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}

        {/* =====================================================
            SEARCH & FILTERS
        ====================================================== */}

        {!showTrash &&
          !showSharedWithMe &&
          !showStarred && (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  value={searchTerm}
                  placeholder="Search files by name..."
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  style={{
                    flex: "1 1 280px",
                    minWidth: "220px",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                    outline: "none",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />

                <select
                  value={fileTypeFilter}
                  onChange={(event) => {
                    setFileTypeFilter(event.target.value);
                    setSearchTerm("");
                  }}
                  style={{
                    flex: "0 1 190px",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <option value="">All file types</option>
                  <option value="application/pdf">PDF</option>
                  <option value="image/jpeg">JPEG Image</option>
                  <option value="image/png">PNG Image</option>
                  <option value="text/plain">Text</option>
                  <option value="application/msword">Word</option>
                  <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                    Word DOCX
                  </option>
                  <option value="application/vnd.ms-excel">
                    Excel
                  </option>
                  <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                    Excel XLSX
                  </option>
                  <option value="application/vnd.ms-powerpoint">
                    PowerPoint
                  </option>
                  <option value="application/vnd.openxmlformats-officedocument.presentationml.presentation">
                    PowerPoint PPTX
                  </option>
                </select>

                <select
                  value={sortOption}
                  onChange={handleSortChange}
                  disabled={searching || loading}
                  style={{
                    flex: "0 1 180px",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    fontSize: "14px",
                    cursor: searching || loading
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  <option value="updatedAt,desc">Newest first</option>
                  <option value="updatedAt,asc">Oldest first</option>
                  <option value="name,asc">Name A → Z</option>
                  <option value="name,desc">Name Z → A</option>
                </select>

                <button
                  onClick={() => handleSearch()}
                  disabled={searching}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "7px",
                    backgroundColor: searching
                      ? "#9ca3af"
                      : "#2563eb",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: searching
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {searching ? "Searching..." : "Search"}
                </button>

                {(searchTerm.trim() !== "" ||
                  fileTypeFilter !== "") && (
                  <button
                    onClick={handleClearSearch}
                    disabled={searching}
                    style={{
                      padding: "10px 16px",
                      border: "1px solid #d1d5db",
                      borderRadius: "7px",
                      backgroundColor: "#ffffff",
                      color: "#374151",
                      fontWeight: "600",
                      cursor: searching
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {(searchTerm.trim() !== "" ||
                fileTypeFilter !== "") && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {searchTerm.trim() !== ""
                    ? `Searching for: "${searchTerm.trim()}"`
                    : `Filtering by: ${fileTypeFilter}`}
                </div>
              )}
            </div>
          )}

        {/* Error */}

        {uploadError && (
          <div
            style={{
              backgroundColor:
                "#fee2e2",
              color:
                "#b91c1c",
              padding:
                "12px 15px",
              borderRadius:
                "8px",
              marginBottom:
                "20px",
              border:
                "1px solid #fecaca",
            }}
          >
            <strong>
              Error:
            </strong>{" "}
            {uploadError}
          </div>
        )}

        {/* =====================================================
            CONTENT
        ====================================================== */}

        {loading ? (
          <div
            style={{
              textAlign:
                "center",
              padding:
                "60px",
              color:
                "#6b7280",
            }}
          >
            Loading...
          </div>
        ) : showSharedWithMe ? (
          /* =====================================================
              SHARED WITH ME
          ====================================================== */

          <section>
            <h2
              style={{
                fontSize:
                  "18px",
                marginBottom:
                  "15px",
                color:
                  "#111827",
              }}
            >
              Shared with me
            </h2>

            {sharedFiles.length ===
            0 ? (
              <div
                style={{
                  backgroundColor:
                    "#ffffff",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius:
                    "10px",
                  padding:
                    "50px 20px",
                  textAlign:
                    "center",
                  color:
                    "#6b7280",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "45px",
                    marginBottom:
                      "10px",
                  }}
                >
                  👥
                </div>

                <div
                  style={{
                    fontSize:
                      "16px",
                    fontWeight:
                      "bold",
                    color:
                      "#374151",
                    marginBottom:
                      "5px",
                  }}
                >
                  No files shared
                  with you
                </div>

                <div>
                  Files shared by
                  other users will
                  appear here.
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor:
                    "#ffffff",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius:
                    "10px",
                  overflow:
                    "hidden",
                }}
              >
                {sharedFiles.map(
                  (
                    sharedFile,
                    index
                  ) => (
                    <div
                      key={
                        sharedFile.id
                      }
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        padding:
                          "15px 18px",
                        borderBottom:
                          index ===
                          sharedFiles.length -
                            1
                            ? "none"
                            : "1px solid #f1f5f9",
                        gap:
                          "15px",
                      }}
                    >
                      {/* File */}

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap:
                            "12px",
                          minWidth:
                            0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              "28px",
                            flexShrink:
                              0,
                          }}
                        >
                          {getFileIcon(
                            sharedFile.contentType
                          )}
                        </div>

                        <div
                          style={{
                            minWidth:
                              0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight:
                                "bold",
                              color:
                                "#111827",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                              maxWidth:
                                "500px",
                            }}
                            title={
                              sharedFile.fileName
                            }
                          >
                            {
                              sharedFile.fileName
                            }
                          </div>

                          <div
                            style={{
                              fontSize:
                                "13px",
                              color:
                                "#6b7280",
                              marginTop:
                                "4px",
                            }}
                          >
                            Shared by{" "}
                            {
                              sharedFile.ownerName
                            }
                            {" • "}
                            {formatFileSize(
                              sharedFile.size
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Permission */}

                      <div
                        style={{
                          padding:
                            "5px 10px",
                          borderRadius:
                            "20px",
                          backgroundColor:
                            sharedFile.permission ===
                            "EDITOR"
                              ? "#eff6ff"
                              : "#f3f4f6",
                          color:
                            sharedFile.permission ===
                            "EDITOR"
                              ? "#2563eb"
                              : "#4b5563",
                          fontSize:
                            "12px",
                          fontWeight:
                            "bold",
                          flexShrink:
                            0,
                        }}
                      >
                        {
                          sharedFile.permission
                        }
                      </div>

                      {/* Download */}

                      <button
                        onClick={() =>
                          handleDownloadSharedFile(
                            sharedFile
                          )
                        }
                        style={{
                          border:
                            "1px solid #e5e7eb",
                          backgroundColor:
                            "#ffffff",
                          padding:
                            "7px 12px",
                          borderRadius:
                            "6px",
                          cursor:
                            "pointer",
                          color:
                            "#374151",
                          flexShrink:
                            0,
                        }}
                      >
                        Download
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        ) : showStarred ? (
          /* =====================================================
              STARRED
          ====================================================== */

          <section>
            <h2
              style={{
                fontSize: "18px",
                marginBottom: "15px",
                color: "#111827",
              }}
            >
              Starred Files
            </h2>

            {files.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "50px 20px",
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                <div
                  style={{
                    fontSize: "45px",
                    marginBottom: "10px",
                  }}
                >
                  ⭐
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#374151",
                    marginBottom: "5px",
                  }}
                >
                  No starred files
                </div>
                <div>
                  Star your important files and they will appear here.
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {files.map((file, index) => (
                  <div
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "15px 18px",
                      borderBottom:
                        index === files.length - 1
                          ? "none"
                          : "1px solid #f1f5f9",
                      gap: "15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          flexShrink: 0,
                        }}
                      >
                        {getFileIcon(file.contentType)}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: "#111827",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "500px",
                          }}
                          title={file.name}
                        >
                          {file.name}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            marginTop: "3px",
                          }}
                        >
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexShrink: 0,
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => handleStarToggle(file)}
                        disabled={starringFileId === file.id}
                        title="Remove from Starred"
                        style={{
                          border: "1px solid #fde68a",
                          backgroundColor: "#fffbeb",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          cursor:
                            starringFileId === file.id
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "18px",
                        }}
                      >
                        {starringFileId === file.id ? "⏳" : "⭐"}
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            const response = await api.get(
                              `/files/${file.id}/download`
                            );
                            window.open(
                              response.data,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          } catch (error: any) {
                            console.error(
                              "DOWNLOAD ERROR:",
                              error
                            );
                            alert(
                              error.response?.data?.message ||
                                "Failed to download file."
                            );
                          }
                        }}
                        style={{
                          border: "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                          padding: "7px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          color: "#374151",
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* =================================================
                FOLDERS
            ================================================== */}

            {!showTrash &&
              searchTerm.trim() === "" &&
              fileTypeFilter === "" &&
              folders.length >
                0 && (
                <section
                  style={{
                    marginBottom:
                      "35px",
                  }}
                >
                  <h2
                    style={{
                      fontSize:
                        "18px",
                      marginBottom:
                        "15px",
                      color:
                        "#111827",
                    }}
                  >
                    Folders
                  </h2>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap:
                        "15px",
                    }}
                  >
                    {folders.map(
                      (
                        folder
                      ) => (
                        <div
                          key={
                            folder.id
                          }
                          onClick={() =>
                            handleFolderClick(
                              folder
                            )
                          }
                          style={{
                            backgroundColor:
                              "#ffffff",
                            border:
                              "1px solid #e5e7eb",
                            borderRadius:
                              "10px",
                            padding:
                              "18px",
                            cursor:
                              "pointer",
                          }}
                          onMouseEnter={(
                            event
                          ) => {
                            event.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.08)";
                          }}
                          onMouseLeave={(
                            event
                          ) => {
                            event.currentTarget.style.boxShadow =
                              "none";
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "30px",
                              marginBottom:
                                "10px",
                            }}
                          >
                            📁
                          </div>

                          <div
                            style={{
                              fontWeight:
                                "bold",
                              color:
                                "#111827",
                              wordBreak:
                                "break-word",
                            }}
                          >
                            {
                              folder.name
                            }
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

            {/* =================================================
                FILES
            ================================================== */}

            <section>
              <h2
                style={{
                  fontSize:
                    "18px",
                  marginBottom:
                    "15px",
                  color:
                    "#111827",
                }}
              >
                {showTrash
                  ? "Files in Trash"
                  : searchTerm.trim() !== ""
                  ? "Search Results"
                  : fileTypeFilter !== ""
                  ? "Filtered Files"
                  : "Files"}
              </h2>

              {files.length ===
              0 ? (
                <div
                  style={{
                    backgroundColor:
                      "#ffffff",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "10px",
                    padding:
                      "50px 20px",
                    textAlign:
                      "center",
                    color:
                      "#6b7280",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "45px",
                      marginBottom:
                        "10px",
                    }}
                  >
                    {showTrash
                      ? "🗑️"
                      : "📄"}
                  </div>

                  <div
                    style={{
                      fontSize:
                        "16px",
                      fontWeight:
                        "bold",
                      color:
                        "#374151",
                      marginBottom:
                        "5px",
                    }}
                  >
                    {showTrash
                      ? "Trash is empty"
                      : "No files here"}
                  </div>

                  <div>
                    {showTrash
                      ? "Deleted files will appear here."
                      : "Upload a file to get started."}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor:
                      "#ffffff",
                    border:
                      "1px solid #e5e7eb",
                    borderRadius:
                      "10px",
                    overflow:
                      "hidden",
                  }}
                >
                  {files.map(
                    (
                      file,
                      index
                    ) => (
                      <div
                        key={
                          file.id
                        }
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          padding:
                            "15px 18px",
                          borderBottom:
                            index ===
                            files.length -
                              1
                              ? "none"
                              : "1px solid #f1f5f9",
                          gap:
                            "15px",
                        }}
                      >
                        {/* File info */}

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "12px",
                            minWidth:
                              0,
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "28px",
                              flexShrink:
                                0,
                            }}
                          >
                            {getFileIcon(
                              file.contentType
                            )}
                          </div>

                          <div
                            style={{
                              minWidth:
                                0,
                            }}
                          >
                            <div
                              style={{
                                fontWeight:
                                  "bold",
                                color:
                                  "#111827",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap",
                                maxWidth:
                                  "500px",
                              }}
                              title={
                                file.name
                              }
                            >
                              {
                                file.name
                              }
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "13px",
                                color:
                                  "#6b7280",
                                marginTop:
                                  "3px",
                              }}
                            >
                              {formatFileSize(
                                file.size
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                            flexShrink:
                              0,
                            flexWrap:
                              "wrap",
                            justifyContent:
                              "flex-end",
                          }}
                        >
                          {!showTrash ? (
                            <>
                              {/* Star */}

                              <button
                                onClick={() =>
                                  handleStarToggle(file)
                                }
                                disabled={
                                  starringFileId === file.id
                                }
                                title={
                                  file.starred
                                    ? "Unstar file"
                                    : "Star file"
                                }
                                style={{
                                  border:
                                    "1px solid #fde68a",
                                  backgroundColor:
                                    file.starred
                                      ? "#fffbeb"
                                      : "#ffffff",
                                  padding:
                                    "7px 10px",
                                  borderRadius:
                                    "6px",
                                  cursor:
                                    starringFileId ===
                                    file.id
                                      ? "not-allowed"
                                      : "pointer",
                                  fontSize:
                                    "18px",
                                }}
                              >
                                {starringFileId ===
                                file.id
                                  ? "⏳"
                                  : file.starred
                                  ? "⭐"
                                  : "☆"}
                              </button>

                              {/* Download */}

                              <button
                                onClick={async () => {
                                  try {
                                    const response =
                                      await api.get(
                                        `/files/${file.id}/download`
                                      );

                                    const signedUrl =
                                      response.data;

                                    window.open(
                                      signedUrl,
                                      "_blank",
                                      "noopener,noreferrer"
                                    );
                                  } catch (error: any) {
                                    console.error(
                                      "DOWNLOAD ERROR:",
                                      error
                                    );

                                    alert(
                                      error.response?.data?.message ||
                                        "Failed to download file."
                                    );
                                  }
                                }}
                                style={{
                                  border:
                                    "1px solid #e5e7eb",
                                  backgroundColor:
                                    "#ffffff",
                                  padding:
                                    "7px 12px",
                                  borderRadius:
                                    "6px",
                                  cursor:
                                    "pointer",
                                  color:
                                    "#374151",
                                }}
                              >
                                Download
                              </button>

                              {/* =================================================
                                  SHARE
                              ================================================== */}

                              <button
                                onClick={() =>
                                  setShareFile(
                                    file
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #bfdbfe",
                                  backgroundColor:
                                    "#eff6ff",
                                  padding:
                                    "7px 12px",
                                  borderRadius:
                                    "6px",
                                  cursor:
                                    "pointer",
                                  color:
                                    "#2563eb",
                                  fontWeight:
                                    "600",
                                }}
                              >
                                Share
                              </button>

                              {/* Delete */}

                              <button
                                disabled={
                                  deletingFileId ===
                                  file.id
                                }
                                onClick={() =>
                                  handleDeleteFile(
                                    file
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #fecaca",
                                  backgroundColor:
                                    deletingFileId ===
                                    file.id
                                      ? "#fca5a5"
                                      : "#fff1f2",
                                  padding:
                                    "7px 12px",
                                  borderRadius:
                                    "6px",
                                  cursor:
                                    deletingFileId ===
                                    file.id
                                      ? "not-allowed"
                                      : "pointer",
                                  color:
                                    "#dc2626",
                                  fontWeight:
                                    "600",
                                }}
                              >
                                {deletingFileId ===
                                file.id
                                  ? "Moving..."
                                  : "Delete"}
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Restore */}

                              <button
                                disabled={
                                  restoringFileId ===
                                  file.id
                                }
                                onClick={() =>
                                  handleRestoreFile(
                                    file
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #bbf7d0",
                                  backgroundColor:
                                    restoringFileId ===
                                    file.id
                                      ? "#86efac"
                                      : "#f0fdf4",
                                  padding:
                                    "7px 12px",
                                  borderRadius:
                                    "6px",
                                  cursor:
                                    restoringFileId ===
                                    file.id
                                      ? "not-allowed"
                                      : "pointer",
                                  color:
                                    "#16a34a",
                                  fontWeight:
                                    "600",
                                }}
                              >
                                {restoringFileId ===
                                file.id
                                  ? "Restoring..."
                                  : "Restore"}
                              </button>

                              {/* Permanent Delete */}

                              <button
                                disabled={
                                  permanentlyDeletingFileId ===
                                  file.id
                                }
                                onClick={() =>
                                  handlePermanentDeleteFile(
                                    file
                                  )
                                }
                                style={{
                                  border:
                                    "1px solid #fecaca",
                                  backgroundColor:
                                    permanentlyDeletingFileId ===
                                    file.id
                                      ? "#fca5a5"
                                      : "#dc2626",
                                  padding:
                                    "7px 12px",
                                  borderRadius:
                                    "6px",
                                  cursor:
                                    permanentlyDeletingFileId ===
                                    file.id
                                      ? "not-allowed"
                                      : "pointer",
                                  color:
                                    "#ffffff",
                                  fontWeight:
                                    "600",
                                }}
                              >
                                {permanentlyDeletingFileId ===
                                file.id
                                  ? "Deleting..."
                                  : "Delete Permanently"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {!showTrash &&
                totalPages > 1 && (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "12px 15px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      Showing page {currentPage + 1} of {totalPages}
                      {totalElements > 0
                        ? ` • ${totalElements} file${totalElements === 1 ? "" : "s"}`
                        : ""}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        Per page:
                      </label>

                      <select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        disabled={loading || searching}
                        style={{
                          padding: "7px 9px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          backgroundColor: "#ffffff",
                          color: "#374151",
                          cursor:
                            loading || searching
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>

                      <button
                        onClick={() =>
                          handlePageChange(currentPage - 1)
                        }
                        disabled={
                          currentPage === 0 ||
                          loading ||
                          searching
                        }
                        style={{
                          padding: "7px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          backgroundColor:
                            currentPage === 0 || loading || searching
                              ? "#f3f4f6"
                              : "#ffffff",
                          color:
                            currentPage === 0 || loading || searching
                              ? "#9ca3af"
                              : "#374151",
                          cursor:
                            currentPage === 0 || loading || searching
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        ← Previous
                      </button>

                      <button
                        onClick={() =>
                          handlePageChange(currentPage + 1)
                        }
                        disabled={
                          currentPage >= totalPages - 1 ||
                          loading ||
                          searching
                        }
                        style={{
                          padding: "7px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          backgroundColor:
                            currentPage >= totalPages - 1 || loading || searching
                              ? "#f3f4f6"
                              : "#ffffff",
                          color:
                            currentPage >= totalPages - 1 || loading || searching
                              ? "#9ca3af"
                              : "#374151",
                          cursor:
                            currentPage >= totalPages - 1 || loading || searching
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
            </section>
          </>
        )}
      </main>

      {/* =====================================================
          CREATE FOLDER MODAL
      ====================================================== */}

      {showFolderModal &&
        !showTrash &&
        !showSharedWithMe &&
        !showStarred && (
          <div
            style={{
              position:
                "fixed",
              inset: 0,
              backgroundColor:
                "rgba(0,0,0,0.4)",
              display:
                "flex",
              justifyContent:
                "center",
              alignItems:
                "center",
              zIndex:
                200,
            }}
          >
            <div
              style={{
                width:
                  "400px",
                maxWidth:
                  "90%",
                backgroundColor:
                  "#ffffff",
                borderRadius:
                  "12px",
                padding:
                  "25px",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <h2
                style={{
                  marginTop:
                    0,
                  marginBottom:
                    "20px",
                  color:
                    "#111827",
                }}
              >
                Create New Folder
              </h2>

              <input
                type="text"
                placeholder="Folder name"
                value={
                  folderName
                }
                onChange={(
                  event
                ) =>
                  setFolderName(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    handleCreateFolder();
                  }
                }}
                autoFocus
                style={{
                  width:
                    "100%",
                  padding:
                    "11px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "7px",
                  boxSizing:
                    "border-box",
                  fontSize:
                    "14px",
                  outline:
                    "none",
                }}
              />

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "10px",
                  marginTop:
                    "20px",
                }}
              >
                <button
                  onClick={() => {
                    setShowFolderModal(
                      false
                    );

                    setFolderName(
                      ""
                    );
                  }}
                  style={{
                    padding:
                      "10px 16px",
                    border:
                      "1px solid #d1d5db",
                    backgroundColor:
                      "#ffffff",
                    borderRadius:
                      "7px",
                    cursor:
                      "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleCreateFolder
                  }
                  disabled={
                    creatingFolder
                  }
                  style={{
                    padding:
                      "10px 16px",
                    border:
                      "none",
                    backgroundColor:
                      creatingFolder
                        ? "#9ca3af"
                        : "#2563eb",
                    color:
                      "#ffffff",
                    borderRadius:
                      "7px",
                    cursor:
                      creatingFolder
                        ? "not-allowed"
                        : "pointer",
                    fontWeight:
                      "bold",
                  }}
                >
                  {creatingFolder
                    ? "Creating..."
                    : "Create Folder"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          SHARE MODAL
      ====================================================== */}

      {shareFile && (
        <ShareModal
          fileId={
            shareFile.id
          }
          fileName={
            shareFile.name
          }
          onClose={() =>
            setShareFile(null)
          }
        />
      )}
    </div>
  );
}

export default Dashboard;
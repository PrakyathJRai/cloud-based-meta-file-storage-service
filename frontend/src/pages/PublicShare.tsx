import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import "./PublicShare.css";

interface PublicFileResponse {
  downloadUrl?: string;
  signedUrl?: string;
  url?: string;
  fileName?: string;
  name?: string;
  originalName?: string;
  contentType?: string;
  size?: number;
}

function PublicShare() {
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("Shared File");

  // =========================================================
  // CHECK PUBLIC LINK
  // =========================================================

  useEffect(() => {
    if (!token) {
      setError("Invalid public share link.");
      setChecking(false);
      return;
    }

    checkPublicLink();
  }, [token]);

  // =========================================================
  // CHECK LINK WITHOUT PASSWORD
  // =========================================================

  const checkPublicLink = async () => {
    if (!token) {
      return;
    }

    try {
      setChecking(true);
      setError("");
      setSuccess("");

      const response = await api.get(
        `/public/files/${token}`
      );

      handleSuccessfulResponse(response.data);

    } catch (error: any) {
      console.log(
        "PUBLIC LINK CHECK:",
        error.response?.data
      );

      /*
       * 401 is expected when the public link
       * is password protected.
       */

      if (error.response?.status === 401) {
        setError("");
      } else if (error.response?.status === 404) {
        setError(
          "This public link does not exist or has been revoked."
        );
      } else if (error.response?.status === 410) {
        setError(
          "This public link has expired."
        );
      } else {
        setError(
          getPublicLinkErrorMessage(error)
        );
      }

    } finally {
      setChecking(false);
    }
  };

  // =========================================================
  // ACCESS FILE WITH PASSWORD
  // =========================================================

  const handleAccessFile = async () => {
    if (!token) {
      setError("Invalid public share link.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await api.get(
        `/public/files/${token}`,
        {
          params: {
            password: password.trim(),
          },
        }
      );

      handleSuccessfulResponse(response.data);

    } catch (error: any) {
      console.error(
        "PUBLIC FILE ACCESS ERROR:",
        error
      );

      if (error.response?.status === 401) {
        setError(
          "Incorrect password. Please try again."
        );
      } else if (error.response?.status === 404) {
        setError(
          "This public link does not exist or has been revoked."
        );
      } else if (error.response?.status === 410) {
        setError(
          "This public link has expired."
        );
      } else {
        setError(
          getPublicLinkErrorMessage(error)
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // HANDLE SUCCESSFUL RESPONSE
  // =========================================================

  const handleSuccessfulResponse = (
    data: PublicFileResponse | string
  ) => {
    let url = "";
    let name = "Shared File";

    /*
     * Backend currently returns the signed URL
     * as a plain string.
     *
     * Also support object responses.
     */

    if (typeof data === "string") {
      url = data;
    } else {
      url =
        data.downloadUrl ||
        data.signedUrl ||
        data.url ||
        "";

      name =
        data.fileName ||
        data.name ||
        data.originalName ||
        "Shared File";
    }

    if (!url) {
      setError(
        "The server did not return a valid file URL."
      );
      return;
    }

    setFileUrl(url);
    setFileName(name);

    setSuccess(
      "File access granted successfully."
    );

    setError("");
  };

  // =========================================================
  // DOWNLOAD FILE
  // =========================================================

  const handleDownload = () => {
    if (!fileUrl) {
      return;
    }

    const link =
      document.createElement("a");

    link.href = fileUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================
  // OPEN FILE
  // =========================================================
  //
  // IMPORTANT:
  // We fetch the signed URL as a Blob first.
  // This prevents browsers from directly treating
  // the Supabase signed URL as a download.
  // =========================================================

  const handleOpenFile = async () => {
    if (!fileUrl) {
      return;
    }

    try {
      setError("");
      setSuccess("Opening file...");

      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to open file. HTTP ${response.status}`
        );
      }

      const blob = await response.blob();

      /*
       * Create a temporary browser URL for the Blob.
       */
      const blobUrl =
        window.URL.createObjectURL(blob);

      /*
       * Open the Blob URL in a new tab.
       */
      const newWindow = window.open(
        blobUrl,
        "_blank",
        "noopener,noreferrer"
      );

      if (!newWindow) {
        window.URL.revokeObjectURL(blobUrl);

        throw new Error(
          "The browser blocked the new tab. Please allow pop-ups for this site."
        );
      }

      /*
       * Keep the Blob URL alive long enough for
       * the browser to load the file.
       */
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);

      setSuccess(
        "File opened successfully."
      );

    } catch (error: any) {
      console.error(
        "OPEN FILE ERROR:",
        error
      );

      setError(
        error?.message ||
        "Unable to open the file."
      );

      setSuccess("");
    }
  };

  // =========================================================
  // ERROR MESSAGE
  // =========================================================

  const getPublicLinkErrorMessage = (
    error: any
  ) => {
    const responseData =
      error?.response?.data;

    if (typeof responseData === "string") {
      return responseData;
    }

    return (
      responseData?.message ||
      responseData?.error ||
      "Unable to access this public file."
    );
  };

  // =========================================================
  // CHECKING SCREEN
  // =========================================================

  if (checking) {
    return (
      <div className="public-share-page">

        <div className="public-share-card loading-card">

          <div className="public-share-logo">

            <div className="public-share-logo-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 15a4 4 0 0 1 4-4h1a5 5 0 0 1 10 0h1a4 4 0 0 1 0 8H7a4 4 0 0 1-4-4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </div>

            <div>

              <div className="public-share-brand">
                Cloud Storage
              </div>

              <div className="public-share-brand-subtitle">
                Secure file sharing
              </div>

            </div>

          </div>

          <div className="public-share-spinner" />

          <h1 className="loading-title">
            Checking shared file...
          </h1>

          <p className="public-share-subtitle">
            Please wait while we verify the public link.
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="public-share-page">

      <div className="public-share-container">

        {/* ===================================================
            BRAND
        ==================================================== */}

        <div className="public-share-brand-header">

          <div className="public-share-logo">

            <div className="public-share-logo-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 15a4 4 0 0 1 4-4h1a5 5 0 0 1 10 0h1a4 4 0 0 1 0 8H7a4 4 0 0 1-4-4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </div>

            <div>

              <div className="public-share-brand">
                Cloud Storage
              </div>

              <div className="public-share-brand-subtitle">
                Secure file sharing
              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            CARD
        ==================================================== */}

        <div className="public-share-card">

          {/* FILE HEADER */}

          <div className="public-share-file-header">

            <div className="file-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M14 2v6h6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M8 13h8M8 17h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

            </div>

            <div className="file-information">

              <span className="file-label">
                Shared file
              </span>

              <h2>
                {fileName}
              </h2>

            </div>

          </div>

          {/* CONTENT */}

          <div className="public-share-content">

            {/* ERROR */}

            {error && (
              <div className="public-share-alert error-alert">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 9v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  <path
                    d="M12 17h.01"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  <path
                    d="M10.29 3.86 2.93 16.61A1.5 1.5 0 0 0 4.23 19h15.54a1.5 1.5 0 0 0 1.3-2.39L13.71 3.86a2 2 0 0 0-3.42 0Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span>
                  {error}
                </span>

              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="public-share-alert success-alert">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m5 12 4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span>
                  {success}
                </span>

              </div>
            )}

            {/* =================================================
                FILE READY
            ================================================== */}

            {fileUrl ? (

              <div className="file-ready-section">

                <div className="file-ready-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 12 4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                </div>

                <h3>
                  File is ready
                </h3>

                <p>
                  You can now open or download the shared file.
                </p>

                <div className="file-action-buttons">

                  <button
                    type="button"
                    onClick={handleOpenFile}
                    className="secondary-button"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>

                    Open File
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="primary-button"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 3v12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />

                      <path
                        d="m7 10 5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M5 21h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>

                    Download
                  </button>

                </div>

              </div>

            ) : (

              /* =================================================
                 PASSWORD FORM
              ================================================== */

              <div className="password-section">

                <div className="password-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />

                    <path
                      d="M8 10V7a4 4 0 0 1 8 0v3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    <path
                      d="M12 14v3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>

                </div>

                <h3>
                  Password protected
                </h3>

                <p>
                  Enter the password provided by the file owner.
                </p>

                <div className="password-form">

                  <label htmlFor="public-password">
                    Password
                  </label>

                  <input
                    id="public-password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleAccessFile();
                      }
                    }}
                    placeholder="Enter password"
                    autoComplete="off"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={handleAccessFile}
                    disabled={loading}
                    className="primary-button full-width"
                  >
                    {loading ? (
                      <>
                        <span className="button-spinner" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />

                          <path
                            d="m13 6 6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        Access File
                      </>
                    )}
                  </button>

                </div>

              </div>
            )}

          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="public-share-card-footer">

            <p>
              This file was shared securely using Cloud Storage.
            </p>

          </div>

        </div>

        {/* SECURITY MESSAGE */}

        <div className="security-message">

          <span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            Secure access

          </span>

          <span>•</span>

          <span>
            Password protected
          </span>

          <span>•</span>

          <span>
            Signed URL
          </span>

        </div>

      </div>

    </div>
  );
}

export default PublicShare;
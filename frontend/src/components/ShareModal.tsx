import { useEffect, useState } from "react";



import api from "../api/axios";







interface FileShare {



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







interface PublicShareLink {

  id: number;

  fileId: number;

  token: string;

  publicUrl: string;

  createdAt: string;

  expiresAt: string | null;

  passwordProtected: boolean;

}



interface ShareModalProps {



  fileId: number;



  fileName: string;



  onClose: () => void;



}







function ShareModal({



  fileId,



  fileName,



  onClose,



}: ShareModalProps) {



  const [email, setEmail] = useState("");







  const [permission, setPermission] =



    useState<"VIEWER" | "EDITOR">("VIEWER");







  const [shares, setShares] = useState<FileShare[]>([]);







  const [loadingShares, setLoadingShares] =



    useState(true);







  const [sharing, setSharing] = useState(false);







  const [updatingShareId, setUpdatingShareId] =



    useState<number | null>(null);







  const [removingShareId, setRemovingShareId] =



    useState<number | null>(null);







  const [error, setError] = useState("");



  // Public share links

  const [publicLinks, setPublicLinks] = useState<PublicShareLink[]>([]);

  const [loadingPublicLinks, setLoadingPublicLinks] = useState(true);

  const [creatingPublicLink, setCreatingPublicLink] = useState(false);

  const [deletingPublicLinkId, setDeletingPublicLinkId] =

    useState<number | null>(null);

  const [publicPassword, setPublicPassword] = useState("");

  const [expiresInHours, setExpiresInHours] = useState(24);







  // ---------------------------------------



  // Load existing shares



  // ---------------------------------------







  const loadShares = async () => {



    try {



      setLoadingShares(true);



      setError("");







      const response = await api.get(



        `/shares/files/${fileId}`



      );







      const data = Array.isArray(response.data)



        ? response.data



        : response.data?.data ||



          response.data?.shares ||



          response.data?.content ||



          [];







      setShares(data);



    } catch (error: any) {



      console.error(



        "LOAD SHARES ERROR:",



        error



      );







      setError(



        error.response?.data?.message ||



          "Failed to load sharing information."



      );



    } finally {



      setLoadingShares(false);



    }



  };







  // ---------------------------------------



  // Load shares when modal opens



  // ---------------------------------------







  useEffect(() => {

    loadShares();

    loadPublicLinks();

  }, [fileId]);







  // ---------------------------------------



  // Share file



  // ---------------------------------------







  const handleShare = async () => {



    const trimmedEmail =



      email.trim();







    if (!trimmedEmail) {



      setError(



        "Please enter the user's email address."



      );



      return;



    }







    try {



      setSharing(true);



      setError("");







      await api.post(



        `/shares/files/${fileId}`,



        null,



        {



          params: {



            sharedWithEmail:



              trimmedEmail,



            permission,



          },



        }



      );







      setEmail("");



      setPermission("VIEWER");







      await loadShares();



    } catch (error: any) {



      console.error(



        "SHARE FILE ERROR:",



        error



      );







      setError(



        error.response?.data?.message ||



          "Failed to share the file."



      );



    } finally {



      setSharing(false);



    }



  };







  // ---------------------------------------



  // Change permission



  // ---------------------------------------







  const handlePermissionChange =



    async (



      shareId: number,



      newPermission:



        | "VIEWER"



        | "EDITOR"



    ) => {



      try {



        setUpdatingShareId(



          shareId



        );



        setError("");







        await api.put(



          `/shares/files/${fileId}/${shareId}`,



          null,



          {



            params: {



              permission:



                newPermission,



            },



          }



        );







        await loadShares();



      } catch (error: any) {



        console.error(



          "UPDATE PERMISSION ERROR:",



          error



        );







        setError(



          error.response?.data?.message ||



            "Failed to update permission."



        );



      } finally {



        setUpdatingShareId(null);



      }



    };







  // ---------------------------------------



  // Remove access



  // ---------------------------------------







  const handleRemoveShare =



    async (share: FileShare) => {



      const confirmed =



        window.confirm(



          `Remove ${share.sharedWithEmail}'s access to "${fileName}"?`



        );







      if (!confirmed) {



        return;



      }







      try {



        setRemovingShareId(



          share.id



        );



        setError("");







        await api.delete(



          `/shares/files/${fileId}/${share.id}`



        );







        await loadShares();



      } catch (error: any) {



        console.error(



          "REMOVE SHARE ERROR:",



          error



        );







        setError(



          error.response?.data?.message ||



            "Failed to remove access."



        );



      } finally {



        setRemovingShareId(null);



      }



    };







  // ---------------------------------------



  // Format date



  // ---------------------------------------









  // ---------------------------------------

  // Public share links

  // ---------------------------------------



  const loadPublicLinks = async () => {

    try {

      setLoadingPublicLinks(true);

      const response = await api.get(`/files/${fileId}/public-links`);

      const data = Array.isArray(response.data)

        ? response.data

        : response.data?.data || response.data?.links || response.data?.content || [];

      setPublicLinks(data);

    } catch (error: any) {

      console.error("LOAD PUBLIC LINKS ERROR:", error);

      setError(error.response?.data?.message || "Failed to load public links.");

    } finally {

      setLoadingPublicLinks(false);

    }

  };



  const handleCreatePublicLink = async () => {

    try {

      setCreatingPublicLink(true);

      setError("");

      const response = await api.post(`/files/${fileId}/public-links`, {

        password: publicPassword.trim() || null,

        expiresInHours,

      });

      setPublicLinks((previous) => [

        response.data as PublicShareLink,

        ...previous,

      ]);

      setPublicPassword("");

      await loadPublicLinks();

    } catch (error: any) {

      console.error("CREATE PUBLIC LINK ERROR:", error);

      setError(error.response?.data?.message || "Failed to create public link.");

    } finally {

      setCreatingPublicLink(false);

    }

  };



  const handleDeletePublicLink = async (link: PublicShareLink) => {

    if (!window.confirm(`Revoke this public link for "${fileName}"?`)) {

      return;

    }



    try {

      setDeletingPublicLinkId(link.id);

      setError("");

      await api.delete(`/files/${fileId}/public-links/${link.id}`);

      setPublicLinks((previous) =>

        previous.filter((item) => item.id !== link.id)

      );

    } catch (error: any) {

      console.error("DELETE PUBLIC LINK ERROR:", error);

      setError(error.response?.data?.message || "Failed to revoke public link.");

    } finally {

      setDeletingPublicLinkId(null);

    }

  };



  const getFrontendPublicUrl = (link: PublicShareLink) => {
    return `${window.location.origin}/share/${link.token}`;
  };

  const handleCopyPublicLink = async (publicUrl: string) => {

    try {

      await navigator.clipboard.writeText(publicUrl);

      window.alert("Public link copied!");

    } catch (error) {

      console.error("COPY PUBLIC LINK ERROR:", error);

      setError("Could not copy the link. Please copy it manually.");

    }

  };



  const formatDate = (



    dateString: string



  ) => {



    try {



      return new Date(



        dateString



      ).toLocaleDateString(



        undefined,



        {



          day: "2-digit",



          month: "short",



          year: "numeric",



        }



      );



    } catch {



      return dateString;



    }



  };







  // ---------------------------------------



  // UI



  // ---------------------------------------







  return (



    <div



      style={{



        position: "fixed",



        inset: 0,



        backgroundColor:



          "rgba(0, 0, 0, 0.45)",



        display: "flex",



        alignItems: "center",



        justifyContent: "center",



        zIndex: 1000,



        padding: "20px",



        boxSizing: "border-box",



      }}



    >



      <div



        style={{



          width: "520px",



          maxWidth: "100%",



          maxHeight: "90vh",



          overflowY: "auto",



          backgroundColor:



            "#ffffff",



          borderRadius: "12px",



          boxShadow:



            "0 20px 50px rgba(0,0,0,0.2)",



        }}



      >



        {/* ---------------------------------------



            Header



        --------------------------------------- */}







        <div



          style={{



            padding:



              "20px 22px",



            borderBottom:



              "1px solid #e5e7eb",



            display: "flex",



            justifyContent:



              "space-between",



            alignItems: "flex-start",



            gap: "15px",



          }}



        >



          <div>



            <h2



              style={{



                margin: 0,



                fontSize: "20px",



                color:



                  "#111827",



              }}



            >



              Share file



            </h2>







            <div



              style={{



                marginTop:



                  "6px",



                color:



                  "#6b7280",



                fontSize:



                  "14px",



                wordBreak:



                  "break-word",



              }}



            >



              {fileName}



            </div>



          </div>







          <button



            onClick={onClose}



            style={{



              border: "none",



              background:



                "transparent",



              fontSize: "22px",



              color:



                "#6b7280",



              cursor:



                "pointer",



              lineHeight: 1,



            }}



            aria-label="Close"



          >



            ×



          </button>



        </div>







        {/* ---------------------------------------



            Body



        --------------------------------------- */}







        <div



          style={{



            padding: "22px",



          }}



        >



          {/* Error */}







          {error && (



            <div



              style={{



                backgroundColor:



                  "#fee2e2",



                color:



                  "#b91c1c",



                border:



                  "1px solid #fecaca",



                padding:



                  "10px 12px",



                borderRadius:



                  "7px",



                fontSize:



                  "14px",



                marginBottom:



                  "18px",



              }}



            >



              {error}



            </div>



          )}







          {/* ---------------------------------------



              Add people



          --------------------------------------- */}







          <div>



            <label



              style={{



                display:



                  "block",



                fontSize:



                  "14px",



                fontWeight:



                  "bold",



                color:



                  "#374151",



                marginBottom:



                  "7px",



              }}



            >



              Add people



            </label>







            <input



              type="email"



              placeholder="Enter user's email"



              value={email}



              onChange={(



                event



              ) =>



                setEmail(



                  event.target



                    .value



                )



              }



              onKeyDown={(



                event



              ) => {



                if (



                  event.key ===



                    "Enter" &&



                  !sharing



                ) {



                  handleShare();



                }



              }}



              style={{



                width:



                  "100%",



                padding:



                  "10px 12px",



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



          </div>







          {/* ---------------------------------------



              Permission



          --------------------------------------- */}







          <div



            style={{



              marginTop:



                "14px",



            }}



          >



            <label



              style={{



                display:



                  "block",



                fontSize:



                  "14px",



                fontWeight:



                  "bold",



                color:



                  "#374151",



                marginBottom:



                  "7px",



              }}



            >



              Permission



            </label>







            <div



              style={{



                display:



                  "flex",



                gap: "10px",



              }}



            >



              <select



                value={



                  permission



                }



                onChange={(



                  event



                ) =>



                  setPermission(



                    event.target



                      .value as



                      | "VIEWER"



                      | "EDITOR"



                  )



                }



                style={{



                  flex: 1,



                  padding:



                    "10px 12px",



                  border:



                    "1px solid #d1d5db",



                  borderRadius:



                    "7px",



                  backgroundColor:



                    "#ffffff",



                  fontSize:



                    "14px",



                  cursor:



                    "pointer",



                }}



              >



                <option value="VIEWER">



                  Viewer — can view/download



                </option>







                <option value="EDITOR">



                  Editor — can edit



                </option>



              </select>







              <button



                onClick={



                  handleShare



                }



                disabled={



                  sharing



                }



                style={{



                  padding:



                    "10px 18px",



                  border: "none",



                  borderRadius:



                    "7px",



                  backgroundColor:



                    sharing



                      ? "#9ca3af"



                      : "#2563eb",



                  color:



                    "#ffffff",



                  fontWeight:



                    "bold",



                  cursor:



                    sharing



                      ? "not-allowed"



                      : "pointer",



                  whiteSpace:



                    "nowrap",



                }}



              >



                {sharing



                  ? "Sharing..."



                  : "Share"}



              </button>



            </div>



          </div>







          {/* ---------------------------------------

              Public link

          --------------------------------------- */}



          <div

            style={{

              marginTop: "28px",

              paddingTop: "24px",

              borderTop: "1px solid #e5e7eb",

            }}

          >

            <h3 style={{ margin: 0, marginBottom: "6px", fontSize: "16px", color: "#111827" }}>

              🔗 Public link

            </h3>



            <div style={{ marginBottom: "14px", color: "#6b7280", fontSize: "13px", lineHeight: 1.5 }}>

              Anyone with the link can access this file. Add an optional password and choose an expiry.

            </div>



            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "10px", marginBottom: "10px" }}>

              <input

                type="password"

                placeholder="Optional password"

                value={publicPassword}

                onChange={(event) => setPublicPassword(event.target.value)}

                style={{

                  width: "100%",

                  padding: "10px 12px",

                  border: "1px solid #d1d5db",

                  borderRadius: "7px",

                  boxSizing: "border-box",

                  fontSize: "14px",

                  outline: "none",

                }}

              />



              <select

                value={expiresInHours}

                onChange={(event) => setExpiresInHours(Number(event.target.value))}

                style={{

                  width: "100%",

                  padding: "10px 12px",

                  border: "1px solid #d1d5db",

                  borderRadius: "7px",

                  backgroundColor: "#ffffff",

                  fontSize: "14px",

                  cursor: "pointer",

                }}

              >

                <option value={1}>1 hour</option>

                <option value={24}>24 hours</option>

                <option value={48}>48 hours</option>

                <option value={72}>3 days</option>

                <option value={168}>7 days</option>

              </select>

            </div>



            <button

              onClick={handleCreatePublicLink}

              disabled={creatingPublicLink}

              style={{

                width: "100%",

                padding: "10px 14px",

                border: "none",

                borderRadius: "7px",

                backgroundColor: creatingPublicLink ? "#9ca3af" : "#111827",

                color: "#ffffff",

                fontWeight: "600",

                cursor: creatingPublicLink ? "not-allowed" : "pointer",

              }}

            >

              {creatingPublicLink ? "Creating..." : "Create public link"}

            </button>



            <div style={{ marginTop: "16px" }}>

              {loadingPublicLinks ? (

                <div style={{ padding: "14px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>

                  Loading public links...

                </div>

              ) : publicLinks.length === 0 ? (

                <div style={{ padding: "14px", border: "1px solid #e5e7eb", borderRadius: "8px", color: "#6b7280", fontSize: "13px", textAlign: "center" }}>

                  No public links created yet.

                </div>

              ) : (

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

                  {publicLinks.map((link) => (

                    <div

                      key={link.id}

                      style={{

                        padding: "12px",

                        border: "1px solid #e5e7eb",

                        borderRadius: "8px",

                        backgroundColor: "#f9fafb",

                      }}

                    >

                      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>

                        {link.passwordProtected ? "🔒 Password protected" : "🌐 No password"}{" "}

                        • Expires {link.expiresAt ? formatDate(link.expiresAt) : "Never"}

                      </div>



                      <div style={{ fontSize: "12px", color: "#374151", wordBreak: "break-all", marginBottom: "10px" }}>

                        {getFrontendPublicUrl(link)}

                      </div>



                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>

                        <button

                          onClick={() => handleCopyPublicLink(getFrontendPublicUrl(link))}

                          style={{

                            padding: "7px 10px",

                            border: "1px solid #d1d5db",

                            borderRadius: "6px",

                            backgroundColor: "#ffffff",

                            color: "#374151",

                            cursor: "pointer",

                            fontSize: "12px",

                            fontWeight: "600",

                          }}

                        >

                          Copy link

                        </button>



                        <button

                          onClick={() => handleDeletePublicLink(link)}

                          disabled={deletingPublicLinkId === link.id}

                          style={{

                            padding: "7px 10px",

                            border: "1px solid #fecaca",

                            borderRadius: "6px",

                            backgroundColor: "#fff1f2",

                            color: "#dc2626",

                            cursor: deletingPublicLinkId === link.id ? "not-allowed" : "pointer",

                            fontSize: "12px",

                            fontWeight: "600",

                          }}

                        >

                          {deletingPublicLinkId === link.id ? "Revoking..." : "Revoke link"}

                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>



          {/* ---------------------------------------



              Existing access



          --------------------------------------- */}







          <div



            style={{



              marginTop:



                "28px",



            }}



          >



            <h3



              style={{



                margin: 0,



                marginBottom:



                  "12px",



                fontSize:



                  "16px",



                color:



                  "#111827",



              }}



            >



              People with access



            </h3>







            {loadingShares ? (



              <div



                style={{



                  padding:



                    "25px",



                  textAlign:



                    "center",



                  color:



                    "#6b7280",



                  fontSize:



                    "14px",



                }}



              >



                Loading...



              </div>



            ) : shares.length ===



              0 ? (



              <div



                style={{



                  padding:



                    "20px",



                  border:



                    "1px solid #e5e7eb",



                  borderRadius:



                    "8px",



                  color:



                    "#6b7280",



                  fontSize:



                    "14px",



                  textAlign:



                    "center",



                }}



              >



                This file hasn't been



                shared with anyone yet.



              </div>



            ) : (



              <div



                style={{



                  border:



                    "1px solid #e5e7eb",



                  borderRadius:



                    "8px",



                  overflow:



                    "hidden",



                }}



              >



                {shares.map(



                  (



                    share,



                    index



                  ) => (



                    <div



                      key={



                        share.id



                      }



                      style={{



                        padding:



                          "13px 14px",



                        borderBottom:



                          index ===



                          shares.length -



                            1



                            ? "none"



                            : "1px solid #f1f5f9",



                      }}



                    >



                      <div



                        style={{



                          display:



                            "flex",



                          alignItems:



                            "center",



                          justifyContent:



                            "space-between",



                          gap:



                            "12px",



                        }}



                      >



                        <div



                          style={{



                            minWidth:



                              0,



                            flex: 1,



                          }}



                        >



                          <div



                            style={{



                              fontWeight:



                                "bold",



                              color:



                                "#111827",



                              fontSize:



                                "14px",



                              overflow:



                                "hidden",



                              textOverflow:



                                "ellipsis",



                              whiteSpace:



                                "nowrap",



                            }}



                            title={



                              share.sharedWithEmail



                            }



                          >



                            {



                              share.sharedWithName



                            }



                          </div>







                          <div



                            style={{



                              marginTop:



                                "3px",



                              fontSize:



                                "12px",



                              color:



                                "#6b7280",



                              overflow:



                                "hidden",



                              textOverflow:



                                "ellipsis",



                              whiteSpace:



                                "nowrap",



                            }}



                            title={



                              share.sharedWithEmail



                            }



                          >



                            {



                              share.sharedWithEmail



                            }



                          </div>







                          <div



                            style={{



                              marginTop:



                                "3px",



                              fontSize:



                                "11px",



                              color:



                                "#9ca3af",



                            }}



                          >



                            Shared{" "}



                            {



                              formatDate(



                                share.createdAt



                              )



                            }



                          </div>



                        </div>







                        {/* Permission */}







                        <select



                          value={



                            share.permission



                          }



                          disabled={



                            updatingShareId ===



                            share.id



                          }



                          onChange={(



                            event



                          ) =>



                            handlePermissionChange(



                              share.id,



                              event.target



                                .value as



                                | "VIEWER"



                                | "EDITOR"



                            )



                          }



                          style={{



                            padding:



                              "7px 9px",



                            border:



                              "1px solid #d1d5db",



                            borderRadius:



                              "6px",



                            backgroundColor:



                              "#ffffff",



                            fontSize:



                              "12px",



                            cursor:



                              updatingShareId ===



                              share.id



                                ? "not-allowed"



                                : "pointer",



                          }}



                        >



                          <option value="VIEWER">



                            Viewer



                          </option>







                          <option value="EDITOR">



                            Editor



                          </option>



                        </select>







                        {/* Remove */}







                        <button



                          onClick={() =>



                            handleRemoveShare(



                              share



                            )



                          }



                          disabled={



                            removingShareId ===



                            share.id



                          }



                          style={{



                            border:



                              "1px solid #fecaca",



                            backgroundColor:



                              "#fff1f2",



                            color:



                              "#dc2626",



                            padding:



                              "7px 10px",



                            borderRadius:



                              "6px",



                            cursor:



                              removingShareId ===



                              share.id



                                ? "not-allowed"



                                : "pointer",



                            fontSize:



                              "12px",



                            fontWeight:



                              "600",



                          }}



                        >



                          {removingShareId ===



                          share.id



                            ? "Removing..."



                            : "Remove"}



                        </button>



                      </div>



                    </div>



                  )



                )}



              </div>



            )}



          </div>



        </div>







        {/* ---------------------------------------



            Footer



        --------------------------------------- */}







        <div



          style={{



            padding:



              "15px 22px",



            borderTop:



              "1px solid #e5e7eb",



            display:



              "flex",



            justifyContent:



              "flex-end",



          }}



        >



          <button



            onClick={onClose}



            style={{



              padding:



                "9px 16px",



              border:



                "1px solid #d1d5db",



              borderRadius:



                "7px",



              backgroundColor:



                "#ffffff",



              color:



                "#374151",



              cursor:



                "pointer",



            }}



          >



            Done



          </button>



        </div>



      </div>



    </div>



  );



}







export default ShareModal;
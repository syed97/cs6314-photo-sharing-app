import React, { useContext, useRef, useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Button, Alert } from "@mui/material";
import "./styles.css";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { LoginContext } from "../../context/LoginContext";



function TopBar({viewContext, firstName}) {
  
  const {isLoggedIn, setIsLoggedIn, loginId} = useContext(LoginContext); // for login state
  const [photoSubmitText, setPhotoSubmitText] = useState(null); // for new photo submit alert
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // initialize navigate hook
  

  // Handle logout
  const handleLogout = async () => {
    axios.post("/admin/logout", {})
    .then((response) => {
      if (response.status === 200) {
        setIsLoggedIn(false);
        navigate("/");
      }
    })
    .catch((error) => {
      console.error("Error Logging Out:", error);
    });
  };

  // handle photo upload
  const handlePhotoSubmit = async () => {
    const fileInput = fileInputRef.current;
    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('uploadedphoto', fileInput.files[0]);

      try {
        const response = await axios.post("/photos/new", formData);
        if (response.status === 200) {
          setPhotoSubmitText("Photo added successfully");
        }
      } catch (err) {
        console.error("Photo upload error: ", err);
      }
    } else {
      console.log("No file selected!");
    }
  };

  // handle user account deletion
  const handleDeleteUser = async (user_id) => {
    axios.delete(`/deleteUser/${user_id}`)
    .then((response) => {
      if (response.data.logout) {
        setIsLoggedIn(false);
        navigate("/login-register");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  };

  // for clearing the alert message
  useEffect(() => {
    if (photoSubmitText) {
      const timeoutId = setTimeout(() => {
        setPhotoSubmitText(null);
      }, 4000); // Close after 3 seconds

      return () => clearTimeout(timeoutId); // Clear timeout on unmount
    }
    return undefined;
  }, [photoSubmitText]);

  return (
    <AppBar className="topbar-appBar" position="absolute">
      { isLoggedIn ? (
        <Toolbar className="toolbar">
        <div className="toolbar-left">
          <Typography variant="h5" color="inherit">
            Hi {firstName}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogout}
          >
            Logout
          </Button>
          <Button component={Link} to="/activities" variant="contained" color="primary">
            Activities
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => handleDeleteUser(loginId)}>
            Delete User
          </Button>
        </div>
          <Typography variant="h5" color="inherit">
            {viewContext}
          </Typography>
          <div className="toolbar-right">
            <input type="file" accept="image/*" ref={fileInputRef} />
            <Button variant="contained" color="secondary" onClick={handlePhotoSubmit}>
              Add Photo
            </Button>
          </div>
          { photoSubmitText && <Alert severity="success"> {photoSubmitText} </Alert>}
        </Toolbar>
      ) : (
        <Toolbar className="toolbar">
          <Typography variant="h5" color="inherit">
            Please Log In or Register
          </Typography>
        </Toolbar>
      )}
    </AppBar>
  );
}

export default TopBar;

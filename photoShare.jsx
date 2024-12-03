import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { Grid, Typography, Paper } from "@mui/material";
import { HashRouter, Route, Routes, useParams, useLocation } from "react-router-dom";

import "./styles/main.css";
import axios from "axios";
import { LoginContext } from "./context/LoginContext";
import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";
import ActivityDetail from "./components/ActivityDetail";


// entry to user detail route
function UserDetailRoute({setViewContext}) {
  const {userId} = useParams();

  useEffect(() => {
    axios.get(`/user/${userId}`)
      .then((response) => {
        const user = response.data;
        setViewContext(`Details for ${user.first_name} ${user.last_name}`);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, [userId, setViewContext]);

  return <UserDetail userId={userId} />;
}


// entry to user photos route
function UserPhotosRoute({setViewContext}) {
  const {userId} = useParams();

  useEffect(() => {
    axios.get(`/user/${userId}`)
      .then((response) => {
        const user = response.data;
        setViewContext(`Photos for ${user.first_name} ${user.last_name}`);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, [userId, setViewContext]);

  return <UserPhotos userId={userId} />;
}


// entry to activities route
function ActivityDetailRoute({setViewContext}) {
  useEffect(() => {
    setViewContext(`Activities`);
  }, [setViewContext]);

  return <ActivityDetail />;
}


function PhotoShare() {

  const [isLoggedIn, setIsLoggedIn] = useState(false); // login state variables
  const [firstName, setFirstName] = useState(""); // first name for display on TopBar
  const [loginId, setLoginId] = useState(null); // login id of currently logged in user to be shared across all components
  const [viewContext, setViewContext] = useState(''); // context (user details/photos) to show on top bar
  // for topbar context
  const location = useLocation();

  // Effect to reset viewContext to empty when the default route is visited
  useEffect(() => {
    if (location.pathname === "/") {
      axios.get("/test/info")
      .then((response) => {
        const version = response.data.__v;
        setViewContext(`Version = ${version}`); // Reset viewContext when on the default route
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
    }
  }, [location]);

    // UseMemo to memoize the context value
    const loginContextValue = useMemo(() => ({
      isLoggedIn,
      setIsLoggedIn,
      firstName,
      setFirstName,
      loginId,
      setLoginId
    }), [isLoggedIn, setIsLoggedIn, firstName, setFirstName, loginId, setLoginId]);

  return (
    <LoginContext.Provider value={loginContextValue}>
          <div>
            <Grid container spacing={2}>

              {/* TopBar */}
              <Grid item xs={12}>
                <TopBar viewContext={viewContext} firstName={firstName}/>
              </Grid>
              <div className="main-topbar-buffer" />

              {/* User List */}
              {
                isLoggedIn ? (
                  <Grid item sm={3}>
                    <Paper className="main-grid-item">
                      <UserList />
                    </Paper>
                  </Grid>
                ) : (
                  <Grid item sm={3}>
                    <Paper className="main-grid-item">
                      <Typography variant="body1">
                        User List Unavailable. Please Log in or Register
                      </Typography>
                    </Paper>
                  </Grid>
                )
              }
              {/* Main View */}
              <Grid item sm={9}>
                <Paper className="main-grid-item">
                  <Routes>
                    <Route path="/login-register" element={<LoginRegister/>} />
                    {isLoggedIn ? (
                      <Route 
                        path="/" 
                        element={(
                          <Typography variant="body1">
                            Welcome to the app!
                          </Typography>
                        )}
                      />
                    ) : (
                      <Route 
                        path="/" 
                        to="/login-register" 
                        element={<LoginRegister />} 
                      />
                    )}
                    {isLoggedIn ? <Route path="/users/:userId" element={<UserDetailRoute setViewContext={setViewContext}/>} /> : <Route path="/users/:userId" to="/login-register" element={<LoginRegister/>} />}
                    {isLoggedIn ? <Route path="/photos/:userId" element={<UserPhotosRoute setViewContext={setViewContext}/>} /> : <Route path="/photos/:userId" to="/login-register" element={<LoginRegister/>} />}
                    {isLoggedIn ? <Route path="/users" element={<UserList />} /> : <Route path="/users" to="/login-register" element={<LoginRegister/>} />}
                    {isLoggedIn ? <Route path="/activities" element={<ActivityDetailRoute setViewContext={setViewContext}/>} /> : <Route path="/activities" to="/login-register" element={<LoginRegister/>} />} {/* User Activity component */}
                  </Routes>
                </Paper>
              </Grid>
            </Grid>
          </div>
    </LoginContext.Provider>
  );
}


const root = ReactDOM.createRoot(document.getElementById("photoshareapp"));
root.render(
  <HashRouter>
    <PhotoShare />
  </HashRouter>
);
